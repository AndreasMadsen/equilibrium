/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var wrench = require('wrench');
var path = require('path');
var fs = require('fs');

// node < 0.8 compatibility
exports.exists = fs.exists || path.exists;
exports.existsSync = fs.existsSync || path.existsSync;

// resolve main dirpaths
exports.test = path.dirname(module.filename);
exports.root = path.resolve(exports.test, '..');

// resolve filepath to main module
exports.equilibrium = path.resolve(exports.root, 'equilibrium.js');

// resolve test dirpaths
exports.temp = path.resolve(exports.test, 'temp');
exports.state = path.resolve(exports.temp, 'state.json');

// Reset temp directory
exports.reset = function () {
  if (exports.existsSync(exports.temp)) {
    wrench.rmdirSyncRecursive(exports.temp);
  }
  fs.mkdirSync(exports.temp);
};
