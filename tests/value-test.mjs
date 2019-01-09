import chai from 'chai';
import Value from '../lib/value';
import Record from '../lib/record';

const { expect } = chai;

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

