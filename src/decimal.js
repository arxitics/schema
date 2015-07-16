
var global = Function('return this')();
var schema = {}
Object.assign(schema, {
  Decimal,
  bind: Function.prototype.call.bind(Function.prototype.bind)
});

// Constructor of arbitrary-precision others
function Decimal(number) {
  if (number === undefined || number === null) {
    throw new TypeError('Decimal constructor() missing arguments');
  }
  if (number.constructor === Decimal) {
    return number;
  }
  if (typeof number !== 'object') {
    number = Decimal.parse(String(number));
  }
  if (number.sequence.every(value => value === 0)) {
    number.sign = 0;
  }
  if (number.sign === 0) {
    number.exponent = 0;
    number.precision = 0;
  } else {
    number.exponent = number.precision - number.accuracy - 1;
  }
  return Object.assign((this instanceof Decimal) ?
    this : Object.create(Decimal.prototype), {
    type: 'integer',
    sign: 0,
    exponent: 0, // the exponent in scientific notation
    precision: 0, // the number of significant digits
    accuracy: 0, // the number of digits after the other point
    sequence: []
  }, number);
}

Object.assign(Decimal, {
  parse(string) {
    let input = String(string).trim();
    let matches = input.replace(/^\D+/, '').match(/^(\d+)(?:\.(\d*))?([Ee]([\+\-]?\d+))?$/);
    if (!matches) {
      throw new TypeError('Decimal.parse() invalid arguments');
    }

    let [number, integerPart, fractionalPart, notation, exponent] = matches;
    if (notation) {
      number = number.replace(notation, '');
      exponent = Number.parseInt(exponent);
      if (exponent > 0) {
        if (fractionalPart) {
          let padding = exponent - fractionalPart.length;
          integerPart += fractionalPart.slice(0, exponent) +
            (padding > 0 ? '0'.repeat(padding) : '');
          fractionalPart = fractionalPart.slice(exponent);
        } else {
          number += '0'.repeat(exponent);
        }
      } else if (exponent < 0) {
        let shift = integerPart.length + exponent;
        fractionalPart = (shift < 0 ? '0'.repeat(-shift) : '') +
          integerPart.slice(exponent) + (fractionalPart || '');
        integerPart = (shift <= 0) ? '0' : integerPart.slice(0, exponent);
      }
    }

    let precision = number.length;
    let accuracy = 0;
    let type = 'integer';
    let sequence = [];
    if (input.contains('.') || fractionalPart) {
      accuracy = fractionalPart.length;
      number = integerPart + fractionalPart;
      precision = number.replace(/^0+/, '').length;
      type = 'real';
      if (accuracy % 8) {
        number += '0'.repeat(8 - accuracy % 8);
      }
    }
    let length = number.length;
    for (let i = 0, j = (length % 8 || 8); j <= length; i = j, j += 8) {
      sequence.push(Number.parseInt(number.slice(i, j), 10)|0);
    }
    while (sequence[0] === 0) {
      sequence.shift();
    }
    return {
      type,
      sign: input.startsWith('-') ? -1 : 1,
      precision,
      accuracy,
      sequence
    };
  }
});

Object.defineProperties(Decimal, {
  'ZERO': {
    value: new Decimal(0),
    writable: false,
    enumerable: false,
    configurable: false
  },
  'ONE': {
    value: new Decimal(1),
    writable: false,
    enumerable: false,
    configurable: false
  }
});

Object.assign(Decimal.prototype, {
  set(key, value) {
    if (value === undefined) {
      if (this.sign && key === 'precision') {
        this.precision = this.toString().replace(/\D/g, '').replace(/^0+/, '').length;
        this.exponent = this.precision - this.accuracy - 1;
      }
    } else {
      this[key] = value;
    }
    return this;
  },

  get(key) {
    return this[key];
  },

  isInteger() {
    return this.type === 'integer';
  },

  isReal() {
    return this.type === 'real';
  },

  isZero() {
    return this.sign === 0;
  },

  isPositive() {
    return this.sign === 1;
  },

  isNegative() {
    return this.sign === -1;
  },

  isEven() {
    if (!(this.isInteger())) {
      throw new TypeError('isEven() required an instance of Integer Class');
    }
    let sequence = this.sequence;
    return sequence[sequence.length - 1] % 2 === 0;
  },

  isOdd() {
    if (!(this.isInteger())) {
      throw new TypeError('isOdd() required an instance of Integer Class');
    }
    let sequence = this.sequence;
    return sequence[sequence.length - 1] % 2 === 1;
  },

  eq(other) {
    if (other.constructor !== Decimal) {
      throw new TypeError('eq() required an instance of Decimal class');
    }

    let {sign, exponent, sequence} = this;
    if (sign !== other.sign || exponent !== other.exponent) {
      return false;
    }

    return sequence.length === other.sequence.length &&
      other.sequence.every((value, index) => value === sequence[index]);
  },

  lt(other) {
    if (other.constructor !== Decimal) {
      throw new TypeError('lt() required an instance of Decimal class');
    }

    let {sign, exponent, sequence} = this;
    if (sign !== other.sign) {
      return sign < other.sign;
    }

    let less = (exponent !== other.exponent) ?
      exponent < other.exponent :
      other.sequence.some((value, index) => value > (sequence[index]|0));
    return sign === 1 ? less : !less;
  },

  lte(other) {
    if (other.constructor !== Decimal) {
      throw new TypeError('lte() required an instance of Decimal class');
    }
    return this.lt(other) || this.eq(other);
  },

  gt(other) {
    if (other.constructor !== Decimal) {
      throw new TypeError('gt() required an instance of Decimal class');
    }
    return other.lt(this);
  },

  gte(other) {
    if (other.constructor !== Decimal) {
      throw new TypeError('gte() required an instance of Decimal class');
    }
    return this.gt(other) || this.eq(other);
  },

  neg() {
    return new Decimal(this.toSource()).set('sign', -this.sign);
  },

  abs() {
    if (this.isNegative()) {
      return this.neg();
    }
    return this.clone();
  },

  add(other, digits) {
    if (other.constructor !== Decimal) {
      throw new TypeError('add() required an instance of Decimal class');
    }

    let {sign, exponent, accuracy, sequence: augend} = this;
    let {sign: signum, sequence: addend} = other;
    if (sign === 0) {
      return other.clone();
    }
    if (signum === 0) {
      return this.clone();
    }
    // a + (-a) => 0
    if (this.eq(other.neg())) {
      return Decimal.ZERO;
    }
    // a < 0: a + b => b + a
    if (sign < 0) {
      if (signum > 0) {
        return other.add(this);
      } else {
        return other.neg().add(this.neg(), digits).neg();
      }
    }
    // a < -b : a + b => -((-b) + (-a))
    if (sign > signum) {
      let summand = other.neg();
      if (this.lt(summand)) {
        return summand.add(this.neg(), digits).neg();
      }
    }

    // retain maximum accuracy
    accuracy = Math.max(accuracy, other.accuracy);
    if (digits === undefined || digits < 0) {
      digits = accuracy;
    }

    let length = Math.ceil((Math.abs(exponent) + accuracy) / 8) + 2;
    let shift = length - Math.ceil(accuracy / 8);
    let augendShift = augend.length - Math.ceil(this.accuracy / 8) - shift;
    let addendShift = addend.length - Math.ceil(other.accuracy / 8) - shift;
    let sequence = new Array(length).fill(0);
    const radix = 100000000;
    for (let index = length - 1; index > 0; index--) {
      let value = sequence[index];
      value += (augend[index + augendShift]|0) + signum * (addend[index + addendShift]|0);
      if (value >= radix || value < 0) {
        sequence[index - 1] += signum;
        value -= signum * radix;
      }
      sequence[index] = value;
    }
    while (sequence[0] === 0) {
      sequence.shift();
    }
    return new Decimal({
      type: (this.isReal() || other.isReal()) ? 'real' : 'integer',
      sign: sign || signum,
      accuracy,
      sequence
    }).set('precision').toAccuracy(digits);
  },

  sub(other, digits) {
    if (other.constructor !== Decimal) {
      throw new TypeError('sub() required an instance of Decimal class');
    }

    // a < b : a - b => -(b + (-a))
    if (this.lt(other)) {
      return other.add(this.neg(), digits).neg();
    }
    // -a - b => -(a + b)
    if (this.sign < other.sign) {
      return this.neg().add(other, digits).neg();
    }
    // a - b => a + (-b)
    return this.add(other.neg(), digits);
  },

  mul(other, digits) {
    if (other.constructor !== Decimal) {
      throw new TypeError('mul() required an instance of Decimal class');
    }

    if (this.isZero() || other.isZero()) {
      return Decimal.ZERO;
    }

    const one = Decimal.ONE;
    if (this.eq(one)) {
      return other.clone();
    }
    if (other.eq(one)) {
      return this.clone();
    }

    // retain maximum accuracy
    let accuracy = this.accuracy + other.accuracy;
    if (digits === undefined || digits < 0) {
      digits = accuracy;
    }

    let multiplicand = this.sequence.slice().reverse();
    let multiplier = other.sequence.slice().reverse();
    let length = multiplicand.length + multiplier.length;
    let buffer = new ArrayBuffer(4 * length);
    let sequence = Array.of(...(function (stdlib, foreign, buffer) {
      'use asm';
      const radix = 100000000;
      const base = 10000;
      let floor = stdlib.Math.floor;
      let imul = stdlib.Math.imul;
      let multiplicand = foreign.multiplicand;
      let multiplier = foreign.multiplier;
      let values = new stdlib.Int32Array(buffer);
      for (let index = 0, length = values.length; index < length; index++) {
        let value = values[index];
        let nextIndex = index + 1;
        for (let i = 0; i <= index; i++) {
          let a = multiplicand[i]|0;
          let b = multiplier[index - i]|0;
          let a0 = a % base;
          let b0 = b % base;
          let a1 = floor(a / base);
          let b1 = floor(b / base);
          // Karatsuba algorithm
          let c0 = imul(a0, b0);
          let c2 = imul(a1, b1);
          let c1 = imul(a0 + a1, b0 + b1) - c0 - c2;
          value += c0 + imul(c1 % base, base);
          c2 += floor(c1 / base);
          if (value >= radix || c2) {
            values[nextIndex] += floor(value / radix) + c2;
            value %= radix;
            for (let j = nextIndex; values[j] >= radix; j++) {
              let element = values[j];
              values[j + 1] += floor(element / radix);
              values[j] = element % radix;
            }
          }
        }
        values[index] = value;
      }
      return values;
    })(global, {multiplicand, multiplier}, buffer)).reverse();
    if (sequence[length - 1] === 0) {
      let remainder = this.accuracy % 8;
      let rest = other.accuracy % 8;
      if (remainder && rest && remainder + rest % 8 <= 8) {
        sequence.pop();
      }
    }
    while (sequence[0] === 0) {
      sequence.shift();
    }
    return new Decimal({
      type: (this.type === 'real' || other.type === 'real') ? 'real' : 'integer',
      sign: this.sign * other.sign,
      accuracy,
      sequence
    }).set('precision').toAccuracy(digits);
  },

  div(other, digits = this.precision + 6) {
    if (other.constructor !== Decimal) {
      throw new TypeError('div() required an instance of Decimal class');
    }

    if (other.isZero()) {
      let sign = this.sign;
      if (sign !== 0) {
        return (sign === -1) ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
      }
      return Number.NaN;
    }
    return this.mul(other.inv(digits + 1), digits);
  },

  // use Newton's method to find the reciprocal
  inv(digits = 16) {
    let {sign, exponent, sequence} = this;
    const one = Decimal.ONE;
    if (sign === 0) {
      return Number.POSITIVE_INFINITY;
    }
    if (sign === -1) {
      return this.neg().inv(digits).neg();
    }
    if (this.eq(one)) {
      return one;
    }
    if (this.lt(new Decimal(0.1))) {
      return new Decimal(this.toString().replace(/\.0+/ , '.')).inv(digits)
        .mul(new Decimal('1' + '0'.repeat(-exponent - 1)));
    }
    if (this.gt(one)) {
      return new Decimal('0.' + this.toString().replace('.', '')).inv(digits)
        .mul(new Decimal('0.' + '0'.repeat(exponent) + '1'));
    }

    const accuracy = digits + 1;
    let epsilon = new Decimal('0.' + '0'.repeat(digits - 1) + '1');
    let reciprocal = new Decimal(100000000 / sequence[0]);
    let error = one.sub(this.mul(reciprocal));
    while (epsilon.lt(error.abs())) {
      reciprocal = reciprocal.add(reciprocal.mul(error, accuracy));
      error = one.sub(this.mul(reciprocal, accuracy));
    }
    return reciprocal.toAccuracy(digits);
  },

  toAccuracy(digits) {
    let {type, accuracy, sequence} = this;
    if (digits >= 0 && digits !== accuracy) {
      let padding = digits - accuracy;
      if (type === 'real') {
        if (padding < 0) {
          // remove last elements
          sequence.length -= Math.ceil(accuracy / 8) - Math.ceil(digits / 8);
          if (digits % 8) {
            let lastIndex = sequence.length - 1;
            let lastValue = sequence[lastIndex];
            sequence[lastIndex] -= lastValue % Math.pow(10, 8 - digits % 8);
          }
        } else {
          if (accuracy % 8) {
            padding -= 8 - accuracy % 8;
          }
          sequence.push(...new Array(Math.ceil(padding / 8)).fill(0));
        }
      }
      if (type === 'integer' && digits > 0) {
        sequence.push(...new Array(Math.ceil(digits / 8)).fill(0));
      }
      this.precision += padding;
      this.accuracy = digits;
      this.sequence = sequence;
    }
    return this;
  },

  toInteger() {
    if (this.isInteger()) {
      return this;
    }

    let rounding = this.sequence[Math.floor(this.exponent / 8) + 1];
    this.toAccuracy(0).set('type', 'integer');
    if (rounding < 50000000) {
      return this;
    }
    return this.add(Decimal.ONE);
  },

  toString() {
    let {sign, accuracy, sequence} = this;
    if (sign === 0) {
      return '0';
    }

    let string = sequence.map(value => '0'.repeat(8 - String(value).length) + value).join('');
    if (accuracy > 0) {
      let length = string.length;
      if (accuracy > length) {
        string = '0'.repeat(accuracy - length) + string;
      }
      if (accuracy % 8) {
        string = string.slice(0, accuracy % 8 - 8);
      }
      string = (string.slice(0, -accuracy) || '0') + '.' + string.slice(-accuracy);
    }
    return (sign === -1 ? '-' : '') + string.replace(/^0+(?=[^\.])/, '');
  },

  // format a number using fixed-point notation
  toFixed(digits = 0) {
    if (digits < 0) {
      throw new RangeError('toFixed() digits argument must be non-negative');
    }

    if (this.isZero()) {
      return '0' + (digits > 1 ? '.' + '0'.repeat(digits) : '');
    }
    let string = this.toString();
    let padding = digits - this.accuracy;
    if (padding < 0) {
      let rounding = +string.charAt(string.length + padding);
      if (rounding >= 5) {
        string = this.add(new Decimal(sign + 'e-' + digits)).toString();
      }
      return string.slice(0, padding).replace(/\.$/, '');
    } else if (padding > 0) {
      return string + (this.isReal() ? '' : '.') + '0'.repeat(padding);
    }
    return string;
  },

  toExponential(digits = this.precision) {
    if (digits < 0) {
      throw new RangeError('toExponential() digits argument must be non-negative');
    }

    let {sign, exponent, precision} = this;
    if (sign === 0) {
      return '0' + (digits > 1 ? '.' + '0'.repeat(digits) : '') + 'e+0';
    }
    let string = this.toString().replace(/\D/g, '').replace(/^0*/, '');
    let padding = digits - precision;
    if (padding < -1) {
      let rounding = +string.charAt(digits + 1);
      if (rounding >= 5) {
        string = new Decimal(string.slice(0, digits + 1)).add(Decimal.ONE).toString();
      }
    } else if (padding > 0) {
      string += '0'.repeat(padding);
    }
    if (string.length > 1) {
      string = string.substr(0, 1) + '.' + string.substr(1, digits);
    }
    return (sign === -1 ? '-' : '') + string + 'e' + (exponent > 0 ? '+' : '') + exponent;
  },

  toPrecision(digits) {
    if (digits === undefined) {
      return this.toString();
    }
    if (digits < 0) {
      throw new RangeError('toPrecision() digits argument must be non-negative');
    }

    let {exponent, precision, accuracy} = this;
    if (this.isZero()) {
      return '0' + (digits > 1 ? '.' + '0'.repeat(digits - 1) : '');
    }
    if (digits > exponent) {
      return this.toFixed(accuracy + digits - precision);
    }
    return this.toExponential(digits - 1);
  },

  get toJSON() {
    return this.toString;
  },

  toSource() {
    return Object.assign({}, this, {
      sequence: this.sequence.slice()
    });
  },

  clone() {
    return new Decimal(this.toSource());
  }
});

let big1 = new schema.Decimal('9123.45678989');
console.log(big1);
console.log(big1.sequence);
console.log(big1.toString());

let big2 = new Decimal('-3.241234567809e+2');
console.log(big2);
console.log(big2.sequence);
console.log(big2.toString());

let sum = big1.add(big2);
console.log(sum);
console.log(sum.sequence);
console.log(sum.toString());

let difference = big1.sub(big2);
console.log(difference);
console.log(difference.sequence);
console.log(difference.toExponential());

let product = big1.mul(big2);
console.log(sum.lt(product));
console.log(product);
console.log(product.sequence);
console.log(product.toPrecision(4));

let division = big1.div(big2, 20);
console.log(division.lt(product));
console.log(division);
console.log(division.sequence);
console.log(division.toString());

let start = performance.now();
let reciprocal = Decimal('-1.2345678989').inv(1000);
console.log(reciprocal);
console.log(reciprocal.sequence);
console.log(reciprocal.toString());
let end = performance.now();
console.log(end - start);

var math = {};

Object.assign(math, {
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
  }
});

var integer = {};
Object.assign(integer, {
  rem(a, b) {
    let dividend = new Decimal(a);
    let divisor = new Decimal(b);
    console.log(dividend.toSource());
    console.log(divisor.toSource());
    if (!(dividend.isInteger() && divisor.isInteger())) {
      throw new TypeError('rem() invalid arguments');
    }
    return dividend.div(divisor);
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
    const m = new Decimal(n);
    const l = new Decimal(k);
    if (l.isNegative() || l.gt(m)) {
      return Decimal.ZERO;
    }
    let c = integer.factorial(l).mul(integer.factorial(m.sub(l)));
    return integer.factorial(m).div(c).toInteger();
  },

  multinomial(...values) {
    const zero = Decimal.ZERO;
    const one = Decimal.ONE;
    let s = zero;
    let c = one;
    for (let value of values) {
      let v = new Decimal(value);
      if (v.isNegative()) {
        return zero;
      }
      s = s.add(v);
      c = c.mul(integer.factorial(v));
    }
    return integer.factorial(s).div(c).toInteger();
  }
});

console.log(Decimal.ZERO.add(new Decimal(1)).toString());
console.log(math.sum(2, 3, 4, 5).toString());
console.log(math.product(2, 3, 4, 5).toString());

console.log(integer.rem(20.00, 3).toString());
console.log(math.pow(2, -100).toExponential(12));
console.log(integer.factorial(100).toExponential(12));

let x = new Decimal(7.9);
console.log(x.inv().toString());

let s = performance.now();
console.log(integer.binomial(100, 40).toString());
console.log(integer.multinomial(10, 20, 40).toString());
let e = performance.now();
console.log(e - s);

let zero = Decimal.ZERO;
let ten = new Decimal(10);
console.log(zero.toString());
console.log(zero.add(ten).toString());
console.log(ten.add(zero).toString());
