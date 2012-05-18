#equilibrium

**equilibrium will keep a state file up to date**

##Installation

```sheel
npm install equilibrium
```

##Example

```JavaScript
var equilibrium = require('equilibrium');

// create equilibrium stream
var stream = equilibrium(path.resolve('./state.json'));

// writes before stream is open will be cached
stream.write({ state: 1 });

// to open stream
stream.open();

// open event will then emit
stream.once('open', console.log);

// since a write query exist drain will also emit
stream.once('drain', console.log);

// simultaneous writes are optimsized so only the latest state will be saved
stream.write({ state: 2 });
stream.write({ state: 3 });
stream.write({ state: 4 });

// to simply close stream
stream.close();

// close event will then emit
stream.once('close', console.log);

// new writes are again buffers
stream.write({ state: 5 });

// you are even allowed to open the file descriptor again
stream.open();
```

##API documentation

###Stream = equilibrium(filepath)

will return an equilibrium stream. The filepath should be absaloute.

###Stream.open()

will open the file descriptor and drain the state query if such query exists.

###Stream.write(state):

Take just just about everything as first argument. Objects will be converted to a string
by using `JSON.stringify` anything else will be converted to a string by using `.toString()`.

When the file write is done, the `drain` event will emit.

###Stream.close();

Will close the file descriptor.

###Event: open

Will emit once the file descriptor is opened.
The event handlers first argument is the file descriptor.

###Event: drain

Will emit once the state query is drained.

###Event: close

Will emit once the file descriptor is closed.

##License

**The software is license under "MIT"**

> Copyright (c) 2012 Andreas Madsen
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
