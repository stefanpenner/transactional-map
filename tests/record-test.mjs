import chai from 'chai';
import Record from '../lib/record';

const { expect } = chai;

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
