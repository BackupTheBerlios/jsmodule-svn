/**
Browser-based-Javascript library and module loader.

Copyright (c) 2005 Andrew Durdin. <andy@durdin.net>

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License (in the LICENSE file) for more details.
**/

// Create a local scope
(function(){

var NAME = "JSModule";
var VERSION = "0.11";
var MEMBERS = [
    "addIncludePath",
    "include",
    "inject",
    "reload",
    "globalNamespace",
    "includePaths",
    "loadedModules"
];
var MEMBERGROUPS = {
    "default": ["addIncludePath", "include"]
};


var globalNamespace = this;
var includePaths = [""];
var loadedModules = {};

/// Export the given names/value pairs the given namespace:
var inject = function(valuesToInject, namespace) {
    namespace = namespace || globalNamespace;

    var name, nameParts, value;
    for(var targetName in valuesToInject) {
        nameParts = targetName.split(".");
        value = valuesToInject[targetName];

        if(typeof(value) == "undefined")
            continue;

        // Set each part of a dotted name
        for(var j = 0; j < nameParts.length; j++) {
            name = nameParts[j];

            if(j < nameParts.length - 1) {
                if(typeof(namespace[name]) == "undefined"
                        || namespace[name] == null)
                    namespace[name] = {};

                // Recurse through the destination namespace
                namespace = namespace[name];
            } else {
                namespace[name] = value;
            }
        }
    }
};

/// Return the source of a javascript file at the given path
var loadScript = function(scriptPath) {
    // Create an XMLHTTPRequest
    var request;
    try {
        request = new XMLHttpRequest();
    } catch(e) {
        try {
            request = new ActiveXObject("Microsoft.XMLHTTP");
        } catch(e) {
            throw new Error("Cannot create XMLHTTPRequest object "
                + "when loading script file '" + scriptPath + "'");
        }
    }

    // Load the script file synchronously
    request.open("GET", scriptPath, false);
    request.send("");

    // Check that the script loaded successfully
    if(request.status != 0 && request.status != 200
        || request.status == 0 && request.responseText.length == 0)
        throw new Error("Error " + request.status + " ("
            + request.statusText + ") when loading script file '"
            + scriptPath + "'");

    // Return the script
    return request.responseText;
};

/// Load the module *moduleName*, injecting all *name*s as globals.
var include = function(moduleName /*, name, ... */) {
    // Use the existing module if it's been loaded
    var module;
    if(!(module = loadedModules[moduleName]))
        module = reload(moduleName);

    if(module) {
        // Inject the names that the user has requested
        var names = [];
        for(var i = 1; i < arguments.length; i++) {
            var name = arguments[i];

            if(name == "*") {
                names = names.concat(module.MEMBERS);
            } else if(name.charAt(0) == ":") {
                var groupNames = module.MEMBERGROUPS[name.slice(1)];
                if(typeof(groupNames) != "undefined")
                    names = names.concat(groupNames);
                else
                    throw new Error("Group '" + name.slice(1) + "' not found in module '"
                        + moduleName + "'");
            } else {
                if(typeof(module[name]) != "undefined")
                    names.push(name);
                else
                    throw new Error("Name '" + name + "' not found in module '"
                        + moduleName + "'");
            }
        }
        var valuesToInject = {};
        for(var i = 0; i < names.length; i++)
            valuesToInject[names[i]] = module[names[i]];
        inject(valuesToInject);
    }

    return module;
};

var saveMembersCode = (
    "var NAME = NAME || 'unknown';" +
    "var VERSION = VERSION || 'unknown';" +
    "var MEMBERS = MEMBERS || [];" +
    "var MEMBERGROUPS = MEMBERGROUPS || {};" +
    "var $$members = MEMBERS.concat(['NAME', 'VERSION', 'MEMBERS', " +
        "'MEMBERGROUPS']);" +
    "var $$moduleObject = {};" +
    "for(var $$i = 0; $$i < $$members.length; $$i++) {" +
    "    $$moduleObject[$$members[$$i]] = eval($$members[$$i]);" +
    "}"
);

/// Locate and load the module *moduleName*, injecting *moduleName*
/// into the global namespace.
var reload = function(moduleName) {
    // Never reload this module
    if(moduleName == NAME)
        return loadedModules[moduleName];

    // Try loading the module from each of the include paths
    var modulePathName = moduleName.replace(".", "/");
    for(var i = 0; i < includePaths.length; i++) {
        var moduleObject;
        var fullPath = includePaths[i] + modulePathName + ".js";

        try {
            var moduleText = loadScript(fullPath);
        } catch(e) {
            continue;
        }

        var moduleWrapper = "(function(){" +
            "{" + moduleText + "}" +
            saveMembersCode +
            "return $$moduleObject;" +
            "})()";

        try {
            moduleObject = eval(moduleWrapper);
        } catch(e) {
            throw new Error("Exception in module '" + moduleName
                + "': " + (e.message || e.toString()));
        }

        // Save the loaded module
        loadedModules[moduleName] = moduleObject;

        // See if the module conforms to JSModule; if not,
        // try to adapt it
        var conforms = (moduleObject.MEMBERS.length != 0);
        if(!conforms) {
            try {
                var otherModule = eval(moduleName);

                if(otherModule) {
                    if(otherModule.EXPORT && !otherModule.MEMBERS) {
                        otherModule.MEMBERS = otherModule.EXPORT;
                        if(otherModule.EXPORT_OK)
                            otherModule.MEMBERS = (otherModule.
                                MEMBERS.concat(otherModule.EXPORT_OK));
                        conforms = true;
                    }
                    if(otherModule.EXPORT_TAGS
                            && !otherModule.MEMBERGROUPS) {
                        otherModule.MEMBERGROUPS = {};
                        for(var tag in otherModule.EXPORT_TAGS)
                            otherModule.MEMBERGROUPS[tag.slice(1)] =
                                otherModule.EXPORT_TAGS[tag];
                    }

                    // Now we've adapted it, use it
                    moduleObject = otherModule;
                }
            } catch(e) {
                // Do nothing
            }
        }

        // Inject the module's name into the global namespace
        // if it conforms to the required interface
        if(conforms) {
            var valuesToInject = {};
            valuesToInject[moduleName] = moduleObject;
            inject(valuesToInject);
        }

        // Return the module
        return moduleObject;
    }

    // The module could not be loaded
    throw new Error("JSModule could not locate module 'moduleName'");
};

/// Add the given paths to the list of include paths, if not present,
/// ensuring it has a trailing slash.
var addIncludePath = function(/* path [, path, ...] */) {
    for(var j = 0; j < arguments.length; j++) {
        var path = arguments[j];

        if(path[path.length - 1] != "/")
            path += "/";
        for(var i = 0; i < includePaths.length; i++)
            if(includePaths[i] == path)
                return;

        includePaths.push(path);
    }
};

// Bootstrap this module
eval(saveMembersCode);
var moduleName = NAME;
loadedModules[NAME] = $$moduleObject;
var valuesToInject = {};
valuesToInject[NAME] = $$moduleObject;
inject(valuesToInject);
inject({include: $$moduleObject.include,
    addIncludePath: $$moduleObject.addIncludePath});

// End the local scope
})();
