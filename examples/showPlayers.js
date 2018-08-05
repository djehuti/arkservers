/*
 * MIT License
 *
 * Copyright (c) 2018 Ben Cox <cox@djehuti.com>.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

require('colors');
const parseArgs = require('minimist');
const arkservers = require('../arkservers.js');

const argv = parseArgs(process.argv.slice(2));
/** @namespace argv._ */

const interestingServers = argv._.length ? argv._ : ['NA-PVE-Official-Aberration409'];

arkservers.getServerList().then((serverInfos) => {
  console.log(`Total ${serverInfos.length} servers found.`);
  let found = 0;
  serverInfos.map((info) => {
    // eslint-disable-next-line prefer-const
    let [name, version] = info.name.split(' - ');
    version = version.replace(/\(v([^}]+)\)/, (match, p1) => p1);
    if (interestingServers.includes(name)) {
      found += 1;
      console.log(`Server ${name.green}, running ${version.bold.white}; online players:`);
      /** @namespace info.players */
      info.players.map((player) => {
        if (player.hasOwnProperty('name')) {
          console.log(`  ${player.name.blue}`);
        }
        return null;
      });
    }
    return null;
  });
  if (found === 0) {
    console.log('No matching server(s) found.');
  }
  return null;
});
