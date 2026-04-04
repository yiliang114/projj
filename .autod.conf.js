'use strict';

module.exports = {
  write: true,
  prefix: '^',
  test: [
    'test',
  ],
  dep: [
  ],
  devdep: [
    '@types/node',
    'egg-ci',
    'egg-bin',
    'autod',
    'eslint',
    'eslint-config-egg',
    'ts-node',
    'typescript',
  ],
  exclude: [
    './bin/projj.js',
    './lib',
    './test/fixtures',
    './dist',
  ],
  semver: [
    "zlogger@1",
  ],
  registry: 'https://r.cnpmjs.org',
};
