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

  describe('eq()', () => {
    it('should be equal if two numbers only differ in trailing zeros after the decimal point', () => {
      assert.equal(new Decimal('1.00').eq(Decimal.ONE), true);
    });
  });

  describe('lt()', () => {
    it('should be compared from left to right', () => {
      let x = new Decimal('5.00');
      let y = new Decimal('5.000000000001');
      assert.equal(x.lt(y), true);
    });
  });

  describe('add()', () => {
    it('should handle addtion of negative numbers', () => {
      let x = new Decimal(1.23);
      let y = new Decimal(-4.56);
      let z = new Decimal(-3.33);
      assert.deepEqual(x.add(y), z);
    });
  });

  describe('sub()', () => {
    it('should return zero for two equal numbers', () => {
      let x = new Decimal('123456789');
      let y = new Decimal('123456789.00');
      assert.equal(x.sub(y), Decimal.ZERO);
    });
  });

  describe('inv()', () => {
    it('should return an approximation to the reciprocal', () => {
      let x = new Decimal(28.6739921);
      let y = new Decimal('0.034874809078293635');
      assert.deepEqual(x.inv(), y);
      assert.deepEqual(x.mul(y).toInteger(), Decimal.ONE);
    });
  });

});
