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

const colors = require('colors/safe');
const parseArgs = require('minimist');
const arkservers = require('../arkservers.js');

const argv = parseArgs(process.argv.slice(2));

const interestingServers = argv._.length ? argv._ : ['NA-PVE-Official-Aberration409'];
const useColor = argv.color === undefined ? true : argv.color;

const identity = x => x;
const green = useColor ? colors.green : identity;
const white = useColor ? colors.white : identity;
const bold = useColor ? colors.bold : identity;
const blue = useColor ? colors.blue : identity;

const durationAsString = (seconds) => {
  const minutes = parseInt(seconds / 60, 10);
  const hours = parseInt(minutes / 60, 10);
  const modMinutes = minutes % 60;
  return `${hours}h${modMinutes}m`;
};

arkservers.getServerList().then((serverInfos) => {
  console.log(`Total ${serverInfos.length} servers found.`);
  let found = 0;
  serverInfos.forEach((info) => {
    const { name, version } = info;
    if (interestingServers.includes(name)) {
      found += 1;
      console.log(`Server ${green(name)}, running ${white(bold(version))}`);
      console.log(`  Map: ${white(info.map)} (${info.mode}) - day ${info.dayNumber}`);
      console.log(`  Max players: ${info.maxPlayers}`);
      console.log(`  Currently online players (${info.players.length}):`);
      info.players.forEach((player) => {
        console.log(
          `    ${blue(player.steamName)}: on ${durationAsString(player.elapsedTime)}`,
        );
      });
    }
  });
  if (found === 0) {
    console.log('No matching server(s) found.');
  }
  return null;
});
