import Value from '../lib/value';
import Record from '../lib/record';

describe('Value', function() {
  it('works', function() {
    const value = new Value();

    expect(value.has(0)).toBe(false);
    expect(value.get(0)).toBe(undefined);

    const one   = new Record(); one.commit(1);
    const two   = new Record(); two.commit(2);
    const three = new Record(); three.commit(3);

    value.add(one);

    expect(value.has(0)).toBe(false);
    expect(value.get(0)).toBe(undefined);
    expect(value.has(1)).toBe(true);
    expect(value.get(1)).toBe(one);
    expect(value.has(2)).toBe(true);
    expect(value.get(2)).toBe(one);

    value.add(two);
    value.add(three);

    expect(value.has(0)).toBe(false);
    expect(value.get(0)).toBe(undefined);
    expect(value.has(1)).toBe(true);
    expect(value.get(1)).toBe(one);
    expect(value.has(2)).toBe(true);
    expect(value.get(2)).toBe(two);
    expect(value.has(3)).toBe(true);
    expect(value.get(3)).toBe(three);
  });

  it('supports out of order insert of values', function() {
    const value = new Value();

    const one   = new Record(); one.commit(1);
    const two   = new Record(); two.commit(2);
    const three = new Record(); three.commit(3);

    value.add(one);
    value.add(three);
    value.add(two);

    expect(value.get(1)).toBe(one);
    expect(value.get(2)).toBe(two);
    expect(value.get(3)).toBe(three);
    expect(value.get(4)).toBe(three);
  });

  it('deletes (internal implementation is a bit complicated for perf, so lets test the obvious edge cases)', function() {
    const value = new Value();
    const a = new Record(); a.commit(1);
    const b = new Record(); b.commit(2);
    const c = new Record(); c.commit(3);
    expect(value.delete(1)).toBe(undefined);

    value.add(a);

    expect(value.get(1)).toBe(a);
    expect(value.has(1)).toBe(true);

    expect(value.delete(1)).toBe(undefined);

    expect(value.has(1)).toBe(false);
    expect(value.get(1)).toBe(undefined);

    value.add(b);
    value.add(c);

    expect(value.has(1)).toBe(false);
    expect(value.get(1)).toBe(undefined);

    expect(value.has(2)).toBe(true);
    expect(value.get(2)).toBe(b);

    expect(value.has(3)).toBe(true);
    expect(value.get(3)).toBe(c);

    expect(value.delete(2)).toBe(undefined);

    expect(value.has(2)).toBe(false);
    expect(value.get(2)).toBe(undefined);

    expect(value.has(3)).toBe(true);
    expect(value.get(3)).toBe(c);

    expect(value.delete(3)).toBe(undefined);

    expect(value.has(2)).toBe(false);
    expect(value.get(2)).toBe(undefined);

    expect(value.has(3)).toBe(false);
    expect(value.get(3)).toBe(undefined);
  });
});

