import Decimal from '../src/decimal';
import math from '../src/math';

let assert = require('assert');

describe('math', () => {
  describe('sqrt()', () => {
    it('should return an aproximation to the square root', () => {
      let s = new Decimal('0.1234567');
      let r = new Decimal('0.3513640562152025');
      console.log(math.sqrt(s, 200).toString());
      assert.equal(math.sqrt(s).sub(r).abs().lt(Decimal.exp(-15)), true);
    });
  });

  describe('cbrt()', () => {
    it('should return an aproximation to the cube root', () => {
      let s = new Decimal('1234.567');
      let r = new Decimal('10.7276572185535815');
      console.log(math.cbrt(s, 200).toString());
      assert.equal(math.cbrt(s).sub(r).abs().lt(Decimal.exp(-15)), true);
    });
  });

  describe('pow()', () => {
    it('should return exact value for integer power by default', () => {
      let b = new Decimal(1.23);
      let n = new Decimal(20);
      let v = new Decimal('62.8206215175202159781085149496179361969201');
      assert.deepEqual(math.pow(b, n), v);
    });

    it('should return an approximation to the exponentiation', () => {
      let b = new Decimal(1.23);
      let n = new Decimal(20.8);
      let v = new Decimal('74.1355165540178986');
      assert.equal(math.pow(b, n).sub(v).abs().lt(Decimal.exp(-15)), true);
    });
  });
});
