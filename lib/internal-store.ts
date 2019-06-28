import Transaction from './transaction';
import Record from './record';
import Value from './value';

export default  class InternalStore {
  private _local = Object.create(null);
  private _xnext = 1;

  transaction() {
    return new Transaction({
      map: this,
      id: this._xnext++
    });
  }

  has(xid: number, key: string) {
    const value = this._local[key];

    if (value === undefined)  {
      return false;
    }

    return value.has(xid);
  }

  get(xid: number, key: string) {
    const value = this._local[key];

    if (value === undefined)  {
      return undefined;
    }

    return value.get(xid);
  }

  commit(transaction: Transaction) {
    const local = transaction._local;
    for (let key in local) {
      const record = local[key];
      let value = this._local[key];

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
