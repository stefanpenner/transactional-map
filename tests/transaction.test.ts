import Map from '../';

describe('transaction', function() {
  it('is', function() {
    const map = new Map();
    const t1 = map.transaction();

    expect(typeof t1.has).toBe('function');
    expect(typeof t1.get).toBe('function');
    expect(typeof t1.set).toBe('function');
    expect(typeof t1.delete).toBe('function');
    expect(typeof t1.commit).toBe('function');
  });

  it('errors when interacted with post commit', function() {
    const map = new Map();
    const t0 = map.transaction();

    t0.commit();

    expect(() => t0.set('foo', 'value')).toThrow(/Transaction#1: attempted 'set', but has already been committed/);
    expect(() => t0.has('foo')).toThrow(/Transaction#1: attempted 'has', but has already been committed/);
    expect(() => t0.get('foo')).toThrow(/Transaction#1: attempted 'get', but has already been committed/);
    expect(() => t0.delete('foo')).toThrow(/Transaction#1: attempted 'delete', but has already been committed/);
    expect(() => t0.commit()).toThrow(/Transaction#1: attempted 'commit', but has already been committed/);
  });

  it('has valid get/set/has/delete visibility', function() {
    const map = new Map();

    const t1 = map.transaction();

    t1.set('foo', 't1-value');
    expect(t1.has('foo')).toBe(true);

    t1.commit();

    const t2 = map.transaction();
    const t3 = map.transaction();

    expect(t2.has('foo')).toBe(true);
    expect(t3.has('foo')).toBe(true);

    expect(t2.get('foo')).toBe('t1-value');
    expect(t3.get('foo')).toBe('t1-value');

    t2.set('foo', 't2-value');

    expect(t2.get('foo')).toBe('t2-value');
    expect(t3.get('foo')).toBe('t1-value');

    t2.commit();

    const t4 = map.transaction();

    expect(t3.get('foo')).toBe('t1-value');
    expect(t4.get('foo')).toBe('t2-value');

    t4.delete('foo');

    const t5 = map.transaction();

    expect(t3.get('foo')).toBe('t1-value');
    expect(t3.has('foo')).toBe(true);
    expect(t4.get('foo')).toBe(undefined);

    expect(t4.has('foo')).toBe(false);
    expect(t5.get('foo')).toBe('t2-value');
    expect(t5.has('foo')).toBe(true);

    t4.commit();

    const t6 = map.transaction();

    expect(t3.get('foo')).toBe('t1-value');
    expect(t3.has('foo')).toBe(true);
    expect(t5.get('foo')).toBe('t2-value');
    expect(t5.has('foo')).toBe(true);
    expect(t6.get('foo')).toBe(undefined);
    expect(t6.has('foo')).toBe(false);
  });

  it('out of order delete scenario', function() {
    const map = new Map();
    const t0 = map.transaction();

    t0.set('foo', 't0-value');
    t0.commit();

    const t1 = map.transaction();
    const t2 = map.transaction();

    expect(t1.has('foo')).toBe(true);
    expect(t2.has('foo')).toBe(true);

    t2.delete('foo');

    expect(t1.has('foo')).toBe(true);
    expect(t2.has('foo')).toBe(false);

    t2.commit();

    expect(t1.has('foo')).toBe(true);
  });
});
