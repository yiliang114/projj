'use strict';

const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const GENERATED_OR_INTENTIONAL_JS = new Set([
  '.autod.conf.js',
  'bin/projj.js',
  'test/fixtures/hook-add/.projj/hooks/hook.js',
  'test/fixtures/importdir/file.js',
  'test/fixtures/mock_darwin.js',
  'test/fixtures/mock_not_darwin.js',
]);
const GENERATED_OR_INTENTIONAL_JS_PREFIXES = [
  'lib/',
];

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

function listRepositoryJavaScriptFiles(repoRoot) {
  const files = [];
  const ignoredDirectories = new Set([ '.git', '.worktrees', 'coverage', 'node_modules' ]);

  walk(repoRoot);
  return files.sort();

  function walk(currentDir) {
    fs.readdirSync(currentDir, { withFileTypes: true }).forEach(entry => {
      if (ignoredDirectories.has(entry.name)) return;

      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = path.relative(repoRoot, absolutePath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        walk(absolutePath);
        return;
      }

      if (relativePath.endsWith('.js')) {
        files.push(relativePath);
      }
    });
  }
}

describe('test/maintenance_contract.test.js', () => {
  it('should align node support metadata and publish verification with the active CI contract', () => {
    const repoRoot = path.join(__dirname, '..');
    const pkg = require(path.join(repoRoot, 'package.json'));
    const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    const nodeWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/nodejs.yml'), 'utf8');
    const publishWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/publish.yml'), 'utf8');

    assert.strictEqual(pkg.engines.node, '>=20.0.0');
    assert.strictEqual(pkg.ci.version, '20, 22');
    assert(readme.includes('Requires Node.js 20 or newer.'));
    assert(nodeWorkflow.includes('node-version: [20, 22]'));
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

  it('should keep repository-authored source code in TypeScript instead of tracked JavaScript', () => {
    const repoRoot = path.join(__dirname, '..');
    const remainingTrackedJs = listRepositoryJavaScriptFiles(repoRoot)
      .filter(file => !GENERATED_OR_INTENTIONAL_JS.has(file))
      .filter(file => !GENERATED_OR_INTENTIONAL_JS_PREFIXES.some(prefix => file.startsWith(prefix)));

    assert.deepStrictEqual(remainingTrackedJs, []);
  });
});
