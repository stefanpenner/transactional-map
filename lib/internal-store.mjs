import Transaction from './transaction';
import Record from './record';
import Value from './value';

export default  class InternalStore {
  constructor() {
    this._local = Object.create(null);
    this._xnext = 1;
  }

  transaction() {
    return new Transaction({
      map: this,
      id: this._xnext++
    });
  }

  has(xid, key) {
    let value = this._local[key];

    if (value === undefined)  {
      return false;
    }

    return value.has(xid);
  }

  get(xid, key) {
    let value = this._local[key];

    if (value === undefined)  {
      return undefined;
    }

    return value.get(xid);
  }

  commit(transaction) {
    const local = transaction._local;
    for (let key in local) {
      let value = this._local[key];
      let record = local[key];

      if (record === Record.DELETED) {
        if (value !== undefined) {
          value.delete(this._xnext);
        }
        return;
      }

      // TODO: stage mutations to `this._local` and only apply if all the proposed mutations are not violating isolation guarentees
      if (value === undefined) {
        value = this._local[key] = new Value();
      }
      // TODO: consider value.add(this._xnext/* xmin */, record); and no record.commit
      // TODO: here we know can view a conflict, and raise appropriately
      value.add(record);
      record.commit(this._xnext);
    }
  }
};
