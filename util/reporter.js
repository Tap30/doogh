const Suite = require('../suite');
const chalk = require('chalk');

function getErrorStr(test) {
	let s = `FAILED ${test.description} [${test.filename}:${test.lineNumber}]`;
	let errorStr = '';
	if (test.error.stack) {
		errorStr = test.error.stack.toString();
		errorStr = "\t" + errorStr.split("\n").join("\n\t");
	} else {
		errorStr = test.error.toString();
	}
	return s + "\n" + errorStr;
}

class ReportStatus {
	constructor(name) {
		this.name = name;

		this.passed = [];
		this.failed = [];
		this.skipped = [];
		this.todo = [];
		this.todoPassed = [];
	}

	test(test) {
		if(test.todo) {
			this.todo.push(test);
		}

		switch(test.status) {
		case Suite.Status.FAIL:
			if(!test.todo) {
				this.failed.push(test);
			}
			break;
		case Suite.Status.PASS:
			if(!test.todo) {
				this.passed.push(test);
			} else {
				this.todoPassed.push(test);
			}
			break;
		case Suite.Status.SKIP:
			this.skipped.push(test);
			break;
		}
	}

	add(status) {
		this.passed     = this.passed.concat(status.passed);
		this.failed     = this.failed.concat(status.failed);
		this.skipped    = this.skipped.concat(status.skipped);
		this.todo       = this.todo.concat(status.todo);
		this.todoPassed = this.todoPassed.concat(status.todoPassed);
	}

	print(short = false) {
		let okay = this.skipped.length === 0;
		let skipped = this.skipped.length;
		let failed = this.failed.length;

		let total = this.passed.length + failed + skipped + this.todo.length;

		let failedStr = failed ? chalk.red(`${failed} failed `) : '';
		let skippedStr = skipped ? chalk.yellow(`${skipped} skipped `) : '';
		

		let begin = `${this.name} ${okay ? 'OKAY' : 'NOT OKAY'} `; 
		
		if(short) {
			begin = '';
		}
		
		console.log(`${begin}${total} tests. ${failedStr}${skippedStr}`);

		if(short) {
			return;
		}
		
		this.todoPassed.forEach(test => {
			console.log(chalk.yellow(`todo test passed : ${test.description} [${test.filename}:${test.lineNumber}]`));
		});

		this.failed.forEach(test => {
			let errorStr = getErrorStr(test);
			
			console.log(chalk.red(errorStr));
		});
	}
}

class Reporter {
	constructor() {
		this.suites = [];
		this.onlyMode = false;
	}

	setSuites(suites) {
		this.suites = suites;
	}

	printSummary() {
		if(this.onlyMode) {
			this.printSummarySingle();
			return;
		}

		this.printSummaryMulti();
	}

	
	printSummarySingle() {
		console.log();
		console.log();
		this.suites.forEach(suite => {
			suite.tests.forEach(test => {
				if (!test.only) {
					return;
				}


				let status = (test.status !== Suite.Status.FAIL);
				let statusStr =  status ? `PASSED` : `FAILED`;

				let str = `"${test.description}" ${statusStr}`;
				if (status) {
					str = chalk.green(str);
				} else {
					str = chalk.red(str);
				}

				console.log(str);

				if (!status) {
					console.log(chalk.red(getErrorStr(test)));
				}

			});
		});
		console.log();
	}
	
	printSummaryMulti() {
		const globalStatus = new ReportStatus('total');

		console.log();
		console.log();
		this.suites.forEach(suite => {
			const status = this.calculateSuiteStatus(suite);
			status.print();
			globalStatus.add(status);
		});

		console.log();
		globalStatus.print(true);
	}

	calculateSuiteStatus(suite) {
		const tests = suite.tests;
		const status = new ReportStatus(suite.getName());

		tests.forEach(test => {
			status.test(test);
		});

		return status;
	}
}


module.exports = Reporter;
