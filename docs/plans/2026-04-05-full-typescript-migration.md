# Full TypeScript Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish migrating repository-authored runtime code, CLI entrypoints, and tests from JavaScript to TypeScript while keeping published JavaScript artifacts working.

**Architecture:** Keep `src/**/*.ts` as the runtime source of truth and continue emitting CommonJS runtime files into `lib/`. Add a dedicated TypeScript source for the CLI entrypoint and run tests directly from `.ts` files through `egg-bin --ts`, so authored test code no longer lives in JavaScript. Preserve `lib/**/*.js`, `bin/projj.js`, and fixture scripts as generated or intentional compatibility artifacts instead of authored source.

**Tech Stack:** TypeScript, `tsc`, `egg-bin`, `ts-node`, Mocha-style tests via Egg.

### Task 1: Lock the migration target with a failing contract

**Files:**
- Modify: `test/maintenance_contract.test.js`

**Step 1: Write the failing test**

Add a contract test that scans tracked repository files and fails when repository-authored `.js` files remain outside an allowlist for generated artifacts and intentional fixtures.

**Step 2: Run test to verify it fails**

Run: `npm run test-local -- test/maintenance_contract.test.js`
Expected: FAIL with remaining authored `.js` files such as `bin/projj.js`, `test/*.js`, and `test/test_helper.js`.

**Step 3: Refine the allowlist**

Keep only true exceptions in the allowlist:
- `lib/**/*.js`
- fixture scripts under `test/fixtures/**`
- temporary compatibility files that will remain generated after the migration

**Step 4: Re-run test**

Run: `npm run test-local -- test/maintenance_contract.test.js`
Expected: still FAIL until migration work is complete.

### Task 2: Add TypeScript execution paths for tests and CLI entrypoint

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `tsconfig.test.json`
- Create: `bin/projj.ts`

**Step 1: Write the failing test**

Use the migration contract from Task 1 and, if needed, a focused build or smoke test to prove that TypeScript-authored CLI sources are not yet wired into the build.

**Step 2: Run the failing command**

Run: `npm run build`
Expected: either the new entrypoint source is not emitted yet or tests still reference JavaScript-authored files.

**Step 3: Write minimal implementation**

- Split build and test compiler config:
  - build config for `src/**/*.ts` to `lib/`
  - test config broad enough for `test/**/*.ts` and `bin/**/*.ts`
- Update `test-local` to run `egg-bin test --ts --tscompiler ts-node/register/transpile-only`
- Add a TypeScript-authored CLI source that emits `bin/projj.js`
- Adjust `clean`, `build`, and related scripts so generated artifacts are recreated deterministically

**Step 4: Re-run focused checks**

Run:
- `npm run typecheck`
- `npm run build`

Expected: PASS after TypeScript configs and build scripts are aligned.

### Task 3: Migrate authored test utilities and test suites to TypeScript

**Files:**
- Modify or replace: `test/test_helper.js`
- Modify or replace: `test/smoke_add.js`
- Modify or replace: `test/base_command.test.js`
- Modify or replace: `test/build_contract.test.js`
- Modify or replace: `test/cache.test.js`
- Modify or replace: `test/maintenance_contract.test.js`
- Modify or replace: `test/package_smoke.test.js`
- Modify or replace: `test/projj.test.js`
- Modify or replace: `test/projj_add.test.js`
- Modify or replace: `test/projj_find.test.js`
- Modify or replace: `test/projj_import.test.js`
- Modify or replace: `test/projj_init.test.js`
- Modify or replace: `test/projj_remove.test.js`
- Modify or replace: `test/projj_run.test.js`
- Modify or replace: `test/projj_runall.test.js`
- Modify or replace: `test/projj_sync.test.js`
- Modify or replace: `test/runtime_helpers.test.js`

**Step 1: Write the failing test**

Use the migration contract from Task 1 after moving one representative test file to `.ts`, then run that specific test through the new `--ts` path.

**Step 2: Run test to verify it fails if the loader or imports are wrong**

Run: `npm run test-local -- test/<representative>.test.ts`
Expected: FAIL if helper imports, module resolution, or path handling is not yet correct.

**Step 3: Write minimal implementation**

- Convert helper modules and smoke script to `.ts`
- Convert each authored test file from CommonJS JavaScript to TypeScript with minimal typing
- Keep fixtures that intentionally exercise JavaScript hooks or sample files unchanged
- Update imports and path handling to avoid relying on removed `.js` helper files

**Step 4: Re-run focused tests**

Run focused suites after each batch, then re-run the maintenance contract.

**Step 5: Commit**

Commit once the contract passes and the converted test batches are stable.

### Task 4: Verify the repository contract end-to-end

**Files:**
- Modify: `README.md` if the contributor workflow changes materially
- Modify: `docs/plans/2026-04-05-full-typescript-migration.md` if implementation decisions diverge

**Step 1: Run verification in fixed order**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run test-local -- test/maintenance_contract.test.ts`
- `npm run test-local -- test/base_command.test.ts test/cache.test.ts test/runtime_helpers.test.ts`
- `npm run test-local -- test/projj.test.ts test/projj_add.test.ts test/projj_find.test.ts test/projj_import.test.ts test/projj_init.test.ts test/projj_remove.test.ts test/projj_run.test.ts test/projj_runall.test.ts test/projj_sync.test.ts`
- `npm run build`
- `npm run smoke:add`

**Step 2: Report hard failures explicitly**

If `smoke:add` is blocked by outbound network conditions, record it as an environmental validation gap rather than silently treating it as green.

**Step 3: Confirm migration completeness**

Re-run the maintenance contract and confirm no repository-authored JavaScript files remain outside the explicit allowlist.
