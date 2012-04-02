var fs = require("fs")
    , PATHS = require("./lib/paths")
    , MODULE = require("./lib/module")
    , UGLIFY = require("uglify-js")
    , jsp = UGLIFY.parser
    , pro = UGLIFY.uglify;

exports.package = function(files, options) {
    if (!options) options = {};

    var processedFile = {}
        , modules = {}
        , base;

    while(files.length > 0) {
        // Protect scope
        (function(file) {
            processedFile[file] = true;
        
            if (base == undefined) {
                // First file, figure out the "base" path for the modules
                base = PATHS.findBase(file);
            }
        
            var id = options.relative ? MODULE.makeId(file, base) : MODULE.makeId(file)
                , data = fs.readFileSync(file, 'utf8')
                , ast = jsp.parse(data)
                , deps = undefined
                , module_fn = undefined
                , w = pro.ast_walker();
        
            ast = w.with_walkers({
                    "call": function(declare) {
                        var call = this
                            , fn = call[1]
                                , name = fn[1]
                                , method = fn[2]
                            , args = call[2]
                                , arg_type
                                , arg_value
                                , arg_fn;
                
                        // Check for a modules.declare call
                        if (name && name[1] == "module" && method == "declare" && args[0]) {
                            // We found the arguments location, check for an array
                            arg_type = args[0][0];
                            arg_deps = args[0][1];
                            arg_fn = args[1];
                    
                            if (arg_type == "array") {
                                // This module has depenencies! Lets get the JS.
                                deps = pro.gen_code(args[0], {beautify:true});
                        
                                // Parse out dependency file names
                                arg_deps.forEach(function(dep) {
                                    var type = dep[0]
                                        , value = dep[1]
                                        , file_name
                                        , parsed_file;
                                
                                    if (type == "string") {
                                        // handle string dependencies
                                        file_name = value;
                                
                                    } else if (type == "object") {
                                        // handle aliased dependencies
                                        file_name = value[0][1][1];
                                    }
                            
                                    if (file_name)  {
                                        file_name = file_name + ".js";
                                        if (options.relative) {
                                            parsed_file = PATHS.relativePath(file, file_name);
                                        } else {
                                            parsed_file = file_name;
                                        }
                                
                                        if (processedFile[parsed_file] === undefined) {
                                            files.push(parsed_file);
                                        }
                                    }
                                });
                        
                            } else if (arg_type == "function") {
                                // get function contents for module
                                arg_fn = args[0];
                            }
                    
                            // Build the function JS 
                            module_fn = "";
                            arg_fn[3].forEach(function(fn_block) {
                                module_fn += pro.gen_code(fn_block, {beautify:true}) + "\n";
                            })
                        }
                        return this;
                    }
            }, function(){
                    return w.walk(ast);
            });
    
            modules[file] = MODULE.memoize(id, deps, module_fn);
        
        })(files.shift());
    }


    var output = '';
    for (module in modules) {
        if (modules.hasOwnProperty(module)) {
            output += modules[module];
        }
    }

    return output;
};

