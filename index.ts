import InternalStore from './lib/internal-store';

export default class Map {
  private _internal = new InternalStore();

  transaction() {
    return this._internal.transaction();
  }
};
