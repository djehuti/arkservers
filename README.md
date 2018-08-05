# arkservers
A Node module for getting information from *Ark: Survival Evolved* game servers.

The `arkservers` module provides a few functions for getting information from
the [Web API](https://ark.gamepedia.com/Web_API) for official servers for
*Ark: Survival Evolved*.

### Usage

```
npm install arkservers
```

```javascript 1.8
const arkservers = require('arkservers');

arkservers.getVersion().then((version) => {
  console.log(version);
}).catch((reason) => console.log(`Error: ${reason}`));
```

The above code snippet prints (at the time of this writing)
```
281.110
```

See the `examples/showPlayers.js` example (which you can run with `npm run example`)
for an example of the `getServers()` function, which returns an Array of entries as
resolved by the Promises returned by `Gamedig.query()`
(see [Gamedig](https://www.npmjs.com/package/gamedig)).

### Documentation

See the JSDoc in the `arkservers.js` file.

### License

`arkservers` is published under the MIT license.
