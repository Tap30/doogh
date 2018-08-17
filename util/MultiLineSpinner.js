const Promise = require('bluebird');
const chalk = require('chalk');

// symbols
// https://github.com/sindresorhus/log-symbols/
const symbols = {
  info: chalk.blue('ℹ'),
  success: chalk.green('✔'),
  warning: chalk.yellow('⚠'),
  error: chalk.red('✖')
};

// frames
// https://github.com/sindresorhus/cli-spinners
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

class CommentLine {
	constructor(text) {
		this.text = text;
		this.frame = 0;
		this.finished = true;
	}

	print(stream) {
		stream.write(this.text + "\n");
	}
}


class FakeLine {
	constructor() {
	}

	forceFinish() {
	}
	
	success() {
	}

	error() {
	}

	info() {
	}

	warn() {
	}

	comment() {
	}
}

class Line {
  constructor(text) {
    this.text = text;
    this.additional = '';
    this.frame = 0;

    this.finished = false;
    this.symbol = ' ';
  }

	forceFinish() {
	}


  _finish(symbol, additional = '') {
    this.additional = additional;
    this.finished = true;
    this.symbol = symbol;
  }

  success(additional) {
    if(additional) {
      additional = chalk.green(additional);
    }
    this._finish(symbols.success, additional);
  }

  error(additional) {
    if(additional) {
      additional = chalk.red(additional);
    }
    this._finish(symbols.error, additional);
  }

  warn(additional) {
    this._finish(symbols.warning, additional);
  }

  info(additional) {
    this._finish(symbols.info, additional);
  }

	comment(additional) {
		if(additional) {
			additional = chalk.cyan(additional);
		}

    this.additional = additional;
	}
  
  print(stream) {
    let symbol = chalk.cyan(frames[this.frame % frames.length]);
    let str = this.text;
    if(this.additional != '') {
      str += ` - ${this.additional}`;
    }

    if(this.finished) {
      symbol = this.symbol;
    }

    stream.write(symbol + " " + str + "\n");
  }
}

class MultiLineSpinner {
  constructor(stream) {
    if(!stream) {
      stream = process.stderr;
    }
    this.lines = [];
    this.newLines = [];
    this.stream  = stream;

    this.finished = false;
  }

  addLine(text) {
    let line = new Line(text);
    this.newLines.push(line);

    return line;
  }

	comment(text) {
		let line = new CommentLine(text);
		this.newLines.push(line);

		return line;
	}


  async run(delay = 20) {
    while(!this.finished) {
      this.newFrame();
      await Promise.delay(80);
    }
  }

  finish() {
    this.finished = true;
  }

  newFrame() {
    this.stream.moveCursor(0, -this.lines.length);

    this.newLines.forEach(line => {
      this.lines.push(line);
    });

    this.newLines = [];

    this.lines.forEach(line => {
      line.print(this.stream);
      line.frame++;
    });

    let first = true;

    this.lines = this.lines.map(line => {
      if(!first) {
        return line;
      }
      if(line.finished) {
        return null;
      }

      first = false;

      return line;
    }).filter(line => line != null);
  }
}


module.exports = MultiLineSpinner;
module.exports.FakeLine = FakeLine;
