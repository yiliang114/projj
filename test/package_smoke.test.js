'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

describe('test/package_smoke.test.js', () => {
  let sandboxDir;
  let packDir;
  let extractDir;
  let installDir;

  before(() => {
    sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projj-package-smoke-'));
    packDir = path.join(sandboxDir, 'pack');
    extractDir = path.join(sandboxDir, 'extract');
    installDir = path.join(sandboxDir, 'install');
    fs.mkdirSync(packDir);
    fs.mkdirSync(extractDir);
    fs.mkdirSync(installDir);
  });

  after(() => {
    fs.rmSync(sandboxDir, { recursive: true, force: true });
  });

  it('should pack a runnable cli artifact', () => {
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const packOutput = cp.execFileSync(npmCommand, [ 'pack', '--json', '--pack-destination', packDir ], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });
    const packed = JSON.parse(packOutput);
    const tarballPath = path.join(packDir, packed[0].filename);

    cp.execFileSync('tar', [ '-xzf', tarballPath, '-C', extractDir ]);

    const packageDir = path.join(extractDir, 'package');
    cp.execFileSync(npmCommand, [ 'install', '--prefix', installDir, tarballPath ], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });

    const installedPackageDir = path.join(installDir, 'node_modules', '@yiliang114', 'projj');
    const versionOutput = cp.execFileSync(process.execPath, [ path.join(installedPackageDir, 'bin/projj.js'), '-v' ], {
      cwd: installedPackageDir,
      encoding: 'utf8',
    });
    const helpOutput = cp.execFileSync(process.execPath, [ path.join(installedPackageDir, 'bin/projj.js') ], {
      cwd: installedPackageDir,
      encoding: 'utf8',
    });

    assert(fs.existsSync(path.join(packageDir, 'bin/projj.js')));
    assert(fs.existsSync(path.join(packageDir, 'lib/program.js')));
    assert(fs.existsSync(path.join(installedPackageDir, 'bin/projj.js')));
    assert.strictEqual(versionOutput, require('../package.json').version + '\n');
    assert(/Usage: \[command\] \[options]/.test(helpOutput));
  });
});
