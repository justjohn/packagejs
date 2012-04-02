
exports.makeId = function(file, base) {
    if (base) {
        // Strip base path off filename
        var rp = new RegExp("^" + base);
        // hacky, but works for now
        id = file.replace(rp, "");
    } else {
        id = file;
    }
    
    id = id.replace(".js", "");
    
    return id;
}

exports.memoize = function(id, deps, data) {
    deps = deps || "[]";
    var module = "require.memoize(\"" + id + "\",";
    module += deps + ",\n";
    module += "function(require, exports, module) {\n";
    module += data;
    module += "\n});";

    return module;
}
