const chalk = require('chalk');
const MultiLineSpinner = require('./MultiLineSpinner');
const ora = require('ora');
const util = require('util');

class OraLine {
	constructor(text) {
		this.text = text;
		this.ora = ora(text);
		this.ora.start();

		this.ignore = false;
	}

	setText(text) {
		this.text = text;
		this.ora.text = text;
	}
	
	forceFinish(message) {
		if(this.ignore) {
      this.ora.succeed();
		}
	}
	
	_getText(text, fn) {
		if(text) {
			return this.text + fn(` - ` + text);
		}

		return this.text;
	}

	success(text) {
		if(this.ignore) {
			return;
		}
		this.ora.succeed(this._getText(text, chalk.cyan));
	}

	error(text) {
		if(this.ignore) {
			return;
		}
		this.ora.fail(this._getText(text, chalk.red));
	}

	info(text) {
		if(this.ignore) {
			return;
		}
		this.ora.info(this._getText(text, chalk.cyan));
	}

	warn(text) {
		if(this.ignore) {
			return;
		}
		this.ora.warn(this._getText(text, chalk.yellow));
	}

	comment(text) {
		this.ora.text = this._getText(text, chalk.cyan);
	}
}

class Logger {
	constructor() {
		this.spinner = new MultiLineSpinner(process.stdout);

		this.logRequests = false;
		this.logActions = true;

		this.lastTest = null;
		this.logRequestOnTest = true;

		this.compactMode = true;

		this._testCount = 0;
		this._it = 0;
	}


	testCount(t) {
		this._testCount = t;
	}

	startLogRequest() {
		this.logRequests = true;
    this.spinner.run();
	}

	task(name) {
		if(this.logActions) {
      return new OraLine(name);
		} else {
			console.log(`# ${name}`);
      return new MultiLineSpinner.FakeLine();
		}
	}

	_scenario(name) {
		if(this.logActions && !this.logRequests) {
      return new OraLine(name);
		}
		else if(this.logActions) {
			this.spinner.comment(`Running ${name}`);
		}
		else {
			console.log(`# Running ${name}`);
		}

		return new MultiLineSpinner.FakeLine();
	}

	scenario(name) {
		this._it++;
		let compactMode = false;
		if(this.compactMode && this.logActions && !this.logRequests) {
			compactMode = true;
		}

		if(compactMode) {
			name = `(${this._it}/${this._testCount}) ` + name;
		}

		if(compactMode && this.lastTest) {
			this.lastTest.setText(name);
			return this.lastTest;
		}
		
		let line = this._scenario(name);
		this.lastTest = line;
		if(compactMode) {
			line.ignore = true;
		}
		return line;
	}

	end() {
		this.spinner.finish();
		if(this.lastTest) {
			this.lastTest.forceFinish();
		}
	}

	log(...args) {
		if(this.logRequests) {
			this.spinner.comment(util.format(...args));
		}
	}

	url(text) {
		if(this.logRequests) {
      return this.spinner.addLine(text);
		}

		if(!this.logRequests && this.logRequestOnTest && this.lastTest) {
			this.lastTest.comment(text);
		}

		return new MultiLineSpinner.FakeLine();
	}
}

module.exports = new Logger();
