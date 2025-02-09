"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _RtlProvider = require("./RtlProvider");
Object.keys(_RtlProvider).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _RtlProvider[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _RtlProvider[key];
    }
  });
});