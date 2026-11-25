import { APP_CONFIG } from '../core/config.js';

export class MemoryStorageAdapter {
  constructor(prefix = APP_CONFIG.storagePrefix) {
    this.prefix = prefix;
    this.store = new Map();
  }

  get(key) {
    const raw = this.store.get(this.prefix + key);
    return raw ? JSON.parse(raw) : null;
  }

  set(key, value) {
    this.store.set(this.prefix + key, JSON.stringify(value));
    return true;
  }

  remove(key) {
    this.store.delete(this.prefix + key);
    return true;
  }

  isPersistent() {
    return false;
  }
}

export class LocalStorageAdapter {
  constructor(prefix = APP_CONFIG.storagePrefix) {
    this.prefix = prefix;
    this.fallback = new MemoryStorageAdapter(prefix);
    this.available = this.checkAvailability();
  }

  checkAvailability() {
    try {
      const testKey = `${this.prefix}__probe__`;
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  get(key) {
    if (!this.available) return this.fallback.get(key);
    try {
      const raw = window.localStorage.getItem(this.prefix + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return this.fallback.get(key);
    }
  }

  set(key, value) {
    if (!this.available) return this.fallback.set(key, value);
    try {
      window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch {
      return this.fallback.set(key, value);
    }
  }

  remove(key) {
    if (!this.available) return this.fallback.remove(key);
    try {
      window.localStorage.removeItem(this.prefix + key);
      return true;
    } catch {
      return this.fallback.remove(key);
    }
  }

  isPersistent() {
    return this.available;
  }
}
