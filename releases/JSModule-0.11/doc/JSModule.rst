===================================
JSModule - Javascript Module Loader
===================================

JSModule Version 0.11

Written by `Andrew Durdin`_

..  _`Andrew Durdin`: mailto:andy@durdin.net

Contents
--------

1.  `Overview`_
2.  `Sample Usage`_
3.  `Features`_
4.  `Including Modules`_
5.  `Writing Modules`_
6.  `Compatibility`_
7.  `Reference`_
8.  `Copyright`_


Overview
--------

JSModule_ is a module loader for Javascript.  It allows javascript
developers to split large scripts into separate modules, enabling code
reuse and enhancing maintainability.

..  _JSModule: http://andy.durdin.net/packages/JSModule/


Sample Usage
------------
::

    <script type='text/javascript' src='JSModule.js'></script>
    <script type='text/javascript'>

        // Load the "Event" module, injecting the members "addEvent"
        // and "removeEvent" as globals
        include("Event", "addEvent", "removeEvent");

        // Load the "Animation" module, inject the "default" set of
        // members as globals
        include("Animation", ":default");

    </script>


Features
--------

JSModule has the following features:

Private module-level scope
    All functions and variables declared in a module are completely
    private to that module, unless explicitly exported.

Dependency handling
    Modules can call include_ to manage their own dependencies, and
    these dependencies will be loaded also, with appropriate caching.
    This removes the need for the module user to determine and include
    dependencies for the modules he uses.

Minimal boilerplate
    Modules need an absolute minimum of boilerplate code to work with
    JSModule, unlike other module loaders.  This keeps the modules
    readable and makes `writing modules`_ easier.

Backward compatibility
    JSModule is compatible with modules written with explicit namespace
    construction, such as those used with JSAN_.  It will recognise the
    exported names and tags from JSAN modules.

Member groups
    JSModule support groups of members that can be injected from a
    module all at once.

Small size
    JSModule is a small download: less than 8kB when unpacked, and
    only 2.5kB when packed.


..  _JSAN: http://www.openjsan.org/go?l=JSAN


Including Modules
-----------------

Including a module with JSModule causes several things to happen:

1.  The module file is located and executed if it has not been included
    already.

2.  The module name is injected into the global namespace.

3.  Members of the module are injected into the global namespace as
    requested.

The filename of the module is determined from the module name by
converting all package names to directories, and appending ".js"::

    include("Foo");         => "Foo.js"
    include("Foo.Bar");     => "Foo/Bar.js"
    include("Foo.Bar.Baz"); => "Foo/Bar/Baz.js"

The paths in includePaths_ will then be searched for the module file.
The default include path is "", the local directory.  Users can use the
addIncludePath_ function to add one or more paths to search::

    addIncludePath("/lib/js");
    include("Foo.Bar");     => searches for "Foo/Bar.js"
                               and "/lib/js/Foo/Bar.js"

After loading, the module name will be injected into the global
namespace exactly as it was passed to the include_ function, complete
with any package names.  If an object corresponding to a package name
does not exists, it will be created::

    include("Foo.Bar");         => 'Foo' is now an object with one
                                   attribute 'Bar'
    include("Foo.Baz");         => Adds the attribute 'Baz' to 'Foo'
    include("Qux");             => 'Qux' is now an object.

If an object corresponding to the module name already exists, it will
not be replaced. This is to preserve compatibility with javascript
modules not written for use with JSModule::

    include("MochiKit.Base");   => MochiKit.Base internally declares 'MochiKit'
                                   and 'MochiKit.Base' as globals, so JSModule
                                   leaves these as-is.


If the include_ call specifies the names of members, these are injected
into the global namespace::

    include("Foo", "bar", "baz");   => 'bar' and 'baz' are now globals
    bar();                          => equivalent to 'Foo.bar()'
    alert(baz);                     => equivalent to 'alert(Foo.baz)'

If the module declares member groups, the members of these groups can
be injected without having to enumerate each member manually::

    // The Foo module has a member group named 'utils' with the names
    // 'bar' and 'baz'.

    include("Foo", ":utils");       => 'bar' and 'baz' are now globals

Member groups and individual members can be injected together in a
single call::

    include("Foo", ":utils", "qux");

The user can also inject all the members of a module at once, but this
is not generally recommended, in case some of the names conflict with
user-declared names::

    include("Foo", "*");            => all members of Foo are now globals

In all cases, if a global name already exists, it will be replaced if
it is injected::

    bar = 99;
    include("Foo", "bar");
    alert(bar == 99);               => 'false'

You can also use include_ to include JSAN_ modules and inject its
members or member groups (export tags).  Note that unlike JSAN,
JSModule will not inject any module members by default.

If a module cannot be found, or a name or group name is included which
does not exist in the module's MEMBERS or MEMBERGROUPS lists, an exception
will be thrown.


Writing Modules
---------------

Although JSModule is capable of loading many existing Javascript
modules, it can provide additional benefits for modules written to suit
it: it is simpler to write modules for JSModule than for JSAN or Dojo,
and JSModule modules have a private namespace so they do not interfere
with each other.  There are only two requirements for a module:

Functions and variables should be declared as locals
    Declaring functions and variables as globals (e.g.
    ``myVariable = []``) causes pollution of the global namespace, and
    poses a risk that two libraries could interfere with each other if
    they use the same name.  Declaring functions and variables as
    locals with the ``var`` keyword (e.g. ``var myVariable = []``)
    prevents this problem.

The module's public members must be declared
    The module must declare a local ``MEMBERS`` variable as an array of
    the function and variable names that should be publically visible::

        // Foo module
        var bar = {};
        var baz = {};
        var qux = {}

        var MEMBERS = [
            "bar",
            "baz",
        ];

    JSModule will make all these names attributes of the module object
    when it is loaded.  After loading the example module above,
    ``Foo.bar`` and ``Foo.baz` refer to the module's ``bar`` and
    ``baz`` variables, but ``Foo.qux`` is undefined, because ``qux`` is
    private.

    All the functions and variables declared as locals in the module
    and not listed in the ``MEMBERS`` array will be private to the
    module, with the exception of the special variables ``NAME``,
    ``VERSION``, ``MEMBERS``, and ``MEMBERGROUPS`` -- these will also
    be public attributes of the module object.

A module writer can also (but is not required to) declare a local
``MEMBERGROUPS`` variable.  This is a dictionary containing a list of
group-name and array pairs, which allow groups of functions to be
injected using just the group name::

    // still in the Foo module from the last example

    var MEMBERGROUPS = {
        "utils": ["bar", "baz"]
    };

See `Including Modules`_ for an example of injecting the names from a
member group such as this one.


Compatibility
-------------

JSModule has been successfully tested with the following browsers:

* Internet Explorer 6.0 (Windows XP SP2)
* Firefox 1.0 (Windows XP SP2, Mac OS X 10.4)
* Firefox 1.5 RC3 (Mac OS X 10.4)
* Safari 2.0 (Mac OS X 10.4)
* Opera 8.5 (Mac OS X 10.4) [1]_
* Opera 9.0 preview 1 (Max OS X 10.4)

You can run the `test suite`_ yourself to test its compatiblity with
your browser.

..  _`test suite`: ./tests/index.html

..  [1]  Opera 8.5 hangs the script when using XMLHttpRequest
         to request a non-existent file at a relative URL from a local
         (``file://``) html file; however it passes the tests for
         internet (``http://``) pages.

Reference
---------

Here is a brief reference of the public members of the JSModule module:

Functions
    addIncludePath_, include_, inject_, reload_

Variables
    globalNamespace_, includePaths_, loadedModules_


addIncludePath
``````````````
::

    addIncludePath("path" [, "path", ...]);

Adds the *paths* to the end of the includePaths_ list (if they are not
already in it).  The given paths will have a slash appended if
necessary.

``addIncludePath`` is injected into the global namespace automatically.

globalNamespace
```````````````

Provides a reference to the global namespace, to allow other modules to
manipulate entries in it.


include
```````
::

    include("moduleName" [, "name", "name", ...]);

Locates and loads the module *moduleName*, injecting *moduleName* and
all *names* into the global namespace, returning the module object.

If a *name* is ``*``, then all the names declared in the module's
``MEMBERS`` attribute will be injected.

If a *name* begins with a colon ``:``, then the names from the
corresponding member group in the module will be injected.  For
example, ``include("Foo", ":utils")`` will inject the names from the
"utils" member group.

If a *name* is not found in the ``MEMBERS`` attribute, or a group
name is not found in the ``MEMBERGROUPS`` attribute, an exception
will be thrown.

The script will look in each path in includePaths_ for a file named
``moduleName.js``. If *moduleName* is a dotted name, then the
components between dots will be converted to directory names. For
example, with the module name ``Foo.Bar``, the file ``Bar.js`` will be
looked for in the ``Foo/`` subdirectory of each of the include paths.

If the module cannot be found, an exception will be thrown.

If the module has already been included in the context of the script, a
second call to include_ will not load it again, but will return the
existing module.

The module returned from the function will have attributes set for all
the names in the module's ``MEMBERS`` list, as well as attributes for
any of the variables ``NAME``, ``VERSION``, ``MEMBERS``, and
``MEMBERGROUPS`` that are declared in the module.

If the module is a JSAN module, then its ``MEMBERS`` list will consist
of the the names in its ``EXPORT`` and ``EXPORT_OK`` lists; while its
``MEMBERGROUPS`` dictionary will contain the groups listed in its
``EXPORT_TAGS`` dictionary, if defined.


``include`` is injected into the global namespace automatically.


includePaths
````````````

An array of paths where include_ and reload_ will search for modules.
Each entry must be an absolute or relative path from the current
location, with a trailing slash.

The addIncludePath_ function should normally be used to add a path to
this list.


inject
``````
::

    inject(valuesToInject [, namespace]);

Injects the name-value pairs from the dictionary *valuesToInject* into
the *namespace* object.  If a name in *valuesToInject* is a dotted
name, then an object hierarchy corresponding to the dotted parts of the
name will be created if it doesn't exist::

    inject( { "Foo.Bar.baz": "qux" } );    => Creates 'Foo' and
                                              'Foo.Bar' objects if they
                                              don't exist, and sets
                                              'Foo.Bar.baz' to "qux".

If *namespace* is not given, then the global namespace will be used.


loadedModules
`````````````

A dictionary of modules that have been loaded. Modules can be accessed
by name from this dictionary if their global namespace entry has been
clobbered::

    include("Foo.Bar");
    Foo.Bar = null;
    JSModule.loadedModules["Foo.Bar"]   => Points to the Foo.Bar module
                                           loaded by include()


reload
``````
::

    reload(moduleName);

Locates and runs the module *moduleName* as per include_, but forces
the module to be re-evaluated.  Any members of the module that have
been injected into the global namespace will not updated unless
include_ is called again.

Note that the ``JSModule`` module will never be reloaded.


Copyright
---------

Coypright (c) 2005 Andrew Durdin. <andy@durdin.net>

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License (in the LICENSE file) for more details.
