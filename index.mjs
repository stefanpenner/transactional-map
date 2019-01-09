import InternalStore from './lib/internal-store';

export default class Map {
  constructor() {
    this._internal = new InternalStore();
  }

  transaction() {
    return this._internal.transaction();
  }
};
