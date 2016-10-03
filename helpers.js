(function() {
  var registry = [];
  if (window.console && console.log) {
    var old = console.log;
    console.log = function() {
      if (arguments[0] == "doNotRepeat") {
        Array.prototype.shift.call(arguments);
        var format = (/%s|%d|%i|%f|%o|%O|%c/.test(arguments[0]) && arguments.length > 1) ? arguments[0] : "";
        var index = (format) ? 1 : 0;
        for (index; index < arguments.length; index++) {
          if (registry.indexOf(format + arguments[index]) == -1) {
            registry.push(format + arguments[index]);
          } else {
            Array.prototype.splice.call(arguments, index, 1);
            index--;
          }
        }
        if (format && arguments.length == 1) Array.prototype.shift.call(arguments);
      }
      old.apply(this, arguments);
    }
  }
})();

function capitalizeEachWord(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}