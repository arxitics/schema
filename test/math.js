import Decimal from '../src/decimal';
import math from '../src/math';

let assert = require('assert');

describe('math', () => {
  describe('sqrt()', () => {
    it('should return an aproximation to the square root', () => {
      let s = new Decimal('1234.567');
      let r = new Decimal('35.1364056215202525');
      assert.equal(math.sqrt(s).sub(r).abs().lt(Decimal.exp(-15)), true);
    });
  });

  describe('cbrt()', () => {
    it('should return an aproximation to the cube root', () => {
      let s = new Decimal('1234.567');
      let r = new Decimal('10.7276572185535815');
      assert.equal(math.cbrt(s).sub(r).abs().lt(Decimal.exp(-15)), true);
    });
  });
});
