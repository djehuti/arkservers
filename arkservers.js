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

const _ = require('lodash');
const { query: gamedigQuery } = require('gamedig');
const http = require('http');
const { ArkServerInfo } = require('./arkserverinfo.js');


const arkservers = {
  /** The `Gamedig` game code for ARK: Survival Evolved. */
  ARK_GAME_TYPE: 'arkse',

  /** The base URI on which the Ark Server Info API lives. */
  BASE_URI: 'http://arkdedicated.com',

  /** The URI (beginning with '/', relative to `BASE_URI`) for the version API. */
  VERSION_URI: '/version',

  /** The URI (beginning with '/', relative to `BASE_URI`) for the server-status API. */
  STATUS_URI: '/officialserverstatus.ini',

  /** The URI (beginning with '/', relative to `BASE_URI`) for the news API. */
  NEWS_URI: '/news.ini',

  /** The URI (beginning with '/', relative to `BASE_URI`) for the server-list API. */
  SERVER_LIST_URI: '/officialservers.ini',

  /** The list of ports on each server host, on which Ark servers are running. */
  PORT_LIST: [27015, 27017, 27019, 27021],

  /** The "max server attempts" value for our `Gamedig` queries. */
  MAX_SERVER_ATTEMPTS: 3,

  /** The query socket timeout value for our `Gamedig` queries. */
  QUERY_SOCKET_TIMEOUT: 1500,
};


/**
 * Simple internal helper function used by many of the public APIs.
 *
 * @param {string} baseUri The base URI for the Ark server info service.
 * @param {string} apiUri  The URI for the specific API being called.
 * @returns {Promise} A promise that resolves to the content fetched from the URI formed
 *                    by joining the base and API URIs.
 */
function fetchUri(baseUri, apiUri) {
  return new Promise((resolve, reject) => {
    const fullUri = baseUri + apiUri;
    http.get(fullUri, (res) => {
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        resolve(rawData);
      });
    }).on('error', e => reject(e));
  });
}


/**
 * Function to return a function that returns a cached value (or null, if the cache isn't ready
 * yet) for the given URI.
 *
 * @param {string} baseUri The base URI for the Ark server info service.
 * @param {string} apiUri  The URI for the specific API being called.
 * @returns {function} A cached function that returns the content fetched from the URI formed
 *                     by joining the base and API URIs, or null if the cache is not yet ready.
 */
const cachedUri = _.memoize((baseUri, apiUri) => (function makeCacher() {
  const state = {
    cachedValue: null,
    inProgress: false,
  };
  /**
   * Function that returns the cached value from the URI.
   *
   * @returns {string} The content fetched from the URI formed by joining the base and
   *                   API URIs captured from the calling environment (set when this function
   *                   is created).
   */
  return function cacher() {
    if (state.cachedValue === null) {
      if (!state.inProgress) {
        state.inProgress = true;
        fetchUri(baseUri, apiUri).then((result) => {
          state.cachedValue = result;
          state.inProgress = false;
        }).catch((reason) => {
          console.log(`error fetching ${baseUri + apiUri}: ${reason}; will retry on next request`);
          state.inProgress = false;
        });
      }
    }
    return state.cachedValue;
  };
}()), (...args) => JSON.stringify(args));


/**
 * Get the current latest ARK server version.
 * Example resolved value: `281.110`
 * @returns {Promise} A Promise that resolves to the latest version string.
 */
arkservers.getVersion = function getVersion() {
  return fetchUri(arkservers.BASE_URI, arkservers.VERSION_URI);
};

/**
 * Get the cached value of the latest ARK server version.
 * @returns {?string} The cached value of the latest version string, or null if
 *                    the cache is not ready.
 * @see getVersion
 */
arkservers.getCachedVersion = function getCachedVersion() {
  return cachedUri(arkservers.BASE_URI, arkservers.VERSION_URI)();
};

/**
 * Get the current ARK server network status.
 * Example resolved value:
 *   ```
 *   ARK Official Server Network Status: <RichColor Color="0, 1, 0, 1">Healthy (v281.110)</>\r\n
 *   <RichColor Color="1, 0.6, 1, 1">ARK Evolution is now active!</>
 *   ```
 * @returns {Promise} A Promise that resolves to a server status string, which may
 *                    be in {@link https://ark.gamepedia.com/ArkML|ArkML format}.
 */
arkservers.getStatus = function getStatus() {
  return fetchUri(arkservers.BASE_URI, arkservers.STATUS_URI);
};

/**
 * Get the cached value of the ARK server network status.
 * @returns {string} The server status string, which may be in ArkML format, or null if
 *                   the cache is not ready.
 * @see getStatus
 */
arkservers.getCachedStatus = function getCachedStatus() {
  return cachedUri(arkservers.BASE_URI, arkservers.STATUS_URI)();
};

/**
 * Get the current ARK server network news.
 * @returns {Promise} A Promise that resolves to a server news string, which may
 *                    be in {@link https://ark.gamepedia.com/ArkML|ArkML format}.
 */
arkservers.getNews = function getNews() {
  return fetchUri(arkservers.BASE_URI, arkservers.NEWS_URI);
};

/**
 * Get the cached version of the ARK server network news.
 * @returns {string} The server news string, which may be in ArkML format, or null if
 *                   the cache is not ready.
 * @see getNews
 */
arkservers.getCachedNews = function getCachedNews() {
  return cachedUri(arkservers.BASE_URI, arkservers.NEWS_URI)();
};


// Prime the caches for the default servers.
arkservers.getCachedVersion();
arkservers.getCachedStatus();
arkservers.getCachedNews();


/**
 * Form a Gamedig query for the given host/port.
 * @param {string} host The server IP.
 * @param {number} port The port number.
 * @returns {{type: string, host: string, port: number, port_query: number,
 * maxAttempts: number, socketTimeout: number}}
 */
const queryForHost = (host, port) => ({
  type: arkservers.ARK_GAME_TYPE,
  host,
  port,
  port_query: port,
  maxAttempts: arkservers.MAX_SERVER_ATTEMPTS,
  socketTimeout: arkservers.QUERY_SOCKET_TIMEOUT,
});


/**
 * Get the current list of available ARK servers.
 * @param {?[string]} serverIPs List of server IPs to be queried (default: fetched from server).
 * @param {?[number]} ports List of port numbers to be queried (default: arkservers.PORT_LIST).
 * @returns {Promise<[Promise<ArkServerInfo>]>} A Promise that resolves to a list of Promises that
 *                                              resolve to ArkServerInfo objects.
 */
arkservers.getServerPromises = async function getServerPromises(serverIPs = null, ports = null) {
  const useServerIPs = serverIPs || await (async () => {
    const serverList = await fetchUri(arkservers.BASE_URI, arkservers.SERVER_LIST_URI);
    return serverList.split(/\r?\n/).map(line => line.split(/\s+/)[0]);
  })();
  const serverQueries = useServerIPs.map(
    serverIP => (ports || arkservers.PORT_LIST).map(
      port => queryForHost(serverIP, port),
    ),
  ).reduce((acc, val) => acc.concat(val));
  return serverQueries.map(query => gamedigQuery(query).then(
    result => new ArkServerInfo(result),
  ));
};


/**
 * Get the current list of available ARK servers.
 * @param {?[string]} serverIPs List of server IPs to be queried (default: fetched from server).
 * @param {?[number]} ports List of port numbers to be queried (default: arkservers.PORT_LIST).
 * @returns {Promise<[ArkServerInfo]>} A Promise that resolves to a list of server info objects.
 */
arkservers.getServerList = async function getServerList(serverIPs = null, ports = null) {
  const serverPromises = await arkservers.getServerPromises(serverIPs, ports);
  const nullablePromises = serverPromises.map(qpromise => qpromise.catch(() => null));
  const resolved = await Promise.all(nullablePromises);
  return resolved.filter(val => val !== null);
};


/**
 * Get the query results for a single server, by name, optionally supplying an IP and/or port
 * hint (where the server was last seen). If the hints are given, but the server is not found,
 * and fallback is true, look through the full server list to find the server.
 * @param {string} serverName
 * @param {?string} host The IP the server was last seen on.
 * @param {?number} port The port number the server was last seen on.
 * @param {?boolean} fallback Whether to look at the full list if hints don't help (default: true).
 * @returns {Promise<ArkServerInfo|null>} The server info, or null if the server can't be found.
 */
arkservers.getServerInfo = async function queryServer(
  serverName,
  { host = null, port = null, fallback = true } = {},
) {
  // First, try the IP/Port that was given in the hint.
  // (This uses one or both hints, or neither.)
  let resultList = (await arkservers.getServerList(
    host ? [host] : null,
    port ? [port] : null,
  )).filter(
    info => info.name === serverName,
  );

  // If the caller gave both hints, try using just the host hint.
  // (If they just passed one hint, we tried that one above.)
  if (resultList.length === 0 && fallback && !!host && !!port) {
    resultList = (await arkservers.getServerList([host], null)).filter(
      info => info.name === serverName,
    );

    // Still no luck. Maybe just try the port hint.
    if (resultList.length === 0) {
      resultList = (await arkservers.getServerList(null, [port])).filter(
        info => info.name === serverName,
      );
    }
  }

  // If that didn't work (and the caller actually gave either hint), then go back and ask the
  // Ark Server Info API host for a server list, and look among those. (This uses neither hint.)
  if (resultList.length === 0 && fallback && (!!host || !!port)) {
    resultList = (await arkservers.getServerList()).filter(
      info => info.name === serverName,
    );
  }

  return resultList.length > 0 ? resultList[0] : null;
};


module.exports = arkservers;
