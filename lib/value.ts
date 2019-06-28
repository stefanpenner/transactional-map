import Record from './record';

export default class Value {
  private _record?: Record;
  private _records?: Record[];
  private _isSorted = false;
  constructor() {
    // n = 1, vs n > 1 perf tweak (avoid array allocation, if we only typically end up with n = 1)
    this._record = undefined;
    this._records = undefined;
    this._isSorted = false;
  }

  add(record: Record) {
    if (this._records === undefined) {
      if (this._record === undefined) {
        this._record = record;
      } else {
        this._records = [this._record, record];
        this._isSorted = false;
        this._record = undefined;
      }
    } else {
      this._records.push(record);
      this._isSorted = false;
    }
  }

  has(xid: number) {
    return !!this.get(xid);
  }

  // we wont need to sort, if we don't ever allow out of order. But I suspect
  // we will want to support a "force commit" mode or something... Often folks
  // don't want to care, sometimes they do? We could also consider just "silently" ignoring old commits...
  // Ultimately we should likely support many options, but the question is "what should be default".
  _ensureSorted() {
    if (this._isSorted === true) { return; }
    if (this._records === undefined) {
      throw new TypeError('EWUT');
    }
    this._records.sort((a, b) => b.xmin - a.xmin);
    this._isSorted = true;
  }

  delete(xid: number) {
    if (this._record === undefined && this._records === undefined) {
      return undefined;
    }

    const internal = this._record;

    if (internal !== undefined) {
      internal.delete(xid);
    } else {
      let records = this._records;
      if (records === undefined) {
        throw new TypeError('unexpected undefined');
      }
      for (let i = 0; i < records.length; i++) {
        records[i].delete(xid);
      }
    }
  }

  _find(xid: number) {
    let records = this._records;
    let internal = this._record;

    if (internal === undefined && records === undefined) { return; }

    if (internal !== undefined) {
      return internal.isVisible(xid) ? internal : undefined;
    } else if (records !== undefined) {
      this._ensureSorted();
      for (let i = 0; i < records.length; i++) {
        let record = records[i];
        if (record.isVisible(xid)) {
          return record;
        }
      }
    } else {
      throw new TypeError('EWUT')
    }
  }

  get(xid: number) {
    return this._find(xid);
  }
};
