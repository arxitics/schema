import Decimal from '../src/decimal';

let assert = require('assert');

describe('Decimal', () => {
  describe('parse()', () => {
    it('should return an object representing the decimal number', () => {
      assert.deepEqual(Decimal.parse(-1.23456e2), {
        type: 'real',
        sign: -1,
        precision: 6,
        accuracy: 3,
        sequence: [123, 45600000]
      });
    });
  });

  describe('sub()', () => {
    it('should return zero for two equal numbers', () => {
      let x = new Decimal('123456789');
      let y = new Decimal(123456789.00);
      assert.equal(x.sub(y), Decimal.ZERO);
    });
  });

});
