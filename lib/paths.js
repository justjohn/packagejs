
exports.relativePath = function(base, file) {
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

exports.findBase = function(file) {
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
