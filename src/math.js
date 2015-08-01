
import Decimal from 'decimal';

var math = {};

Object.assign(math, {
  floor(n) {
    let num = new Decimal(n);
    if (num.isInteger()) {
      return num.clone();
    }
    if (num.isNegative()) {
      return math.ceil(num.neg()).neg();
    }
    return num.clone().toAccuracy(0).set('type', 'integer');
  },

  ceil(n) {
    let num = new Decimal(n);
    if (num.isInteger()) {
      return num.clone();
    }
    if (num.isNegative()) {
      return math.floor(num.neg()).neg();
    }
    let integer = num.clone().toAccuracy(0).set('type', 'integer');
    if (math.floor(num).eq(num)) {
      return integer;
    }
    return integer.add(Decimal.ONE);
  },

  sqrt(n, digits = 16) {
    let num = new Decimal(n);
    const one = Decimal.ONE;
    if (num.isNegative()) {
      return Number.NaN;
    }

    let exponent = num.exponent;
    if (num.lt(one) || num.gt(Decimal.exp(2))) {
      exponent += exponent % 2;
      return math.sqrt(num.div(Decimal.exp(exponent))).mul(Decimal.exp(exponent / 2));
    }

    const accuracy = digits + 2;
    const half = new Decimal(0.5);
    const epsilon = Decimal.exp(-digits);
    let root = new Decimal(num.lt(Decimal.exp(1)) ? 2 : 6);
    let error = root.mul(root, accuracy).sub(num);
    while (epsilon.lt(error.abs())) {
      root = root.add(num.div(root, accuracy)).mul(half);
      error = root.mul(root, accuracy).sub(num);
    }
    return root.toAccuracy(digits);
  },

  pow(b, n) {
    const base = new Decimal(b);
    const num = new Decimal(n);
    const one = Decimal.ONE;
    if (base.eq(one) || num.isZero()) {
      return one;
    }
    if (num.isNegative()) {
      return math.pow(base, num.neg()).inv();
    }
    if (num.isInteger()) {
      const two = new Decimal(2);
      if (num.eq(one)) {
        return base;
      }
      if (num.eq(two)) {
        return base.mul(base);
      }
      if (num.isOdd()) {
        return math.pow(base, num.sub(one)).mul(base);
      }
      return math.pow(math.pow(base, num.div(two).toInteger()), two);
    }
    if (num.gt(one)) {
      let integer = math.floor(num);
      return math.pow(base, integer).mul(math.pow(base, num.sub(integer)));
    }
  },

  sum(...values) {
    let result = Decimal.ZERO;
    for (let value of values) {
      result = result.add(new Decimal(value));
    }
    return result;
  },

  product(...values) {
    let result = Decimal.ONE;
    for (let value of values) {
      result = result.mul(new Decimal(value));
    }
    return result;
  }
});

export default math;
