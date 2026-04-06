import path = require('path');
import fs = require('mz/fs');

const ora = require('ora');
const runscript = require('runscript');
const chalk = require('chalk');
const BaseCommand = require('../base_command');

class ImportCommand extends BaseCommand {
  spinner: any;
  count: number;

  async _run(cwd: string, [ from ]: string[]) {
    let repos = [];
    if (from === '--cache') {
      const keys = await this.cache.getKeys();
      for (const key of keys) {
        const option = await this.cache.get(key);
        if (option.repo) repos.push(option.repo);
      }
      await this.cache.dump();
    } else {
      this.count = 0;
      this.spinner = ora('Searching ' + from).start();
      repos = await this.findDirs(from);
      this.spinner.stop();
    }

    const baseDir = await this.chooseBaseDirectory();
    for (const repo of repos) {
      const key = this.url2dir(repo);
      const targetPath = path.join(baseDir, key);
      this.logger.info('Start importing repository %s', chalk.green(repo));
      if (await fs.exists(targetPath)) {
        this.logger.warn(chalk.yellow('%s exists'), targetPath);
        continue;
      }
      try {
        await this.addRepo(repo, targetPath);
      } catch (_) {
        this.error(`Fail to clone ${repo}`);
      }
    }
  }

  async findDirs(cwd: string): Promise<string[]> {
    this.spinner.text = `Found ${chalk.cyan(this.count)}, Searching ${cwd}`;
    const dirs = await fs.readdir(cwd);

    if (dirs.includes('.git')) {
      try {
        const { stdout } = await runscript('git config --get remote.origin.url', { stdio: 'pipe', cwd });
        this.spinner.text = `Found ${chalk.cyan(this.count++)}, Searching ${cwd}`;
        return [ stdout.toString().slice(0, -1) ];
      } catch (e) {
        return [];
      }
    }

    if (dirs.includes('node_modules')) {
      return [];
    }

    let gitdir: string[] = [];
    for (const dir of dirs) {
      const subdir = path.join(cwd, dir);
      const stat = await fs.stat(subdir);
      if (!stat.isDirectory()) {
        continue;
      }
      const subdirs = await this.findDirs(subdir);
      gitdir = gitdir.concat(subdirs);
    }
    return gitdir;
  }

  get description() {
    return 'Import repositories from existing directory';
  }
}

export = ImportCommand;
