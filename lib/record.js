'use strict';

function throwRecordAlreadyCommited() {
  throw new Error('Record is already commited, cannot recommit.')
}

module.exports = class Record {
  constructor(value) {
    this._value = value;
    this._xmin = 0;
    this._xmax = Infinity;
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

  commit(xid) {
    if (this.isCommited) { throwRecordAlreadyCommited(); }
    this._xmin = xid;
  }

  isVisible(xid) {
    return this.xmin <= xid && xid < this.xmax;
  }

  delete(xid) {
    if (this.isVisible(xid)) { this._xmax = xid; }
  }

  static isDeletedSentinal(record) {
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
