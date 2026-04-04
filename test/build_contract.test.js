'use strict';

const assert = require('assert');
const cp = require('child_process');
const path = require('path');

describe('test/build_contract.test.js', () => {
  it('should build the cli runtime without changing the entrypoint contract', () => {
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    cp.execFileSync(npmCommand, [ 'run', 'build' ], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'pipe',
    });
    cp.execFileSync(npmCommand, [ 'run', 'lint', '--', 'lib/program.js' ], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'pipe',
    });

    const helpOutput = cp.execFileSync(process.execPath, [ path.join(__dirname, '../bin/projj.js') ], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });

    assert(/Usage: \[command\] \[options]/.test(helpOutput));
  });
});
