'use strict';

const InternalStore = require('./lib/internal-store');

module.exports = class Map {
  constructor() {
    this._internal = new InternalStore();
  }

  transaction() {
    return this._internal.transaction();
  }
};
