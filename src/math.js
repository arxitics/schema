
import Decimal from './decimal';

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

  // use Newton's method to approximate the square root
  sqrt(n, digits = 16) {
    let num = new Decimal(n);
    const one = Decimal.ONE;
    if (num.isNegative()) {
      return Number.NaN;
    }

    let exponent = num.exponent;
    if (num.lt(one) || num.gt(Decimal.exp(2))) {
      let accuracy = digits + Math.abs(exponent);
      exponent -= (2 + exponent % 2) % 2;
      return math.sqrt(num.div(Decimal.exp(exponent)), accuracy)
        .mul(Decimal.exp(exponent / 2)).toAccuracy(digits);
    }

    const accuracy = digits + 2;
    const half = new Decimal(0.5);
    const epsilon = Decimal.exp(-digits);
    let root = new Decimal(Math.sqrt(num.sequence[0]));
    let square = root.mul(root, accuracy);
    let error = square.sub(num);
    while (epsilon.lt(error.abs())) {
      root = root.add(num.div(root, accuracy)).mul(half, accuracy);
      square = root.mul(root, accuracy);
      error = square.sub(num);
    }
    return root.toAccuracy(digits);
  },

  // Halley’s method to approximate the cube root
  cbrt(n, digits = 16) {
    let num = new Decimal(n);
    const one = Decimal.ONE;
    if (num.isNegative()) {
      return math.cbrt(this.neg(), digits).neg();
    }

    let exponent = num.exponent;
    if (num.lt(one) || num.gt(Decimal.exp(3))) {
      let accuracy = digits + Math.abs(exponent);
      exponent -= (3 + exponent % 3) % 3;
      return math.cbrt(num.div(Decimal.exp(exponent)), accuracy)
        .mul(Decimal.exp(exponent / 3)).toAccuracy(digits);
    }

    const accuracy = digits + 3;
    const two = new Decimal(2);
    const epsilon = Decimal.exp(-digits);
    let root = new Decimal(Math.cbrt(num.sequence[0]));
    let cube = root.mul(root, accuracy).mul(root, accuracy);
    let error = cube.sub(num);
    while (epsilon.lt(error.abs())) {
      root = root.mul(cube.add(num.mul(two)).div(cube.mul(two).add(num), accuracy));
      cube = root.mul(root, accuracy).mul(root, accuracy);
      error = cube.sub(num);
    }
    return root.toAccuracy(digits);
  },

  pow(b, n, digits = 16) {
    const base = new Decimal(b);
    const num = new Decimal(n);
    const one = Decimal.ONE;
    if (base.eq(one) || num.isZero()) {
      return one;
    }
    if (num.isNegative()) {
      return math.pow(base, num.neg(), digits).inv();
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
    if (num.gte(one)) {
      let i = math.floor(num);
      let a = math.pow(base, i).toAccuracy(digits);
      let b = math.pow(base, num.sub(i), digits + a.exponent + 2);
      return a.mul(b).toAccuracy(digits);
    }

    const accuracy = digits + base.exponent + 2;
    const half = new Decimal(0.5);
    const epsilon = Decimal.exp(-accuracy);
    let root = base;
    let power = num;
    let exponent = one;
    let product = one;
    while (epsilon.lt(root.sub(one).abs())) {
      exponent = exponent.mul(half);
      root = math.sqrt(root, accuracy);
      if (exponent.lte(power)) {
        product = product.mul(root, accuracy);
        power = power.sub(exponent);
      }
    }
    return product.toAccuracy(digits);
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
