import Record from './record';

function throwCommited(id: number, functionName: string) {
  throw new Error(`Transaction#${id}: attempted '${functionName}', but has already been committed`);
}

export default class Transaction {
  private _store: any;
  public _local = Object.create(null);
  private _id: number;
  private _commited = false;

  constructor({ map, id }: { map: any, id: any}) {
    this._store = map;
    this._id = id; // xmax this transaction can see
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

  has(key: string) {
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

  get(key: string) {
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

  set(key: string, value: any) {
    if (this.isCommited) { throwCommited(this._id, 'set'); }
    this._local[key] = new Record(value);
  }

  delete(key: string) {
    if (this.isCommited) { throwCommited(this._id, 'delete'); }
    this._local[key] = Record.DELETED;
  }

  commit() {
    if (this.isCommited) { throwCommited(this._id, 'commit'); }
    this._commited = true;
    this._store.commit(this);
  }
};
