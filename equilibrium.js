/**
 * Copyright (c) 2011 Andreas Madsen
 * GPL License Version 3
 */

var fs = require('fs');
var util = require('util');
var events = requrie('events');

function Equilibrium(filepath) {
	this.fd = null;
	this.query = [];
	this.draining = false;
	this.filepath = filepath;
}
util.inherits(Equilibrium, events.EventEmitter);
module.exports = function (filepath) { return new Equilibrium(filepath); };

// add query and begin draining
Equilibrium.prototype.write = function (content) {
	// add content to query
	this.query.push(content);

	// begin draining if a file descriptor exist
	if (this.fd) this.drain();
};

// execute query
Equilibrium.prototype.drain = function () {
  if (this.fd === null) return;

  if (this.draining) return;
	this.draining = true;

	// do not handle query if it's empty
	if (this.query.length === 0) {
		this.draining = false;
		return;
	}

	var self = this;
	update(this, function handle(error) {
    if (error) self.emit('error', error);

		// stop if query is empty
		if (self.query.length === 0) {
			self.draining = false;
      return self.emit('drain');
		}

		// handle next query item
		update(self, handle);
	});
};

// update file
function update(self, callback) {
	var content = self.query.shift();
	var buffer = new Buffer(content);

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
	});
};

// close file descriptor
Equilibrium.prototype.close = function () {
	var self = this;

  // ignore closed fd
  if (this.fd === null) return;

  fs.close(this.fd, function (error) {
    if (error) return self.emit('error', error);

    // reset fd
    self.fd = null;
    self.emit('close');
	});
};

// remove file descriptor
Equilibrium.prototype.remove = function (callback) {
	var self = this;

	// just remove file if channel is closed
	if (self.fd === null) {
		fs.unlink(self.filepath, callback);
    self.emit('removed');
		return;
	}

	this.close(function () {
		fs.unlink(self.filepath, callback);
    self.emit('removed');
	});
};
