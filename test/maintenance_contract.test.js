'use strict';

const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

function isTrackedPath(repoRoot, file) {
  try {
    cp.execFileSync('git', [ 'ls-files', '--error-unmatch', '--', file ], {
      cwd: repoRoot,
      stdio: 'pipe',
    });
    return true;
  } catch (_) {
    return false;
  }
}

describe('test/maintenance_contract.test.js', () => {
  it('should align node support metadata and publish verification with the active CI contract', () => {
    const repoRoot = path.join(__dirname, '..');
    const pkg = require(path.join(repoRoot, 'package.json'));
    const nodeWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/nodejs.yml'), 'utf8');
    const publishWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/publish.yml'), 'utf8');

    assert.strictEqual(pkg.ci.version, '18, 20');
    assert(nodeWorkflow.includes('node-version: [18, 20]'));
    assert(publishWorkflow.includes('run: npm run ci'));
    assert.strictEqual(isTrackedPath(repoRoot, '.travis.yml'), false);
    assert.strictEqual(isTrackedPath(repoRoot, 'appveyor.yml'), false);
  });

  it('should ignore untracked legacy CI files in the workspace', () => {
    const repoRoot = path.join(__dirname, '..');
    const legacyCiFiles = [ '.travis.yml', 'appveyor.yml' ];

    try {
      legacyCiFiles.forEach(file => {
        fs.writeFileSync(path.join(repoRoot, file), 'temporary legacy ci file\n');
      });

      legacyCiFiles.forEach(file => {
        assert.strictEqual(isTrackedPath(repoRoot, file), false);
      });
    } finally {
      legacyCiFiles.forEach(file => {
        fs.rmSync(path.join(repoRoot, file), { force: true });
      });
    }
  });
});
