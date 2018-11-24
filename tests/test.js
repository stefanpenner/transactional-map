'use strict';

const expect = require('chai').expect;

function throwRecordAlreadyCommited() {
  throw new Error('Record is already commited, cannot recommit.')
}

class Record {
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
}

function throwCommited(id, functionName) {
  throw new Error(`Transaction#${id}: attempted '${functionName}', but has already been committed`);
}

class Transaction {
  constructor({ map, id }) {
    this._store = map;
    this._local = Object.create(null);
    this._id = id; // xmax this transaction can see
    this._commited = false;
  }

  get id() {
    return this._id;
  }

  get isActive() {
    return this._commited === false;
  }

  get isCommited() {
    return this._commited === true;
  }

  has(key) {
    if (this.isCommited) { throwCommited(this._id, 'has'); }

    let record = this._local[key];
    if (record === undefined) {
      return this._store.has(this._id, key);
    } else
      if (Record.isDeletedSentinal(record)) {
      return false;
    } else {
      return true;
    }
  }

  get(key) {
    if (this.isCommited) { throwCommited(this._id, 'get'); }
    let record = this._local[key];

    if (record === undefined) {
      record = this._store.get(this._id, key);
    }

    if (record === undefined || Record.isDeletedSentinal(record)) {
      return undefined;
    } else {
      return record.value;
    }
  }

  set(key, value) {
    if (this.isCommited) { throwCommited(this._id, 'set'); }
    this._local[key] = new Record(value);
  }

  delete(key) {
    if (this.isCommited) { throwCommited(this._id, 'delete'); }
    this._local[key] = Record.DELETED;
  }

  commit() {
    if (this.isCommited) { throwCommited(this._id, 'commit'); }
    this._commited = true;
    this._store.commit(this);
  }
}

class Value {
  constructor() {
    // n = 1, vs n > 1 perf tweak (avoid array allocation, if we only typically end up with n = 1)
    this._record = undefined;
    this._records = undefined;
    this._isSorted = false;
  }

  add(record) {
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

  has(xid) {
    return !!this.get(xid);
  }

  // we wont need to sort, if we don't ever allow out of order. But I suspect
  // we will want to support a "force commit" mode or something... Often folks
  // don't want to care, sometimes they do? We could also consider just "silently" ignoring old commits...
  // Ultimately we should likely support many options, but the question is "what should be default".
  _ensureSorted() {
    if (this._isSorted === true) { return; }
    this._records.sort((a, b) => b.xmin - a.xmin);
    this._isSorted = true;
  }

  delete(xid) {
    if (this._record === undefined && this._records === undefined) {
      return undefined;
    }

    let internal = this._record;

    if (internal !== undefined) {
      internal.delete(xid);
    } else {
      let records = this._records;
      for (let i = 0; i < records.length; i++) {
        records[i].delete(xid);
      }
    }
  }

  _find(xid) {
    if (this._record === undefined && this._records === undefined) {
      return undefined;
    }

    let internal = this._record;

    if (internal !== undefined) {
      return internal.isVisible(xid) ? internal : undefined;
    } else {
      this._ensureSorted();
      let records = this._records;
      for (let i = 0; i < records.length; i++) {
        let record = records[i];
        if (record.isVisible(xid)) {
          return record;
        }
      }
    }
  }

  get(xid) {
    return this._find(xid);
  }
}

class InternalStore {
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
}

class Map {
  constructor() {
    this._internal = new InternalStore();
  }

  transaction() {
    return this._internal.transaction();
  }
}

describe('Map', function() {
  it('is', function() {
    let map = new Map();
    expect(map.transaction).to.be.a('function');
    expect(map.transaction()).to.be.instanceof(Transaction);
  });

  it('smoke', function() {
    const map = new Map();
    const t1 = map.transaction();
    const t2 = map.transaction();

    // get missing
    expect(t1.has('foo')).to.eql(false);
    expect(t1.get('foo')).to.eql(undefined);

    expect(t2.has('foo')).to.eql(false);
    expect(t2.get('foo')).to.eql(undefined);

    // first set
    expect(t1.set('foo', 1)).to.eql(undefined);
    expect(t1.has('foo')).to.eql(true);
    expect(t1.get('foo')).to.eql(1);

    expect(t2.has('foo')).to.eql(false);
    expect(t2.get('foo')).to.eql(undefined);

    expect(t2.set('foo', 3)).to.eql(undefined);
    expect(t2.has('foo')).to.eql(true);
    expect(t2.get('foo')).to.eql(3);
    expect(t1.get('foo')).to.eql(1);

    // second set
    expect(t1.set('foo', 4)).to.eql(undefined);
    expect(t1.has('foo')).to.eql(true);
    expect(t1.get('foo')).to.eql(4);

    expect(t2.set('foo', 6)).to.eql(undefined);
    expect(t2.has('foo')).to.eql(true);
    expect(t2.get('foo')).to.eql(6);
    expect(t1.get('foo')).to.eql(4);

    // first delete
    expect(t1.delete('foo')).to.eql(undefined);
    expect(t1.has('foo')).to.eql(false);
    expect(t1.get('foo')).to.eql(undefined);

    expect(t2.get('foo')).to.eql(6);

    expect(t2.delete('foo')).to.eql(undefined);
    expect(t2.has('foo')).to.eql(false);
    expect(t2.get('foo')).to.eql(undefined);

    // set after delete
    expect(t1.set('foo', 1)).to.eql(undefined);
    expect(t1.has('foo')).to.eql(true);
    expect(t1.get('foo')).to.eql(1);

    expect(t2.has('foo')).to.eql(false);
    expect(t2.get('foo')).to.eql(undefined);

    expect(t2.set('foo', 6)).to.eql(undefined);
    expect(t2.has('foo')).to.eql(true);
    expect(t2.get('foo')).to.eql(6);

    // Commit t1
    t1.commit();

    const t3 = map.transaction();

    expect(t3.has('foo')).to.eql(true);
    expect(t3.get('foo')).to.eql(1);

    expect(t2.has('foo')).to.eql(true);
    expect(t2.get('foo')).to.eql(6);

    t3.set('bar', 1);
    expect(t2.has('bar')).to.eql(false);
    t3.commit();
    expect(t2.has('bar')).to.eql(false);
  });
});

describe('transaction', function() {
  it('is', function() {
    let map = new Map();
    let t1 = map.transaction();

    expect(t1.has).to.be.a('function');
    expect(t1.get).to.be.a('function');
    expect(t1.set).to.be.a('function');
    expect(t1.delete).to.be.a('function');
    expect(t1.commit).to.be.a('function');
  });

  it('errors when interacted with post commit', function() {
    const map = new Map();
    const t0 = map.transaction();

    t0.commit();

    expect(() => t0.set('foo', 'value')).to.throw(/Transaction#1: attempted 'set', but has already been committed/);
    expect(() => t0.has('foo')).to.throw(/Transaction#1: attempted 'has', but has already been committed/);
    expect(() => t0.get('foo')).to.throw(/Transaction#1: attempted 'get', but has already been committed/);
    expect(() => t0.delete('foo')).to.throw(/Transaction#1: attempted 'delete', but has already been committed/);
    expect(() => t0.commit()).to.throw(/Transaction#1: attempted 'commit', but has already been committed/);
  });

  it('has valid get/set/has/delete visibility', function() {
    const map = new Map();

    const t1 = map.transaction();

    t1.set('foo', 't1-value');
    expect(t1.has('foo')).to.eql(true);

    t1.commit();

    const t2 = map.transaction();
    const t3 = map.transaction();

    expect(t2.has('foo')).to.eql(true);
    expect(t3.has('foo')).to.eql(true);

    expect(t2.get('foo')).to.eql('t1-value');
    expect(t3.get('foo')).to.eql('t1-value');

    t2.set('foo', 't2-value');

    expect(t2.get('foo')).to.eql('t2-value');
    expect(t3.get('foo')).to.eql('t1-value');

    t2.commit();

    const t4 = map.transaction();

    expect(t3.get('foo')).to.eql('t1-value');
    expect(t4.get('foo')).to.eql('t2-value');

    t4.delete('foo');

    const t5 = map.transaction();

    expect(t3.get('foo')).to.eql('t1-value');
    expect(t3.has('foo')).to.eql(true);
    expect(t4.get('foo')).to.eql(undefined);

    expect(t4.has('foo')).to.eql(false);
    expect(t5.get('foo')).to.eql('t2-value');
    expect(t5.has('foo')).to.eql(true);

    t4.commit();

    const t6 = map.transaction();

    expect(t3.get('foo')).to.eql('t1-value');
    expect(t3.has('foo')).to.eql(true);
    debugger;
    expect(t5.get('foo')).to.eql('t2-value');
    expect(t5.has('foo')).to.eql(true);
    expect(t6.get('foo')).to.eql(undefined);
    expect(t6.has('foo')).to.eql(false);
  });

  it('out of order delete scenario', function() {
    const map = new Map();
    const t0 = map.transaction();

    t0.set('foo', 't0-value');
    t0.commit();

    const t1 = map.transaction();
    const t2 = map.transaction();

    expect(t1.has('foo')).to.eql(true);
    expect(t2.has('foo')).to.eql(true);

    t2.delete('foo');

    expect(t1.has('foo')).to.eql(true);
    expect(t2.has('foo')).to.eql(false);

    t2.commit();

    expect(t1.has('foo')).to.eql(true);
  });
});

describe('Value', function() {
  it('works', function() {
    const value = new Value();

    expect(value.has(0)).to.eql(false);
    expect(value.get(0)).to.eql(undefined);

    const one   = new Record(); one.commit(1);
    const two   = new Record(); two.commit(2);
    const three = new Record(); three.commit(3);

    value.add(one);

    expect(value.has(0)).to.eql(false);
    expect(value.get(0)).to.eql(undefined);
    expect(value.has(1)).to.eql(true);
    expect(value.get(1)).to.eql(one);
    expect(value.has(2)).to.eql(true);
    expect(value.get(2)).to.eql(one);

    value.add(two);
    value.add(three);

    expect(value.has(0)).to.eql(false);
    expect(value.get(0)).to.eql(undefined);
    expect(value.has(1)).to.eql(true);
    expect(value.get(1)).to.eql(one);
    expect(value.has(2)).to.eql(true);
    expect(value.get(2)).to.eql(two);
    expect(value.has(3)).to.eql(true);
    expect(value.get(3)).to.eql(three);
  });

  it('supports out of order insert of values', function() {
    const value = new Value();

    const one   = new Record(); one.commit(1);
    const two   = new Record(); two.commit(2);
    const three = new Record(); three.commit(3);

    value.add(one);
    value.add(three);
    value.add(two);

    expect(value.get(1)).to.eql(one);
    expect(value.get(2)).to.eql(two);
    expect(value.get(3)).to.eql(three);
    expect(value.get(4)).to.eql(three);
  });

  it('deletes (internal implementation is a bit complicated for perf, so lets test the obvious edge cases)', function() {
    const value = new Value();
    const a = new Record(); a.commit(1);
    const b = new Record(); b.commit(2);
    const c = new Record(); c.commit(3);
    expect(value.delete(1)).to.eql(undefined);

    value.add(a);

    expect(value.get(1)).to.eql(a);
    expect(value.has(1)).to.eql(true);

    expect(value.delete(1)).to.eql(undefined);

    expect(value.has(1)).to.eql(false);
    expect(value.get(1)).to.eql(undefined);

    value.add(b);
    value.add(c);

    expect(value.has(1)).to.eql(false);
    expect(value.get(1)).to.eql(undefined);

    expect(value.has(2)).to.eql(true);
    expect(value.get(2)).to.eql(b);

    expect(value.has(3)).to.eql(true);
    expect(value.get(3)).to.eql(c);

    expect(value.delete(2)).to.eql(undefined);

    expect(value.has(2)).to.eql(false);
    expect(value.get(2)).to.eql(undefined);

    expect(value.has(3)).to.eql(true);
    expect(value.get(3)).to.eql(c);

    expect(value.delete(3)).to.eql(undefined);

    expect(value.has(2)).to.eql(false);
    expect(value.get(2)).to.eql(undefined);

    expect(value.has(3)).to.eql(false);
    expect(value.get(3)).to.eql(undefined);
  });
});

describe('Record', function() {
  it('#commit', function() {
    let record = new Record();
    expect(record.isCommited).to.eql(false);
    expect(record.commit(1)).to.eql(undefined);
    expect(record.isCommited).to.eql(true);
    expect(() => record.commit(1)).to.throw(/Record is already commited, cannot recommit./);
    expect(record.isCommited).to.eql(true);
  });

  it('#deleted', function() {
    expect(Record.DELETED).to.eql(Record.DELETED);
  })
});
