import Record from './record';

function throwCommited(id, functionName) {
  throw new Error(`Transaction#${id}: attempted '${functionName}', but has already been committed`);
}

export default class Transaction {
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
};
