const Promise = require('bluebird');
Promise.longStackTraces();

const Suite = require('./suite');
const WorldModel = require('./worldModel');
const Request = require('./req');
const Reporter = require('./util/reporter');

const {Service, JsService, PyService} = require('./service');

const logger = require('./util/logger');

class Doogh {
	constructor() {
		this.services = [];
		this.suites = [];
		this.wm = null;
		this.reporter = new Reporter();
	}

	/**
	 * @param {Service} service
	 */
	submitService(service) {
		this.services.push(service);
	}

	/**
	 * @param {Suite} suite
	 */
	addSuite(suite) {
		this.suites.push(suite);
	}

	/**
	 * @param {WorldModel} wm
	 */
	register(wm) {
		this.wm = wm;
  }

  isOnlyMode() {
    let onlyCount = 0;
    this.suites.forEach(suite => {
      if (suite.hasOnly) {
        onlyCount++;
      }
      
      if (onlyCount > 1) {
        throw new Error('More than one only not allowed');
      }
    });

    return onlyCount === 1;
  }

	/**
	 * @param {TestCase} test
	 * @param {Line} testLog
	 * @param {?Error} tearDownError
	 * @returns {Boolean} test status, false => failed
	 */
	logTestResult(test, testLog, tearDownError) {
    if(test.status === Suite.Status.FAIL && !test.todo) {
      let message = 'Unknown error';
      if(test.error && test.error.message) {
        message = test.error.message;
      }
      testLog.error(message);
	    return false;
    } else if(test.status === Suite.Status.FAIL && test.todo) {
      let message = 'Unknown error';
      if(test.error && test.error.message) {
        message = test.error.message;
      }
      testLog.success(`todo test: ${message}`);
    } else if(test.status === Suite.Status.PASS && test.todo) {
      testLog.warn(`todo test succeed!!`);
    } else if(tearDownError) {
      let message = '';
      if(tearDownError.message) {
        message = tearDownError.message;
      }
      testLog.warn(`teardown error: ${message}`);
    } else {
      testLog.success();
    }

		return true;
  }

	/**
	 * @param {Suite} suite
	 * @param {TestCase} test
	 * @returns {Boolean} test status
	 */
  async runTest(suite, test) {
    let testLog = logger.scenario(test.description);

    if(test.status === Suite.Status.SKIP) {
      testLog.info('skip test');
	    return true;
    }

    let tearDownError = null;
    try {
      await this.wm.init();
      await suite.beforeEachFunction();
      await test.run(this.wm);
      try {
        await this.wm.tearDown();
      } catch(e) {
        tearDownError = e;
        test.environmentError = e;
      }
    } catch(e) {
      test.status = Suite.Status.FAIL;
    }

	  return this.logTestResult(test, testLog, tearDownError);
  }
  
	/**
	 * Run all suites
	 * @returns {Boolean} all suites succeeded?
	 */
  async runSuites() {
	  let allOkay = true;
    for(let i = 0, len = this.suites.length; i < len; ++i) {
      let suite = this.suites[i];
      
      for(let j = 0, testLen = suite.tests.length; j < testLen; ++j) {
        let test = suite.tests[j];

        if(this.onlyMode && !test.only) {
          continue;
        }

        let status = await this.runTest(suite, test);

        if(!status) {
	        allOkay = false;
        }
      }
    }

	  return allOkay;
  }

  
	async initialCheck() {
    let onlyMode = this.isOnlyMode();

    let testCount = this.suites.reduce((acc, suite) => acc + suite.tests.length, 0);

    if(onlyMode) {
      logger.startLogRequest();
      testCount = 1;
    }

    logger.testCount(testCount);

		this.onlyMode = onlyMode;
		this.reporter.onlyMode = onlyMode;
  }

	async runServices() {
    let serviceTask = logger.task(`running services`);
    for(let i = 0, len = this.services.length; i < len; ++i) {
      let service = this.services[i];
      await service.run();
    }
    serviceTask.success();
  }

	async waitForServices() {
	    let waitTask = logger.task(`initial wait`);
	    await this.wm.waitOnConnect();
	    waitTask.success();
	}

  async run() {
    let exitStatus = 0;

    try {
	    this.reporter.setSuites(this.suites);

	    await this.initialCheck();
	    await this.runServices();
	    await this.waitForServices();

	    let status = await this.runSuites();

	    if(!status) {
		    exitStatus = 1;
	    }

	    // final wait for only mode.
      if(this.onlyMode) {
        await Promise.delay(200);
      }

      logger.end();
	    this.reporter.printSummary();
      await this.killThemAll();

    } catch (e) {
      console.error(e);
	    exitStatus = 1;
    }

	  // maybe wait?
		process.exit(exitStatus);
	}

	async killThemAll() {
		this.services.map(service => {
			service.kill();
    });
	}
	log(...args) {
    logger.log(...args);
  }
}

const doogh = new Doogh();
module.exports = doogh;


process.on('exit', () => {
	doogh.killThemAll();
});

module.exports.WorldModel = WorldModel;
module.exports.Suite = Suite;
module.exports.Request = Request;
module.exports.Service = Service;
module.exports.logger = logger;
module.exports.Services = {
	JsService,
	PyService
};
