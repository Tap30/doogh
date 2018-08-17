const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');


class Service {
  constructor(name) {
    this.name = name;
  }

  async run() {
    throw new Error('Not implemented');
  }

  kill() {
    throw new Error('Not implemented');
  }
}

class SpawnService extends Service {
  /**
   *
   * @param {String} name
   * @param {String} cwd
   * @param {String} program
   * @param {Array.<String>} args
   * @param {Object} envVar
   * @param {?String} logDir
   */
  constructor(name, cwd, program, args, envVar, logDir) {
    super(name);
    this.cwd = cwd;
    this.program = program;
    this.args = args;
    this.envVar = envVar;
    this.logDir = logDir;

    /**
     * @type {?ChildProcess}
     */
    this.process = null;
  }

  /**
   * @override
   * @returns {Promise<void>}
   */
  async run() {
    let env = Object.create(process.env);
    let cwd = process.cwd();
    Object.assign(env, this.envVar);
    process.chdir(this.cwd);
    this.process = spawn(this.program, this.args, {env});
    process.chdir(cwd);

	  if(this.logDir) {
		  let dir = path.join(cwd, this.logDir);
		  try {
			  // TODO maybe async?
			  fs.mkdirSync(dir);
		  } catch(e) {
		  }

		  let logAddress = path.join(dir, `${this.name}.doogh.log`);
      let logFile = fs.createWriteStream(logAddress);
      this.process.stdout.pipe(logFile);
      this.process.stderr.pipe(logFile);
	  }

	  //Promise.delay(1000);
  }

  /**
   * @override
   */
  kill() {
    this.process.kill();
  }
}

class JsService extends SpawnService {
  /**
   *
   * @param {String} name
   * @param {String} cwd
   * @param {String} script
   * @param {Array.<String>} args
   * @param {Object} envVar
   * @param {?String} logDir
   */
	constructor(name, cwd, script, args, envVar, logDir) {
	  super(name, cwd, 'node', [script, ...args], envVar, logDir);
  }
}

class PyService extends SpawnService {
  /**
   *
   * @param {String} name
   * @param {String} cwd
   * @param {String} moduleName
   * @param {Array.<String>} args
   * @param {Object} envVar
   * @param {String} executable
   * @param {?String} logDir
   */
	constructor(name, cwd, moduleName, args, envVar, executable = 'python', logDir = './logs') {
		super(name, cwd, executable, ['-m', moduleName, ...args], envVar, logDir);
  }
}


module.exports.Service = Service;
module.exports.SpawnService = SpawnService;
module.exports.JsService = JsService;
module.exports.PyService = PyService;
