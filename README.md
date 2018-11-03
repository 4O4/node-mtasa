[![Build Status](https://travis-ci.org/4O4/node-mtasa.svg?branch=master)](https://travis-ci.org/4O4/node-mtasa?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/4O4/node-mtasa/badge.svg?branch=master)](https://coveralls.io/github/4O4/node-mtasa?branch=master)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

# MTA:SA SDK for Node.js

Lightweight module to simplify integration of external apps with MTA:SA servers. Uses the standard HTTP call interface, which you can learn more about [here]((https://wiki.multitheftauto.com/wiki/Resource_Web_Access). 

## Installation

```
npm install mtasa --save
```

## Usage

Import the `Client` class:

TypeScript:
```ts
import { Client } from "mtasa";
``` 

JavaScript:
```js
const Client = require('mtasa').Client;
```

Then create a new client instance and use it to make some remote calls:
``` ts
// Setup a new client for local server
const mta = new Client("127.0.0.1", 22005, "root", "pass");

// Perform calls using async/await:
(async () => {
    try {
        // Call some procedure
        const result = await mta.resources.test_resource.testProcedure("some param");

        // Call a procedure (the alternative verbose API)
        const verboseCallResult = await mta.call("test_resource", "testProcedure", "some param", 1234);
    } catch (err) {
        console.error(`Ooops! Something went wrong ${err}`);
    }
})()

// Without async/await, plain old Promises:
mta.resources.test_resource.testProcedure()
    .then((result) => {
        console.log(result);
    })
    .catch((err) => {
        console.error(`Ooops! Something went wrong ${err}`);
    });
```

For more information on how to expose your MTA server APIs (like the `testProcedure` function from `test_resource` resource) over the web interface, refer to [Resource Web Access](https://wiki.multitheftauto.com/wiki/Resource_Web_Access) wiki page.

## Documentation

The source code has inline documentation, which is also included in typings (`.d.ts`) shipped with the module. This means that no matter if you write plain old JavaScript or TypeScript - as long as you use some decent editor with intellisense (like Visual Studio Code), you should get nice autocompletion and feedback with documentation. Just give it a try yourself - use one of the examples above, type `new Client(` at the very end and hit `CTRL + Shift + Space` if the popup didn't appear automatically already.

![VSCode demo](https://i.imgur.com/ml8Nkdy.png)

You can also jump straight into the source code of the library and unit tests.


## Project status

This library is totally usable but is perhaps still lacking some features, hence the 0.1.x version. I consider it stable for my own needs. Feel free to report bugs or feature requests [here](https://github.com/4O4/node-mtasa/issues). PRs welcome too.

## License

MIT
