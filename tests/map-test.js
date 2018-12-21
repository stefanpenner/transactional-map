'use strict';

const expect = require('chai').expect;

describe('Map', function() {//{
  const Map = require('../');
  const Transaction = require('../lib/transaction');

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

    const t4 = map.transaction();

    expect(t4.has('bar')).to.eql(true);
  });
});//}

