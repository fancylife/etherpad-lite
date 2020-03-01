/**
 * Controls the security of pad access
 */

/*
 * 2011 Peter 'Pita' Martischka (Primary Technology Ltd)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var authorManager = require("./AuthorManager");
var hooks = require("ep_etherpad-lite/static/js/pluginfw/hooks.js");
var padManager = require("./PadManager");
var sessionManager = require("./SessionManager");
var settings = require("../utils/Settings");
var log4js = require('log4js');
var authLogger = log4js.getLogger("auth");

/**
 * This function controlls the access to a pad, it checks if the user can access a pad.
 * @param padID the pad the user wants to access
 * @param sessionCookie the session the user has (set via api)
 * @param token the token of the author (randomly generated at client side, used for public pads)
 * @param password the password the user has given to access this pad, can be null
 * @return {accessStatus: grant|deny|wrongPassword|needPassword, authorID: a.xxxxxx})
 */
exports.checkAccess = async function(padID, sessionCookie, token, password)
{
  // immutable object
  let deny = Object.freeze({ accessStatus: "deny" });

  if (!padID) {
    return deny;
  }

  // allow plugins to deny access
  var deniedByHook = hooks.callAll("onAccessCheck", {'padID': padID, 'password': password, 'token': token, 'sessionCookie': sessionCookie}).indexOf(false) > -1;
  if (deniedByHook) {
    return deny;
  }

  // start to get author for this token
  let p_tokenAuthor = authorManager.getAuthor4Token(token);

  // start to check if pad exists
  let p_padExists = padManager.doesPadExist(padID);

  if (settings.requireSession) {
    // a valid session is required (api-only mode)
    if (!sessionCookie) {
      // without sessionCookie, access is denied
      return deny;
    }
  } else {
    // a session is not required, so we'll check if it's a public pad
    if (padID.indexOf("$") === -1) {
      // it's not a group pad, means we can grant access

      // assume user has access
      let authorID = await p_tokenAuthor;
      let statusObject = { accessStatus: "grant", authorID };

      if (settings.editOnly) {
        // user can't create pads

        let padExists = await p_padExists;

        if (!padExists) {
          // pad doesn't exist - user can't have access
          statusObject.accessStatus = "deny";
        }
      }

      // user may create new pads - no need to check anything
      // grant access, with author of token
      return statusObject;
    }
  }

  let validSession = false;
  let sessionAuthor;
  let isPublic;
  let isPasswordProtected;
  let passwordStatus = password == null ? "notGiven" : "wrong"; // notGiven, correct, wrong

  // get information about all sessions contained in this cookie
  if (sessionCookie) {
    let groupID = padID.split("$")[0];
    let sessionIDs = sessionCookie.split(',');

    // was previously iterated in parallel using async.forEach
    try {
      let sessionInfos = await Promise.all(sessionIDs.map(sessionID => {
        return sessionManager.getSessionInfo(sessionID);
      }));

      // seperated out the iteration of sessioninfos from the (parallel) fetches from the DB
      for (let sessionInfo of sessionInfos) {
        // is it for this group?
        if (sessionInfo.groupID != groupID) {
          authLogger.debug("Auth failed: wrong group");
          continue;
        }

        // is validUntil still ok?
        let now = Math.floor(Date.now() / 1000);
        if (sessionInfo.validUntil <= now) {
          authLogger.debug("Auth failed: validUntil");
          continue;
        }

        // fall-through - there is a valid session
        validSession = true;
        sessionAuthor = sessionInfo.authorID;
        break;
      }
    } catch (err) {
      // skip session if it doesn't exist
      if (err.message == "sessionID does not exist") {
        authLogger.debug("Auth failed: unknown session");
      } else {
        throw err;
      }
    }
  }

  let padExists = await p_padExists;

  if (padExists) {
    let pad = await padManager.getPad(padID);

    // is it a public pad?
    isPublic = pad.getPublicStatus();

    // is it password protected?
    isPasswordProtected = pad.isPasswordProtected();

    // is password correct?
    if (isPasswordProtected && password && pad.isCorrectPassword(password)) {
      passwordStatus = "correct";
    }
  }

  // - a valid session for this group is avaible AND pad exists
  if (validSession && padExists) {
    let authorID = sessionAuthor;
    let grant = Object.freeze({ accessStatus: "grant", authorID });

    if (!isPasswordProtected) {
      // - the pad is not password protected

      // --> grant access
      return grant;
    }

    if (settings.sessionNoPassword) {
      // - the setting to bypass password validation is set

      // --> grant access
      return grant;
    }

    if (isPasswordProtected && passwordStatus === "correct") {
      // - the pad is password protected and password is correct

      // --> grant access
      return grant;
    }

    if (isPasswordProtected && passwordStatus === "wrong") {
      // - the pad is password protected but wrong password given

      // --> deny access, ask for new password and tell them that the password is wrong
      return { accessStatus: "wrongPassword" };
    }

    if (isPasswordProtected && passwordStatus === "notGiven") {
      // - the pad is password protected but no password given

      // --> ask for password
      return { accessStatus: "needPassword" };
    }

    throw new Error("Oops, something wrong happend");
  }

  if (validSession && !padExists) {
    // - a valid session for this group avaible but pad doesn't exist

    // --> grant access by default
    let accessStatus = "grant";
    let authorID = sessionAuthor;

    // --> deny access if user isn't allowed to create the pad
    if (settings.editOnly) {
      authLogger.debug("Auth failed: valid session & pad does not exist");
      accessStatus = "deny";
    }

    return { accessStatus, authorID };
  }

  if (!validSession && padExists) {
    // there is no valid session avaiable AND pad exists

    let authorID = await p_tokenAuthor;
    let grant = Object.freeze({ accessStatus: "grant", authorID });

    if (isPublic && !isPasswordProtected) {
      // -- it's public and not password protected

      // --> grant access, with author of token
      return grant;
    }

    if (isPublic && isPasswordProtected && passwordStatus === "correct") {
      // - it's public and password protected and password is correct

      // --> grant access, with author of token
      return grant;
    }

    if (isPublic && isPasswordProtected && passwordStatus === "wrong") {
      // - it's public and the pad is password protected but wrong password given

      // --> deny access, ask for new password and tell them that the password is wrong
      return { accessStatus: "wrongPassword" };
    }

    if (isPublic && isPasswordProtected && passwordStatus === "notGiven") {
      // - it's public and the pad is password protected but no password given

      // --> ask for password
      return { accessStatus: "needPassword" };
    }

    if (!isPublic) {
      // - it's not public

      authLogger.debug("Auth failed: invalid session & pad is not public");
      // --> deny access
      return { accessStatus: "deny" };
    }

    throw new Error("Oops, something wrong happend");
  }

  // there is no valid session avaiable AND pad doesn't exist
  authLogger.debug("Auth failed: invalid session & pad does not exist");
  return { accessStatus: "deny" };
}
