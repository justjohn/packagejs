module.declare([
    "lib/utils"
], function(require, exports, module) {
    var utils = require("lib/utils");
    exports.boot = function() {
        utils.echo();
    };
});
