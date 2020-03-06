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
        "4": ["bold", ""],
        "5": ["strikethrough", ""]
    },
    "nextNum": 5
})
// console.log(Changeset.applyToAttribution(submittedChangeset, baseText.attribs, pool))//=>*0+k|6+5u

// var bb = Changeset.composeAttributes('*0*3','*1*4*5',false,pool);
// console.log(bb)//*1*3

// var aa = Changeset.composeAttributes('*0*3','*1*4',true,pool);
// console.log(aa)//*4*1*3

// let preChangeset = 'Z:6e>0*0=k';
// let curChangeset = 'Z:6e>0*0=j*1=1';
// var tmp = Changeset.compose(preChangeset,curChangeset,pool)
// console.log(tmp)//Z:6e>0*0=j*0*1=1$


let preChangeset = 'Z:6e>0*0=k-1';
let curChangeset = 'Z:6e>0*0=k+1$a';
var tmp = Changeset.compose(preChangeset,curChangeset,pool)
console.log(tmp)//Z:6e>0*0=k-1+1$a