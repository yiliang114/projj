'use strict';

const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('test/cache.test.js', () => {
  it('should build and emit a working cache runtime', async () => {
    const repoRoot = path.join(__dirname, '..');
    const cacheModulePath = path.join(repoRoot, 'lib/cache.js');
    const originalSource = fs.readFileSync(cacheModulePath, 'utf8');
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const eslintCommand = path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'eslint.cmd' : 'eslint');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projj-cache-test-'));
    const cachePath = path.join(tmpDir, 'cache.json');

    let buildSucceeded = false;

    try {
      fs.rmSync(cacheModulePath, { force: true });

      cp.execFileSync(npmCommand, [ 'run', 'build' ], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      cp.execFileSync(eslintCommand, [ 'lib/cache.js' ], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      buildSucceeded = true;

      delete require.cache[require.resolve('../lib/cache')];
      const Cache = require('../lib/cache');
      const cache = new Cache({ cachePath });

      assert.deepStrictEqual(await cache.get(), {});
      await cache.set('github.com/example/repo', {});
      await cache.dump();

      const written = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      assert.deepStrictEqual(written['github.com/example/repo'], {});

      const reloadedCache = new Cache({ cachePath });
      const reloadedEntry = await reloadedCache.get('github.com/example/repo');
      assert.strictEqual(reloadedEntry.repo, 'git@github.com:example/repo.git');

      await cache.remove('github.com/example/repo');
      await cache.dump();

      assert.deepStrictEqual(JSON.parse(fs.readFileSync(cachePath, 'utf8')), {});
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (!buildSucceeded) {
        fs.writeFileSync(cacheModulePath, originalSource);
      }
    }
  });
});
