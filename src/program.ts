import path = require('path');

const Command = require('common-bin');
const pkg = require('../package.json') as { version: string };

class Program extends Command {
  constructor(rawArgv?: string[]) {
    super(rawArgv);
    this.yargs.scriptName('projj');
    this.usage = 'Usage: [command] [options]';
    this.version = pkg.version;
    this.load(path.join(__dirname, 'command'));
  }
}

export = Program;
