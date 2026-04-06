# CI Maintenance Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align maintenance metadata and publish verification with the current Node 18+ TypeScript build contract.

**Architecture:** Keep runtime behavior unchanged and treat maintenance configuration as a tested contract. Add a focused test that validates package metadata and GitHub workflow expectations, then make the smallest configuration changes needed to satisfy it.

**Tech Stack:** Node.js, Mocha via egg-bin, GitHub Actions, npm package metadata

### Task 1: Add maintenance contract coverage

**Files:**
- Create: `test/maintenance_contract.test.js`
- Modify: `package.json`

**Step 1: Write the failing test**

```js
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

describe('test/maintenance_contract.test.js', () => {
  it('should align supported node versions and publish verification', () => {
    const repoRoot = path.join(__dirname, '..');
    const pkg = require(path.join(repoRoot, 'package.json'));
    const nodeWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/nodejs.yml'), 'utf8');
    const publishWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/publish.yml'), 'utf8');

    assert.strictEqual(pkg.ci.version, '18, 20');
    assert(nodeWorkflow.includes('node-version: [18, 20]'));
    assert(publishWorkflow.includes('run: npm run ci'));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test-local -- test/maintenance_contract.test.js`
Expected: FAIL because `package.json` still reports Node `10, 12` and publish workflow does not run `npm run ci`.

**Step 3: Write minimal implementation**

Update `package.json` CI metadata, tighten `publish.yml` verification to `npm run ci`, and remove stale legacy CI files once the contract is explicit.

**Step 4: Run test to verify it passes**

Run: `npm run test-local -- test/maintenance_contract.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json .github/workflows/publish.yml test/maintenance_contract.test.js .travis.yml appveyor.yml docs/plans/2026-04-04-ci-maintenance-alignment.md
git commit -m "ci(maintenance): align release verification with node support"
```

### Task 2: Verify maintenance pipeline end-to-end

**Files:**
- Verify: `package.json`
- Verify: `.github/workflows/nodejs.yml`
- Verify: `.github/workflows/publish.yml`
- Verify: `test/maintenance_contract.test.js`

**Step 1: Run focused maintenance checks**

Run: `npm run lint`
Expected: PASS

**Step 2: Run targeted tests**

Run: `npm run test-local -- test/maintenance_contract.test.js test/build_contract.test.js`
Expected: PASS

**Step 3: Run full repository verification**

Run: `npm run ci`
Expected: PASS

**Step 4: Commit**

```bash
git add package.json .github/workflows/publish.yml test/maintenance_contract.test.js .travis.yml appveyor.yml docs/plans/2026-04-04-ci-maintenance-alignment.md
git commit -m "ci(maintenance): align release verification with node support"
```
