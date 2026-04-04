'use strict';

const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('test/runtime_helpers.test.js', () => {
  it('should build and emit a working utils runtime', () => {
    const repoRoot = path.join(__dirname, '..');
    const utilsModulePath = path.join(repoRoot, 'lib/utils.js');
    const originalSource = fs.readFileSync(utilsModulePath, 'utf8');
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const eslintCommand = path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'eslint.cmd' : 'eslint');
    let buildSucceeded = false;

    try {
      fs.rmSync(utilsModulePath, { force: true });

      cp.execFileSync(npmCommand, [ 'run', 'build' ], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      cp.execFileSync(eslintCommand, [ 'lib/utils.js' ], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      buildSucceeded = true;

      delete require.cache[require.resolve('../lib/utils')];
      const utils = require('../lib/utils');
      const script = utils.generateAppleScript('/tmp/projj-example');

      assert(script.includes('tell application "Terminal"'));
      assert(script.includes('tell application "iTerm"'));
      assert(script.includes('cd /tmp/projj-example'));
    } finally {
      if (!buildSucceeded) {
        fs.writeFileSync(utilsModulePath, originalSource);
      }
    }
  });

  it('should build and emit a working ssh runtime', () => {
    const repoRoot = path.join(__dirname, '..');
    const sshModulePath = path.join(repoRoot, 'lib/ssh.js');
    const originalSource = fs.readFileSync(sshModulePath, 'utf8');
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const eslintCommand = path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'eslint.cmd' : 'eslint');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projj-ssh-test-'));
    const capturePath = path.join(tmpDir, 'ssh-args.txt');
    const sshStubPath = path.join(tmpDir, 'ssh');
    let buildSucceeded = false;

    try {
      fs.writeFileSync(sshStubPath, '#!/bin/sh\nprintf \'%s\\n\' "$@" > "$SSH_CAPTURE_FILE"\n');
      fs.chmodSync(sshStubPath, 0o755);
      fs.rmSync(sshModulePath, { force: true });

      cp.execFileSync(npmCommand, [ 'run', 'build' ], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      cp.execFileSync(eslintCommand, [ 'lib/ssh.js' ], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      buildSucceeded = true;

      cp.execFileSync(process.execPath, [ sshModulePath, 'example.com', '-p', '22' ], {
        cwd: repoRoot,
        encoding: 'utf8',
        env: Object.assign({}, process.env, {
          PATH: `${tmpDir}${path.delimiter}${process.env.PATH || ''}`,
          SSH_CAPTURE_FILE: capturePath,
        }),
      });

      assert.deepStrictEqual(fs.readFileSync(capturePath, 'utf8').trim().split('\n'), [
        '-o',
        'StrictHostKeyChecking=no',
        'example.com',
        '-p',
        '22',
      ]);

      assert.strictEqual(fs.readFileSync(sshModulePath, 'utf8').startsWith('#!/usr/bin/env node\n'), true);
      assert.doesNotThrow(() => fs.accessSync(sshModulePath, fs.constants.X_OK));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (!buildSucceeded) {
        fs.writeFileSync(sshModulePath, originalSource);
      }
    }
  });
});
