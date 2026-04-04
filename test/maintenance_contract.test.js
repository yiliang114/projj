'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

describe('test/maintenance_contract.test.js', () => {
  it('should align node support metadata and publish verification with the active CI contract', () => {
    const repoRoot = path.join(__dirname, '..');
    const pkg = require(path.join(repoRoot, 'package.json'));
    const nodeWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/nodejs.yml'), 'utf8');
    const publishWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/publish.yml'), 'utf8');

    assert.strictEqual(pkg.ci.version, '18, 20');
    assert(nodeWorkflow.includes('node-version: [18, 20]'));
    assert(publishWorkflow.includes('run: npm run ci'));
    assert.strictEqual(fs.existsSync(path.join(repoRoot, '.travis.yml')), false);
    assert.strictEqual(fs.existsSync(path.join(repoRoot, 'appveyor.yml')), false);
  });
});
