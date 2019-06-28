import Record from '../lib/record';

describe('Record', function() {
  it('#commit', function() {
    let record = new Record();

    expect(record.isCommited).toBe(false);
    expect(record.commit(1)).toBe(undefined);
    expect(record.isCommited).toBe(true);
    expect(() => record.commit(1)).toThrow(/Record is already commited, cannot recommit./);
    expect(record.isCommited).toBe(true);
  });

  it('#deleted', function() {
    expect(Record.DELETED).toBe(Record.DELETED);
  })
});
