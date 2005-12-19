// This is a JSAN library
try {
    if(SampleJSANModule == undefined)
        throw new Error();
} catch(e) {
    SampleJSANModule = {};
}
SampleJSANModule.someAttribute = {};
SampleJSANModule.someFunction = function(){};
SampleJSANModule.someNumber = 999;

SampleJSANModule.EXPORT = [ 'someFunction' ];
SampleJSANModule.EXPORT_OK = [ 'someAttribute', 'someNumber' ];
SampleJSANModule.EXPORT_TAGS = { ":foo": [ 'someNumber' ] };
