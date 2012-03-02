var fs = require("fs")
    , uglify = require("uglify-js")
    , jsp = uglify.parser
    , pro = uglify.uglify;

var files = process.argv
    , node = files.shift()
    , thisFile = files.shift()
    , processedFile = {}
    , modules = {}
    , file
    , base;

while(files.length > 0) {
    file = files.shift();
    if (base == undefined) {
        // First file, figure out the "base" path for the modules
        base = findBase(file);
    }
    
    processedFile[file] = true;
    
    var data = fs.readFileSync(file, 'utf8');
    
    var ast = jsp.parse(data)
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
                if (name[1] == "module" && method == "declare" && args[0]) {
                    // We found the arguments location, check for an array
                    arg_type = args[0][0];
                    arg_deps = args[0][1];
                    arg_fn = args[1];
                    
                    if (arg_type == "array") {
                        // This module has depenencies! Lets get the JS.
                        deps = pro.gen_code(args[0], {beutify:true});
                        
                        // Parse out dependency file names
                        arg_deps.forEach(function(dep) {
                            var type = dep[0]
                                , value = dep[1]
                                , file_name;
                                
                            if (type == "string") {
                                // handle string dependencies
                                file_name = value;
                                
                            } else if (type == "object") {
                                // handle aliased dependencies
                                file_name = value[0][1][1];
                            }
                            
                            if (file_name)  {
                                file_name = file_name + ".js";
                                var normalized_file = relativePath(file, file_name);
                                
                                if (processedFile[normalized_file] === undefined) {
                                    files.push(normalized_file);
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
                        module_fn += pro.gen_code(fn_block, {beutify:true});
                    })
                }
                return this;
            }
    }, function(){
            return w.walk(ast);
    });
    
    modules[file] = memoize(makeId(file, base), deps, module_fn);
}


var output = '';
for (module in modules) {
    if (modules.hasOwnProperty(module)) {
        output += modules[module];
    }
}
var ast = jsp.parse(output);
ast = pro.ast_mangle(ast); // get a new AST with mangled names
ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
var final_code = pro.gen_code(ast); // compressed code here

console.log(final_code);

function makeId(file, base) {
    // Strip base path off filename
    var rp = new RegExp("^" + base);
    
    // hacky, but work for now
    id = file.replace(rp, "").replace(".js", "");
    
    return id;
}

function relativePath(base, file) {
    var sep_chr = '/',
        base_path = base.split(sep_chr),
        new_path = [],
        val;

    // Remove file from url
    base_path.pop();
    base_path = base_path.concat(file.split(sep_chr));
    
    while (base_path.length > 0) {
        val = base_path.shift();
        if (val == ".") {
            // Ignore
        } else if (val == ".." && new_path.length > 0 && new_path[new_path.length-1] != "..") {
            new_path.pop();
        } else {
            new_path.push(val);
        }
    }

    return new_path.join(sep_chr);
}

function findBase(file) {
    var sep_chr = '/'
        , paths = file.split(sep_chr);
    // we want everything before the file
    if (paths.length > 1) {
        // get rid of the filename
        paths.pop();
        return paths.join(sep_chr) + sep_chr;
    } else {
        // we're in the file directory
        return "";
    }
}

function memoize(id, deps, data) {
    deps = deps || "[]";
    var module = "require.memoize(\"" + id + "\",";
    module += deps + ",\n";
    module += "function(require, exports, module) {\n";
    module += data;
    module += "\n});";

    return module;
}


function recurseAst(ast, level) {
    var level = level || 0;
    
    ast.forEach(function(el) {
        if (el instanceof Array) {
            recurseAst(el, level + 1);
        } else  {
            var str = lpad(el, "    ", level);
            console.log(str);
        }
    });
}

function lpad(str, padString, length) {
    var pad = "";
    for(var i=0;i<length;i++)
        pad += padString;
        
    return pad + str;
}
