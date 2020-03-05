const Changeset = require('./../src/static/js/Changeset.js');
const AttributePool = require("./../src/static/js/AttributePool");

// console.log(Changeset.makeAttribution('我是张驰 挺不错的'))

//例子3 
// Z:6g>1|2=o=3x*0+1$j
let submittedChangeset = 'Z:6e>0*0=k$';
let baseText = {
    "text": "Welcome to Etherpad!\n\nThis pad text is synchronized as you type, so that everyone viewing this page sees the same text. This allows you to collaborate seamlessly on documents!\n\nGet involved with Etherpad at http://etherpad.org\nhi\n",
    "attribs": "|6+6e"
}

var pool = new AttributePool();
pool.fromJsonable({
    "numToAttrib": {
        "0": ["bold", "true"],
        "1": ["italic", "true"],
        "2": ["underline", "true"],
        "3": ["strikethrough", "true"],
        "4": ["bold", ""]
    },
    "nextNum": 5
})
console.log(Changeset.applyToAttribution(submittedChangeset, baseText.attribs, pool))//=>*0+k|6+5u