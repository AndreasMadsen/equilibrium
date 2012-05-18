/**
 * Copyright (c) 2012 Andreas Madsen
 * MIT License
 */

var vows = require('vows'),
    fs = require('fs'),
    async = require('async'),
    assert = require('assert'),
    common = require('../common.js'),
    equilibrium = require(common.equilibrium);

// remove temp content
common.reset();

var stream = equilibrium(common.state);
vows.describe('testing equilibrium').addBatch({

  'when writing to equilibrium before it is opened': {
    topic: function () {
      stream.write('Lorem ipsum - 1');
      setTimeout(this.callback, 500);
    },

    'nothing should happen': function () {
      assert.isFalse(common.existsSync(common.state));
    }
  }
}).addBatch({

  'when opening file file descriptor': {
    topic: function () {
      async.parallel({
        'init': function (callback) {
          stream.open();
          callback(null, true);
        },

        'open': function (callback) {
          stream.once('open', callback.bind(null, null, true));
        },

        'drain': function (callback) {
          stream.once('drain', callback.bind(null, null, true));
        }
      }, this.callback);
    },

    'sucessfully': function (error, result) {
      assert.ifError(error);
      assert.isTrue(result.init);
    },

    'open emits': function (error, result) {
      assert.ifError(error);
      assert.isTrue(result.open[0]);
      assert.isNumber(result.open[1]);
    },

    'drain emits': function (error, result) {
      assert.ifError(error);
      assert.isTrue(result.drain);
    },

    'state property should match': function (error, result) {
      assert.ifError(error);
      assert.equal(stream.state, 'Lorem ipsum - 1');
    },

    'the equilibrium file should be created': function (error, result) {
      assert.ifError(error);
      assert.isTrue(common.existsSync(common.state));
      assert.equal(fs.readFileSync(common.state, 'utf8'), 'Lorem ipsum - 1');
    }
  }
}).addBatch({

  'when updating the state': {
    topic: function () {
      async.parallel({
        'write': function (callback) {
          stream.write('Lorem ipsum - 2');
          callback(null, true);
        },

        'drain': function (callback) {
          stream.once('drain', callback.bind(null, null, true));
        }
      }, this.callback);
    },

    'drain emits': function (error, result) {
      assert.ifError(error);
      assert.isTrue(result.drain);
    },

    'state property should match': function (error, result) {
      assert.ifError(error);
      assert.equal(stream.state, 'Lorem ipsum - 2');
    },

    'the equilibrium file should be updated': function (error, result) {
      assert.ifError(error);
      assert.isTrue(common.existsSync(common.state));
      assert.equal(fs.readFileSync(common.state, 'utf8'), 'Lorem ipsum - 2');
    }
  }
}).addBatch({

  'when updateing using an object': {
    topic: function () {
      async.parallel({
        'write': function (callback) {
          stream.write({ 'state': true });
          callback(null, true);
        },

        'drain': function (callback) {
          stream.once('drain', callback.bind(null, null, true));
        }
      }, this.callback);
    },

    'drain emits': function (error, result) {
      assert.ifError(error);
      assert.isTrue(result.drain);
    },

    'state property should match': function (error, result) {
      assert.ifError(error);
      assert.deepEqual(stream.state, { 'state': true });
    },

    'the equilibrium file should be updated': function (error, result) {
      assert.ifError(error);
      assert.isTrue(common.existsSync(common.state));
      assert.deepEqual(JSON.parse(fs.readFileSync(common.state, 'utf8')),  { 'state': true });
    }
  }
}).addBatch({

  'when updateing using a number': {
    topic: function () {
      async.parallel({
        'write': function (callback) {
          stream.write(1000);
          callback(null, true);
        },

        'drain': function (callback) {
          stream.once('drain', callback.bind(null, null, true));
        }
      }, this.callback);
    },

    'drain emits': function (error, result) {
      assert.ifError(error);
      assert.isTrue(result.drain);
    },

    'state property should match': function (error, result) {
      assert.ifError(error);
      assert.equal(stream.state, 1000);
    },

    'the equilibrium file should be updated': function (error, result) {
      assert.ifError(error);
      assert.isTrue(common.existsSync(common.state));
      assert.equal(JSON.parse(fs.readFileSync(common.state, 'utf8')),  '1000');
    }
  }
}).addBatch({

  'when doing simultaneous writes': {
    topic: function () {
      var self = this;
      stream.write({ state: 1 });
      stream.write({ state: 2 });
      stream.write({ state: 3 });
      stream.write({ state: 4 });

      // we will need a fast way to detect chanes
      var calls = 0;
      var watcher = fs.watch(common.state, function (event) {
        if (event !== 'change') throw new Error('got wrong fd event ' + event);
        calls += 1;
      });

      // Lets assume all writes will happen within one second
      setTimeout(function () {
        watcher.close();
        self.callback(null, calls);
      }, 1000);
    },

    'the equilibrium file should only be reupdated once': function (error, result) {
      assert.ifError(error);
      assert.equal(result, 2);
    },

    'the equilibrium file should contain the latest state': function (error, result) {
      assert.ifError(error);
      assert.deepEqual(JSON.parse(fs.readFileSync(common.state, 'utf8')), { state: 4 });
    }
  }

}).addBatch({

  'when doing simultaneous writes again': {
    topic: function () {
      var self = this;
      stream.write({ state: 5 });
      stream.write({ state: 6 });
      stream.write({ state: 7 });
      stream.write({ state: 8 });

      // we will need a fast way to detect chanes
      var calls = 0;
      var watcher = fs.watch(common.state, function (event) {
        if (event !== 'change') throw new Error('got wrong fd event ' + event);
        calls += 1;
      });

      // Lets assume all writes will happen within one second
      setTimeout(function () {
        watcher.close();
        self.callback(null, calls);
      }, 1000);
    },

    'the equilibrium file should only be reupdated once': function (error, result) {
      assert.ifError(error);
      assert.equal(result, 2);
    },

    'the equilibrium file should contain the latest state': function (error, result) {
      assert.ifError(error);
      assert.deepEqual(JSON.parse(fs.readFileSync(common.state, 'utf8')), { state: 8 });
    }
  }

}).addBatch({

  'when closeing the equilibrium file stream while doing simultaneous writing': {
    topic: function () {
      var self = this;
      stream.write({ state: 9 });
      stream.write({ state: 10 });
      stream.write({ state: 11 });
      stream.write({ state: 12 });
      stream.close();

      // we will need a fast way to detect chanes
      var calls = 0;
      var watcher = fs.watch(common.state, function (event) {
        if (event !== 'change') throw new Error('got wrong fd event ' + event);
        calls += 1;
      });

      // Lets assume all writes will happen within one second
      stream.once('close', function () {
        watcher.close();
        self.callback(null, calls, true);
      });
    },

    'close drains': function (error, result, emit) {
      assert.ifError(error);
      assert.isTrue(emit);
    },

    'the equilibrium file should only be reupdated once': function (error, result) {
      assert.ifError(error);
      assert.equal(result, 2);
    },

    'the equilibrium file should contain the latest state': function (error, result) {
      assert.ifError(error);
      assert.deepEqual(JSON.parse(fs.readFileSync(common.state, 'utf8')), { state: 12 });
    }
  }

}).exportTo(module);
