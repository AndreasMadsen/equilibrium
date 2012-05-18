/**
 * Copyright (c) 2011 Andreas Madsen
 * GPL License Version 3
 */

var fs = require('fs');
var util = require('util');
var events = require('events');

function Equilibrium(filepath) {
	this.fd = null;
	this.state = null;

  this.updated = false;
  this.draining = false;
	this.filepath = filepath;
}
util.inherits(Equilibrium, events.EventEmitter);
module.exports = function (filepath) { return new Equilibrium(filepath); };

// add query and begin draining
Equilibrium.prototype.write = function (state) {
	// add content to query
	this.state = state;
  this.updated = true;

  // write state to file
	this.drain();
};

// execute query
Equilibrium.prototype.drain = function () {
  if (this.updated === false) return;
	if (this.state === null) return;
  if (this.fd === null) return;
  if (this.draining) return;

  // don't allow simutainiously writes
	this.draining = true;

	var self = this;
	update(this, function handle(error) {
    if (error) self.emit('error', error);

    // we are done draining
    if (self.updated === false) {
      self.draining = false;
      return self.emit('drain');
    }

		// handle next query item
		update(self, handle);
	});
};

// update file
function update(self, callback) {
  self.updated = false;

  // convert state to a string
  var state = self.state;
  if (typeof state === 'object' && state !== null) {
    state = JSON.stringify(state);
  } else {
    state = state.toString();
  }

  // clean write to fd
	var buffer = new Buffer(state);
	fs.truncate(self.fd, 0, function (error) {
    if (error) return callback(error);

		fs.write(self.fd, buffer, 0, buffer.length, 0, function (error) {
      callback(error || null);
		});
	});
}

// open up file file descriptor
Equilibrium.prototype.open = function () {
	var self = this;

  // Ignore if the file is already opened
	if (this.fd) return;

	fs.open(this.filepath, 'w', function (error, fd) {
    if (error) return self.emit('error', error);

    // save fd
		self.fd = fd;
    self.emit('open', fd);
    self.drain();
	});
};

// close file descriptor
Equilibrium.prototype.close = function () {
	var self = this;

  // ignore closed fd
  if (this.fd === null) return;

  if (this.draining) {
    return this.once('drain', closeFd);
  }

  function closeFd() {
    fs.close(self.fd, function (error) {
      if (error) return self.emit('error', error);

      // reset fd
      self.fd = null;
      self.emit('close');
    });
  }
  closeFd();
};
