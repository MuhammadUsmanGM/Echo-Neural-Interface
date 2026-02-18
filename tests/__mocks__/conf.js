// Mock conf module to avoid ESM issues
module.exports = class Conf {
  constructor(options = {}) {
    this.store = options.defaults || {};
    this.projectName = options.projectName || 'test';
  }

  get(key) {
    return this.store[key];
  }

  set(key, value) {
    this.store[key] = value;
  }

  has(key) {
    return key in this.store;
  }

  delete(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
};
