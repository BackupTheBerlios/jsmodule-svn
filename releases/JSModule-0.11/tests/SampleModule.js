var NAME = "SampleModule";
var VERSION = "0.1";
var MEMBERS = [
    "someFunction",
    "anotherFunction",
    "thirdFunction"
];
var MEMBERGROUPS = {
    someGroup: ["someFunction", "anotherFunction"]
};


var privateConstant = "SOMEVALUE";

var someFunction = function() {
    return privateConstant;
};

var anotherFunction = function() {
    return "ANOTHERVALUE";
};

var thirdFunction = function() {
    return "THIRDVALUE";
};
