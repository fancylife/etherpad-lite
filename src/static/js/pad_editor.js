/**
 * This code is mostly from the old Etherpad. Please help us to comment this code.
 * This helps other people to understand this code better and helps them to improve it.
 * TL;DR COMMENTS ON THIS FILE ARE HIGHLY APPRECIATED
 */

/**
 * Copyright 2009 Google Inc.
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

var padcookie = require('./pad_cookie').padcookie;
var padutils = require('./pad_utils').padutils;

var padeditor = (function()
{
  var Ace2Editor = undefined;
  var pad = undefined;
  var settings = undefined;

  var self = {
    ace: null,
    // this is accessed directly from other files
    viewZoom: 100,
    init: function(readyFunc, initialViewOptions, _pad)
    {
      Ace2Editor = require('./ace').Ace2Editor; //核心 Ace2Editor
      pad = _pad;
      settings = pad.settings;

      function aceReady()
      {
        $("#editorloadingbox").hide();
        if (readyFunc)
        {
          readyFunc();
        }
      }
      //关键点
      self.ace = new Ace2Editor(); //初始化ACE实例
      self.ace.init("editorcontainer", "", aceReady);
      self.ace.setProperty("wraps", true);
      if (pad.getIsDebugEnabled())
      {
        self.ace.setProperty("dmesg", pad.dmesg);
      }
      self.initViewOptions();
      self.setViewOptions(initialViewOptions);

      // view bar
      $("#viewbarcontents").show();
    },
    initViewOptions: function()
    {
      // Line numbers
      padutils.bindCheckboxChange($("#options-linenoscheck"), function()
      {
        pad.changeViewOption('showLineNumbers', padutils.getCheckbox($("#options-linenoscheck")));
      });

      // Author colors
      padutils.bindCheckboxChange($("#options-colorscheck"), function()
      {
        padcookie.setPref('showAuthorshipColors', padutils.getCheckbox("#options-colorscheck"));
        pad.changeViewOption('showAuthorColors', padutils.getCheckbox("#options-colorscheck"));
      });

      // Right to left
      padutils.bindCheckboxChange($("#options-rtlcheck"), function()
      {
        pad.changeViewOption('rtlIsTrue', padutils.getCheckbox($("#options-rtlcheck")))
      });
      html10n.bind('localized', function() {
        pad.changeViewOption('rtlIsTrue', ('rtl' == html10n.getDirection()));
        padutils.setCheckbox($("#options-rtlcheck"), ('rtl' == html10n.getDirection()));
      })

      // font family change
      $("#viewfontmenu").change(function()
      {
        pad.changeViewOption('padFontFamily', $("#viewfontmenu").val());
      });

      // Language
      html10n.bind('localized', function() {
        $("#languagemenu").val(html10n.getLanguage());
        // translate the value of 'unnamed' and 'Enter your name' textboxes in the userlist
        // this does not interfere with html10n's normal value-setting because html10n just ingores <input>s
        // also, a value which has been set by the user will be not overwritten since a user-edited <input>
        // does *not* have the editempty-class
        $('input[data-l10n-id]').each(function(key, input){
          input = $(input);
          if(input.hasClass("editempty")){
            input.val(html10n.get(input.attr("data-l10n-id")));
          }
        });
      })
      $("#languagemenu").val(html10n.getLanguage());
      $("#languagemenu").change(function() {
        pad.createCookie("language",$("#languagemenu").val(),null,'/');
        window.html10n.localize([$("#languagemenu").val(), 'en']);
      });
    },
    setViewOptions: function(newOptions)
    {
      function getOption(key, defaultValue)
      {
        var value = String(newOptions[key]);
        if (value == "true") return true;
        if (value == "false") return false;
        return defaultValue;
      }

      var v;

      v = getOption('rtlIsTrue', ('rtl' == html10n.getDirection()));
      self.ace.setProperty("rtlIsTrue", v);
      padutils.setCheckbox($("#options-rtlcheck"), v);

      v = getOption('showLineNumbers', true);
      self.ace.setProperty("showslinenumbers", v);
      padutils.setCheckbox($("#options-linenoscheck"), v);

      v = getOption('showAuthorColors', true);
      self.ace.setProperty("showsauthorcolors", v);
      padutils.setCheckbox($("#options-colorscheck"), v);

      // Override from parameters if true
      if (settings.noColors !== false){
        self.ace.setProperty("showsauthorcolors", !settings.noColors);
      }

      var fontFamily = newOptions['padFontFamily'];
      switch (fontFamily) {
        case "monospace": self.ace.setProperty("textface", "monospace"); break;
        case "montserrat": self.ace.setProperty("textface", "Montserrat"); break;
        case "opendyslexic": self.ace.setProperty("textface", "OpenDyslexic"); break;
        case "comicsans": self.ace.setProperty("textface", "'Comic Sans MS','Comic Sans',cursive"); break;
        case "georgia": self.ace.setProperty("textface", "Georgia,'Bitstream Charter',serif"); break;
        case "impact": self.ace.setProperty("textface", "Impact,Haettenschweiler,'Arial Black',sans-serif"); break;
        case "lucida": self.ace.setProperty("textface", "Lucida,'Lucida Serif','Lucida Bright',serif"); break;
        case "lucidasans": self.ace.setProperty("textface", "'Lucida Sans','Lucida Grande','Lucida Sans Unicode','Luxi Sans',sans-serif"); break;
        case "palatino": self.ace.setProperty("textface", "Palatino,'Palatino Linotype','URW Palladio L',Georgia,serif"); break;
        case "robotomono": self.ace.setProperty("textface", "RobotoMono"); break;
        case "tahoma": self.ace.setProperty("textface", "Tahoma,sans-serif"); break;
        case "timesnewroman": self.ace.setProperty("textface", "'Times New Roman',Times,serif"); break;
        case "trebuchet": self.ace.setProperty("textface", "'Trebuchet MS',sans-serif"); break;
        case "verdana": self.ace.setProperty("textface", "Verdana,'DejaVu Sans',sans-serif"); break;
        case "symbol": self.ace.setProperty("textface", "Symbol"); break;
        case "webdings": self.ace.setProperty("textface", "Webdings"); break;
        case "wingdings": self.ace.setProperty("textface", "Wingdings"); break;
        case "sansserif": self.ace.setProperty("textface", "sans-serif"); break;
        case "serif": self.ace.setProperty("textface", "serif"); break;
        default: self.ace.setProperty("textface", "");   break;
      }
    },
    dispose: function()
    {
      if (self.ace)
      {
        self.ace.destroy();
        self.ace = null;
      }
    },
    enable: function()
    {
      if (self.ace)
      {
        self.ace.setEditable(true);
      }
    },
    disable: function()
    {
      if (self.ace)
      {
        self.ace.setProperty("grayedOut", true);
        self.ace.setEditable(false);
      }
    },
    restoreRevisionText: function(dataFromServer)
    {
      pad.addHistoricalAuthors(dataFromServer.historicalAuthorData);
      self.ace.importAText(dataFromServer.atext, dataFromServer.apool, true);
    }
  };
  return self;
}());

// padeditor实际上是一个创建aceEditor的自执行匿名函数
exports.padeditor = padeditor;