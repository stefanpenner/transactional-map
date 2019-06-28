import Map from '../';
import Transaction from '../lib/transaction';

describe('Map', function() {//{

  it('is', function() {
    const map = new Map();
    expect(map.transaction()).toBeInstanceOf(Transaction);
  });

  it('smoke', function() {
    const map = new Map();
    const t1 = map.transaction();
    const t2 = map.transaction();

    // get missing
    expect(t1.has('foo')).toBe(false);
    expect(t1.get('foo')).toBe(undefined);

    expect(t2.has('foo')).toBe(false);
    expect(t2.get('foo')).toBe(undefined);

    // first set
    expect(t1.set('foo', 1)).toBe(undefined);
    expect(t1.has('foo')).toBe(true);
    expect(t1.get('foo')).toBe(1);

    expect(t2.has('foo')).toBe(false);
    expect(t2.get('foo')).toBe(undefined);

    expect(t2.set('foo', 3)).toBe(undefined);
    expect(t2.has('foo')).toBe(true);
    expect(t2.get('foo')).toBe(3);
    expect(t1.get('foo')).toBe(1);

    // second set
    expect(t1.set('foo', 4)).toBe(undefined);
    expect(t1.has('foo')).toBe(true);
    expect(t1.get('foo')).toBe(4);

    expect(t2.set('foo', 6)).toBe(undefined);
    expect(t2.has('foo')).toBe(true);
    expect(t2.get('foo')).toBe(6);
    expect(t1.get('foo')).toBe(4);

    // first delete
    expect(t1.delete('foo')).toBe(undefined);
    expect(t1.has('foo')).toBe(false);
    expect(t1.get('foo')).toBe(undefined);

    expect(t2.get('foo')).toBe(6);

    expect(t2.delete('foo')).toBe(undefined);
    expect(t2.has('foo')).toBe(false);
    expect(t2.get('foo')).toBe(undefined);

    // set after delete
    expect(t1.set('foo', 1)).toBe(undefined);
    expect(t1.has('foo')).toBe(true);
    expect(t1.get('foo')).toBe(1);

    expect(t2.has('foo')).toBe(false);
    expect(t2.get('foo')).toBe(undefined);

    expect(t2.set('foo', 6)).toBe(undefined);
    expect(t2.has('foo')).toBe(true);
    expect(t2.get('foo')).toBe(6);

    // Commit t1
    t1.commit();

    const t3 = map.transaction();

    expect(t3.has('foo')).toBe(true);
    expect(t3.get('foo')).toBe(1);

    expect(t2.has('foo')).toBe(true);
    expect(t2.get('foo')).toBe(6);

    t3.set('bar', 1);

    expect(t2.has('bar')).toBe(false);

    t3.commit();

    expect(t2.has('bar')).toBe(false);

    const t4 = map.transaction();

    expect(t4.has('bar')).toBe(true);
  });
});//}

