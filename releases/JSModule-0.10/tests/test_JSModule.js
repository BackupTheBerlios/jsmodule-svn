var checkName = function(name) {
    // See if name is imported
    try {
        if(typeof(eval(name)) == "undefined")
            return false;
    } catch(e) {
        return false;
    }
    return true;
};


testInject = function() {
    var inject = JSModule.inject;

    var o = new Object();
    o.injectedName = "SOMEVALUE";

    // Test injection into a custom namespace
    target = new Object();
    if(checkName("target.injectedName"))
        throw new Error("'target.injectedName' already defined before inject");
    inject({injectedName: o.injectedName}, target);
    if(!checkName("target.injectedName"))
        throw new Error("Injection into target failed");


    // Make sure injectedName is not defined
    if(checkName("injectedName"))
        throw new Error("'injectedName' already defined before inject");

    // Test injecting into the global namespace
    inject({injectedName: o.injectedName});
    if(!checkName("injectedName"))
        throw new Error("Injection into global namespace failed");

    // Test injecting overrides previous name
    injectedName = "INDEPENDENTVALUE";
    inject({injectedName: o.injectedName});
    if(injectedName == "INDEPENDENTVALUE")
        throw new Error("Injection into global namespace did not replace previous globals");


    // Test injecting a dotted name into an empty target
    target = {};
    if(checkName("target.first.second.third.fourth"))
        throw new Error("'target.first.second.third.fourth' already defined before inject");
    inject({"first.second.third.fourth": o.injectedName}, target);
    if(!checkName("target.first.second.third.fourth"))
        throw new Error("Injection of dotted name into target failed");

    // Test injecting a dotted name into a partially filled target
    target = {first: {second: null, yetAnother: "YETANOTHERVALUE"}, stillYetAnother: "STILLYETANOTHERVALUE"};
    if(checkName("target.first.second.third.fourth"))
        throw new Error("'target.first.second.third.fourth' already defined before inject");
    inject({"first.second.third.fourth": o.injectedName}, target);
    if(!checkName("target.stillYetAnother"))
        throw new Error("Injection of dotted name into target removed top-level value");
    if(!checkName("target.first.yetAnother"))
        throw new Error("Injection of dotted name into target removed second-level value");
    if(!checkName("target.first.second.third.fourth"))
        throw new Error("Injection of dotted name into partially filled target failed");

};

testInclude = function() {
    // Make sure SampleModule is not imported
    if(checkName("SampleModule"))
        throw new Error("'SampleModule' already defined before import");


    // Test that a bare import works
    include("SampleModule");
    if(!checkName("SampleModule"))
        throw new Error("Importing 'SampleModule' failed");

    // Make sure private members aren't imported
    if(checkName("SampleModule.privateConstant"))
        throw new Error("Imported private member");

    // Make sure public members are imported
    if(!checkName("SampleModule.someFunction") || !checkName("SampleModule.anotherFunction"))
        throw new Error("Did not import public members");

    // Make sure public members have not been injected
    if(checkName("someFunction") || checkName("anotherFunction"))
        throw new Error("Bare import injected module members");

    // Test importing a nonexistent name from SampleModule
    include("SampleModule", "nonexistentFunction");
    if(checkName("nonexistentFunction"))
        throw new Error("Importing nonexistent name injected the name");

    // Test importing only one name from SampleModule
    include("SampleModule", "someFunction");
    if(!checkName("someFunction"))
        throw new Error("Importing name did not inject the name");
    if(checkName("anotherFunction"))
        throw new Error("Importing name injected another unrequested name");


    // Test importing a group from SampleModule
    include("SampleModule", ":someGroup");
    if(!checkName("someFunction") || !checkName("anotherFunction"))
        throw new Error("Importing group name did not inject the names");

    // Test importing a nonexistent group from SampleModule
    include("SampleModule", ":nonexistentGroup");
    // TODO - what can we test here?

    // Test importing all names from SampleModule
    include("SampleModule", "*");
    if(!checkName("thirdFunction"))
        throw new Error("Importing all names did not import all");


    // Test that importing doesn't reload a loaded module
    SampleModule.newMember = {};
    include("SampleModule", "*");
    if(!checkName("SampleModule.newMember"))
        throw new Error("Importing loaded module reloads");


    // Test that including a nonexistent module fails silently
    if(include("NonexistentSampleModule"))
        throw new Error("Importing nonexistent module returns non-null");

    // Test that importing a submodule from a package works
    if(checkName("SamplePackage"))
        throw new Error("'SamplePackage' already defined before import");
    if(checkName("SamplePackage.SubModule"))
        throw new Error("'SamplePackage.SubModule' already defined before import");
    include("SamplePackage.SubModule");
    if(checkName("SubModule"))
        throw new Error("Importing 'SamplePackage.SubModule' only inject SubModule's name");
    if(!checkName("SamplePackage.SubModule"))
        throw new Error("Importing 'SamplePackage.SubModule' failed");


    // Test importing a JSAN module
    include("SampleJSANModule");
    if(!checkName("SampleJSANModule"))
        throw new Error("Importing a JSAN module failed");
    if(!checkName("SampleJSANModule.someAttribute"))
        throw new Error("Importing a JSAN module failed to preserve its namespace");
    if(checkName("someAttribute"))
        throw new Error("Name defined before inmporting JSAN module");
    if(!SampleJSANModule.MEMBERS || SampleJSANModule.MEMBERS[0] != "someFunction"
            || SampleJSANModule.MEMBERS[1] != "someAttribute"
            || SampleJSANModule.MEMBERS[2] != "someNumber")
        throw new Error("Importing JSAN Module did adapt MEMBERS");
    if(!SampleJSANModule.MEMBERGROUPS || SampleJSANModule.MEMBERGROUPS["foo"][0] != "someNumber")
        throw new Error("Importing JSAN Module did adapt MEMBERGROUPS");

    // Test that injecting a name replaces the previous name
    someFunction = 9999;
    include("SampleModule", "someFunction");
    if(someFunction == 9999)
        throw new Error("Importing name did not replace existing global name");
};

document.write("<p>inject: ");
var failed = false;
try {
    testInject();
} catch(e) {
    failed = true;
    document.write("fail - " + e.message);
}
if(!failed)
    document.write("success");


document.write("<p>include: ");
var failed = false;
try {
    testInclude();
} catch(e) {
    failed = true;
    document.write("fail - " + e.message);
}
if(!failed)
    document.write("success");
