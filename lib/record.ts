function throwRecordAlreadyCommited() {
  throw new Error('Record is already commited, cannot recommit.')
}

export default class Record {
  private static __DELETED: any;

  private _value: any;
  private _xmin = 0;
  private _xmax = Infinity;
  constructor(value?: any) {
    this._value = value;
  }

  static get DELETED() {
    if (this.__DELETED) {
      return this.__DELETED;
    }
    let record = new Record();
    Object.freeze(record);
    this.__DELETED = record;
    return record;
  }

  commit(xid: number) {
    if (this.isCommited) { throwRecordAlreadyCommited(); }
    this._xmin = xid;
  }

  isVisible(xid: number) {
    return this.xmin <= xid && xid < this.xmax;
  }

  delete(xid: number) {
    if (this.isVisible(xid)) { this._xmax = xid; }
  }

  static isDeletedSentinal(record: any) {
    return this.__DELETED === record;
  }

  get xmin() {
    return this._xmin;
  }

  get xmax() {
    return this._xmax;
  }

  get value() {
    return this._value;
  }

  get isCommited() {
    return this.xmin > 0;
  }
};
