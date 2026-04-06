const BaseCommand = require('../base_command');

class RunCommand extends BaseCommand {
  async _run(cwd: string, [ hookName ]: string[]) {
    if (!hookName || !this.config.hooks[hookName]) {
      throw new Error(`hook "${hookName}" don't exist`);
    }

    const keys = await this.cache.getKeys();
    for (const key of keys) {
      try {
        await this.runHook(hookName, key);
      } catch (err: any) {
        this.childLogger.error(err.message);
      }
    }
  }

  get description() {
    return 'Run hook in every repository';
  }
}

export = RunCommand;
