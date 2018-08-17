const path = require('path');
const stackTrace = require('./stackTrace.js');

const Status = {
  PASS: Symbol.for('pass'),
  SKIP: Symbol.for('skip'),
  FAIL: Symbol.for('fail')
};

class TestCase {
  constructor(text, handler) {
    this.tags = [];
    this.description = text;
    this.state = '';
    this.filename = '';
    this.lineNumber = 0;
    this.only = false;
    this.todo = false;

    this.error = null;
    this.environmentError = null;

    this._handler = handler;

    this.status = Status.PASS;
  }

  async run(...args) {
    try {
      await this._handler(...args, this);
    } catch (e) {
      this.fail(e);
    }
  }

  pass() {
  }

  fail(e) {
    this.status = Status.FAIL;
    this.error = e;
  }
}


class Suite {
  constructor(name = null) {
    this.tests = [];

    this.name = name;
    let stack = stackTrace.parse(new Error());
    this.filename = stack[1].fileName;

    this.hasOnly = false;
    this.onlyTest = null;
    this.beforeEachFunction = async () => { };
  }

  getName() {
    if (this.name)
      return this.name;

    let str = path.basename(this.filename);
    return str.charAt(0).toUpperCase() + str.substr(1);
  }

  _test(text, fn) {
    let stack = stackTrace.parse(new Error());
    let caller = stack[2];

    let test = new TestCase(text, fn);
    test.filename = caller.fileName;
    test.lineNumber = caller.lineNumber;

    return test;
  }

	/**
	 * @param {String} text
	 * @param {Function} fn
	 */
  test(text, fn) {
    let test = this._test(text, fn);
    this.tests.push(test);
  }

	/**
	 * @param {String} text
	 * @param {Function} fn
	 */
  add(text, fn) {
    let test = this._test(text, fn);
    this.tests.push(test);
  }

	/**
	 * @param {String} text
	 * @param {Function} fn
	 */
  todo(text, fn) {
    let test = this._test(text, fn);
    test.todo = true;
    this.tests.push(test);
  }

	/**
	 * @param {String} text
	 * @param {Function} fn
	 */
  skip(text, fn) {
    let test = this._test(text, fn);
    test.status = Status.SKIP;
    this.tests.push(test);
  }

	/**
	 * @param {String} text
	 * @param {Function} fn
	 */
  only(text, fn) {
    let test = this._test(text, fn);
    if (this.hasOnly) {
      throw new Error('There are more than one only test');
    }

    this.hasOnly = true;
    this.onlyTest = test;

    test.only = true;

    this.tests.push(test);
  }

	/**
	 * @param {Function} fn
	 */
  beforeEach(fn) {
    this.beforeEachFunction = fn;
  }
}


module.exports = Suite;
module.exports.Status = Status;
