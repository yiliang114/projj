import assert = require('assert');
import fs = require('mz/fs');

const readJSON = require('utility').readJSON as (path: string) => Promise<Record<string, any>>;

type CacheEntry = {
  repo?: string;
};

type CacheStore = {
  version?: string;
  [key: string]: CacheEntry | string | undefined;
};

class Cache {
  cachePath: string;
  cache?: CacheStore;

  constructor(options: { cachePath: string }) {
    assert(options && options.cachePath, 'cachePath is required');
    this.cachePath = options.cachePath;
  }

  async get(key?: string) {
    if (!this.cache) {
      if (await fs.exists(this.cachePath)) {
        this.cache = await readJSON(this.cachePath);
        await this.setRepo(this.cache);
      } else {
        this.cache = {};
        await this.dump();
      }
    }
    return key ? this.cache[key] : this.cache;
  }

  async getKeys() {
    const cache = await this.get() as CacheStore;
    return Object.keys(cache).filter(key => key !== 'version');
  }

  async set(key?: string, value?: CacheEntry) {
    if (!key) return;
    if (!this.cache) await this.get();

    this.cache![key] = value || {};
  }

  async remove(keys?: string | string[]) {
    if (!keys) return;
    if (!Array.isArray(keys)) keys = [ keys ];
    keys.forEach(key => delete this.cache![key]);
  }

  async dump() {
    if (!this.cache) return;
    await fs.writeFile(this.cachePath, JSON.stringify(this.cache, null, 2));
  }

  async setRepo(cache: CacheStore) {
    const keys = await this.getKeys();
    for (const key of keys) {
      const entry = cache[key] as CacheEntry | undefined;
      if (entry && entry.repo) continue;
      const option = cache[key] = {};
      const s = key.split('/');
      (option as CacheEntry).repo = `git@${s[0]}:${s[1]}/${s[2]}.git`;
    }
    await this.dump();
  }

  async upgrade() {
    const cache = await this.get() as CacheStore;
    switch (cache.version) {
      case 'v1':
        return;
      default:
    }

    cache.version = 'v1';

    await this.dump();
  }
}

export = Cache;
