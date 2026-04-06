#!/usr/bin/env node

import childProcess = require('child_process');

const args = [
  '-o', 'StrictHostKeyChecking=no',
].concat(process.argv.slice(2));

childProcess.spawn('ssh', args, {
  stdio: 'inherit',
});
