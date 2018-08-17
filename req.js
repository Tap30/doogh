const request = require('request-promise');
const chalk = require('chalk');
const Promise = require('bluebird');
const logger = require('./util/logger');


const withTimeout = Promise.promisify(function WithTimeout(timeout, reason, promise, cb) {
  promise.then(res => {
    cb(null, res);
  }).catch(err => {
    cb(err);
  });

  setTimeout(() => {
    cb(new Error(`Request timeout ${reason}`));
  }, timeout);
});

class Request {
  constructor(url) {
    this.baseUrl = url;
    this.defaultHeaders = {};
    this.timeout = 15000; // ms
  }

  /**
    *
    * @param {String} method
    * @param {String} endpoint
    * @param {Object} body
    * @param {Object} headers
    * @returns {Promise<void>}
    */
  async request(method, endpoint, body = {}, headers = null) {
    if (!headers) {
      headers = this.defaultHeaders;
    }

    body = JSON.parse(JSON.stringify(body));

    const options = {
      method,
      headers,
      body,

      url: this.baseUrl + endpoint,
      json: true,
    };

	  let log = logger.url(`${method} ${chalk.cyan(endpoint)}`);

    try {
      const result = await withTimeout(this.timeout, endpoint, request(options));
      // TODO global validations maybe?
	    log.success();
      return result;
    } catch (e) {
	    log.error(e.message);
      throw e;
    }
  }

  async post(...args) {
    return this.request('POST', ...args);
  }

  async get(...args) {
    return this.request('GET', ...args);
  }

  async put(...args) {
    return this.request('PUT', ...args);
  }

  async delete(...args) {
    return this.request('DELETE', ...args);
  }
}

module.exports = Request;
