
import Decimal from 'decimal';
import math from 'math';

var integer = {};

Object.assign(integer, {
  rem(a, b) {
    let n = new Decimal(a);
    let d = new Decimal(b);
    if (!(n.isInteger() && d.isInteger())) {
      throw new TypeError('rem() invalid arguments');
    }
    if (n.lt(d)) {
      return n;
    }
    if (n.eq(d)) {
      return Decimal.ZERO;
    }

    const exponent = d.exponent;
    while (n.gt(d)) {
      let e = n.exponent - exponent - 1;
      let s = e > 0 ? d.mul(Decimal.exp(e)) : d;
      n = n.sub(s);
    }
    return n;
  },

  // Greatest Common Divisor (GCD)
  gcd(a, b) {
    // Euclid's algorithm
    let n = new Decimal(a);
    let d = new Decimal(b);
    if (!(n.isInteger() && d.isInteger())) {
      throw new TypeError('gcd() invalid arguments');
    }
    while (!n.isZero()) {
      let r = n.clone();
      n = integer.rem(d, r);
      d = r;
    }
    return d;
  },

  // Lowest Common Multiple (LCM)
  lcm(a, b) {
    return a.mul(b).div(integer.gcd(a, b)).toInteger();
  },

  // factorial n!
  factorial(n) {
    const num = new Decimal(n);
    if (num.isInteger()) {
      const one = Decimal.ONE;
      if (num.isNegative()) {
        return Number.NaN;
      }
      if (num.lte(one)) {
        return one;
      }
      return integer.factorial2(num).mul(integer.factorial2(num.sub(one)));
    }
  },

  // double factorial n!!
  factorial2(n) {
    const num = new Decimal(n);
    if (num.isInteger()) {
      const one = Decimal.ONE;
      const two = new Decimal(2);
      if (num.isNegative()) {
        return Number.NaN;
      }
      if (num.lte(one)) {
        return one;
      }
      if (num.isOdd()) {
        return integer.factorial2(num.sub(two)).mul(num);
      }

      let half = num.div(two).toInteger();
      return math.pow(2, half).mul(integer.factorial(half));
    }
  },

  binomial(n, k) {
    const one = Decimal.ONE;
    let m = new Decimal(n);
    let l = new Decimal(k);
    if (l.isNegative() || l.gt(m)) {
      return Decimal.ZERO;
    }

    // take advantage of symmetry
    let r = m.sub(l);
    if (l.gt(r)) {
      return integer.binomial(m, r);
    }

    let p = one;
    while (m.gt(r)) {
      p = p.mul(m);
      m = m.sub(one);
    }
    return p.div(integer.factorial(l)).toInteger();
  },

  multinomial(...values) {
    const zero = Decimal.ZERO;
    const one = Decimal.ONE;
    let s = zero;
    let p = one;
    for (let value of values) {
      let v = new Decimal(value);
      if (v.isNegative()) {
        return zero;
      }
      s = s.add(v);
      p = p.mul(integer.binomial(s, v));
    }
    return p;
  }
});

export default integer;
