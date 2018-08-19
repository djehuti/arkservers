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


// Document the objects we expect to get back from Gamedig, to shut IntelliJ up.

/**
 * @typedef {Object} GameRules
 * @property {string} DayTime_s The current day in-game.
 * @property {string} SESSIONISPVE_i Whether the session is PVE or PVP.
 */

/**
 * @typedef {Object} GamedigResult
 * @property {string} name The name and version, in the format `NAME - (vVERSION)`.
 * @property {string} map The map name (e.g. 'Aberration')
 * @property {number} maxplayers The maximum number of players supported by this server.
 * @property {[*]} players The list of players, as { name, score, time } objects.
 * @property {*} raw The raw Gamedig results object.
 * @property {GameRules} raw.rules The rules object.
 */


/**
 * The ArkPlayer class represents a logged-in ARK player.
 * @property {string} playerName The player's name as it appears in ARK.
 * @property {string} steamName The player's Steam name (in-game, shown in white above playerName).
 * @property {string} steamId The player's Steam ID, if we know it, or null.
 * @property {number} elapsedTime The number of seconds since the player logged in
 * (as of the time of the query).
 */
class ArkPlayer {
  constructor({ name, time }) {
    this.playerName = null; // Don't know how to get this, at the moment.
    this.steamName = name;
    this.steamId = null; // We could look this up via Steam APIs. (Maybe later.)
    this.elapsedTime = time;
  }
}


/**
 * The ArkServerInfo class represents an ARK game server.
 * @property {string} name The server name, as it appears in the in-game browser
 * (e.g., "NA-PVE-Official-Aberration409").
 * @property {string} version The server version (e.g., "281.110").
 * @property {Object} gamedigQueryResult The raw result from Gamedig, for advanced users.
 * @property {number} maxPlayers The maximum number of players supported by the server.
 * @property {string} map The map the server is using (e.g., "Aberration").
 * @property {?number} dayNumber The in-game day number as of the time of the query, if known.
 * @property {?string} mode The game mode ('PVE' or 'PVP'), if known (or null).
 * @property {[ArkPlayer]} players The list of currently-active (at query time) players.
 */
class ArkServerInfo {
  /**
   * Construct a new ArkServerInfo object from the given Gamedig query result.
   * @param {?GamedigResult|{}} gdResult The results from Gamedig.
   */
  constructor(gdResult = {}) {
    // Save the raw info for pawing through for advanced users.
    this.gamedigQueryResult = gdResult;

    // Also directly expose a few things from the raw info on this object.
    if (gdResult.name) {
      const [gdName, gdVersion] = gdResult.name.split(' - ', 2);
      this.name = gdName;
      this.version = gdVersion.replace(/\(v([^}]+)\)/, (match, p1) => p1);
    } else {
      this.name = null;
      this.version = null;
    }
    this.players = (gdResult.players || []).filter(p => !!p && !!p.name).map(p => new ArkPlayer(p));
    this.maxPlayers = gdResult.maxplayers;
    this.map = gdResult.map;
    this.dayNumber = gdResult.raw ? parseInt(gdResult.raw.rules.DayTime_s, 10) : null;
    if (gdResult.raw) {
      this.mode = gdResult.raw.rules.SESSIONISPVE_i ? 'PVE' : 'PVP';
    }
  }
}


module.exports = {
  ArkPlayer,
  ArkServerInfo,
};
