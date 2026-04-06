const BaseCommand = require('../base_command');

class RunCommand extends BaseCommand {
  async _run(cwd: string, [ hookName ]: string[]) {
    if (!hookName || !this.config.hooks[hookName]) {
      throw new Error(`Hook "${hookName}" don't exist`);
    }

    await this.runHook(hookName, cwd);
  }

  get description() {
    return 'Run hook in current directory';
  }
}

export = RunCommand;
