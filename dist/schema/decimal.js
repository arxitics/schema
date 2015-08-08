
// Arbitrary-precision decimals
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Decimal = function Decimal(number) {
  _classCallCheck(this, Decimal);

  if (number === undefined || number === null) {
    throw new TypeError('Decimal constructor() missing arguments');
  }
  if (number.constructor === Decimal) {
    return number;
  }
  if (typeof number !== 'object') {
    number = Decimal.parse(String(number));
  }
  if (number.sequence.every(function (value) {
    return value === 0;
  })) {
    number.sign = 0;
  }
  if (number.sign === 0) {
    number.exponent = 0;
    number.precision = 0;
  } else {
    number.exponent = number.precision - number.accuracy - 1;
  }
  return Object.assign(this instanceof Decimal ? this : Object.create(Decimal.prototype), {
    type: 'integer',
    sign: 0,
    exponent: 0, // the exponent in scientific notation
    precision: 0, // the number of significant digits
    accuracy: 0, // the number of digits after the other point
    sequence: []
  }, number);
};

Object.assign(Decimal, {
  parse: function parse(string) {
    var input = String(string).trim();
    var matches = input.replace(/^\D+/, '').match(/^(\d+)(?:\.(\d*))?([Ee]([\+\-]?\d+))?$/);
    if (!matches) {
      throw new TypeError('Decimal.parse() invalid arguments');
    }

    var _matches = _slicedToArray(matches, 5);

    var number = _matches[0];
    var integerPart = _matches[1];
    var fractionalPart = _matches[2];
    var notation = _matches[3];
    var exponent = _matches[4];

    if (notation) {
      number = number.replace(notation, '');
      exponent = Number.parseInt(exponent);
      if (exponent > 0) {
        if (fractionalPart) {
          var padding = exponent - fractionalPart.length;
          integerPart += fractionalPart.slice(0, exponent) + (padding > 0 ? '0'.repeat(padding) : '');
          fractionalPart = fractionalPart.slice(exponent);
        } else {
          number += '0'.repeat(exponent);
        }
      } else if (exponent < 0) {
        var shift = integerPart.length + exponent;
        fractionalPart = (shift < 0 ? '0'.repeat(-shift) : '') + integerPart.slice(exponent) + (fractionalPart || '');
        integerPart = shift <= 0 ? '0' : integerPart.slice(0, exponent);
      }
    }

    var precision = number.length;
    var accuracy = 0;
    var type = 'integer';
    var sequence = [];
    if (input.includes('.') || fractionalPart) {
      accuracy = fractionalPart.length;
      number = integerPart + fractionalPart;
      precision = number.replace(/^0+/, '').length;
      type = 'real';
      if (accuracy % 8) {
        number += '0'.repeat(8 - accuracy % 8);
      }
    }
    var length = number.length;
    for (var i = 0, j = length % 8 || 8; j <= length; i = j, j += 8) {
      sequence.push(Number.parseInt(number.slice(i, j), 10) | 0);
    }
    while (sequence[0] === 0) {
      sequence.shift();
    }
    return {
      type: type,
      sign: input.startsWith('-') ? -1 : 1,
      precision: precision,
      accuracy: accuracy,
      sequence: sequence
    };
  },

  exp: function exp(exponent) {
    if (!Number.isInteger(exponent)) {
      throw new TypeError('Decimal.exp() invalid arguments');
    }
    var isInteger = exponent >= 0;
    var sequence = [Math.pow(10, (8 + exponent % 8) % 8)];
    if (isInteger) {
      sequence.push.apply(sequence, _toConsumableArray(new Array(Math.floor(exponent / 8)).fill(0)));
    }
    return new Decimal({
      type: isInteger ? 'integer' : 'real',
      sign: 1,
      precision: isInteger ? exponent + 1 : 1,
      accuracy: isInteger ? 0 : -exponent,
      sequence: sequence
    });
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

Object.assign(Decimal.prototype, Object.defineProperties({
  set: function set(key, value) {
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

  get: function get(key) {
    return this[key];
  },

  isInteger: function isInteger() {
    return this.type === 'integer';
  },

  isReal: function isReal() {
    return this.type === 'real';
  },

  isZero: function isZero() {
    return this.sign === 0;
  },

  isPositive: function isPositive() {
    return this.sign === 1;
  },

  isNegative: function isNegative() {
    return this.sign === -1;
  },

  isEven: function isEven() {
    if (!this.isInteger()) {
      throw new TypeError('isEven() required an instance of Integer Class');
    }
    var sequence = this.sequence;
    return sequence[sequence.length - 1] % 2 === 0;
  },

  isOdd: function isOdd() {
    if (!this.isInteger()) {
      throw new TypeError('isOdd() required an instance of Integer Class');
    }
    var sequence = this.sequence;
    return sequence[sequence.length - 1] % 2 === 1;
  },

  eq: function eq(other) {
    if (other.constructor !== Decimal) {
      throw new TypeError('eq() required an instance of Decimal class');
    }

    var sign = this.sign;
    var exponent = this.exponent;
    var sequence = this.sequence;

    if (sign !== other.sign || exponent !== other.exponent) {
      return false;
    }

    var list = other.sequence;
    if (sequence.length >= list.length) {
      return sequence.every(function (value, index) {
        return value === (list[index] | 0);
      });
    }
    return list.every(function (value, index) {
      return value === (sequence[index] | 0);
    });
  },

  lt: function lt(other) {
    if (other.constructor !== Decimal) {
      throw new TypeError('lt() required an instance of Decimal class');
    }

    var sign = this.sign;
    var exponent = this.exponent;
    var sequence = this.sequence;
    var signum = other.sign;
    var power = other.exponent;
    var list = other.sequence;

    if (sign !== signum) {
      return sign < signum;
    }

    var less = false;
    if (exponent !== power) {
      less = exponent < power;
    } else {
      var _length = Math.max(sequence.length, list.length);
      for (var i = 0; i < _length; i++) {
        if ((sequence[i] | 0) !== (list[i] | 0)) {
          less = (sequence[i] | 0) < (list[i] | 0);
          break;
        }
      }
    }
    return sign === 1 ? less : !less;
  },

  lte: function lte(other) {
    if (other.constructor !== Decimal) {
      throw new TypeError('lte() required an instance of Decimal class');
    }
    return this.lt(other) || this.eq(other);
  },

  gt: function gt(other) {
    if (other.constructor !== Decimal) {
      throw new TypeError('gt() required an instance of Decimal class');
    }
    return other.lt(this);
  },

  gte: function gte(other) {
    if (other.constructor !== Decimal) {
      throw new TypeError('gte() required an instance of Decimal class');
    }
    return this.gt(other) || this.eq(other);
  },

  neg: function neg() {
    return new Decimal(this.toSource()).set('sign', -this.sign);
  },

  abs: function abs() {
    if (this.isNegative()) {
      return this.neg();
    }
    return this.clone();
  },

  add: function add(other, digits) {
    if (other.constructor !== Decimal) {
      throw new TypeError('add() required an instance of Decimal class');
    }

    var sign = this.sign;
    var exponent = this.exponent;
    var accuracy = this.accuracy;
    var augend = this.sequence;
    var signum = other.sign;
    var addend = other.sequence;

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
      var summand = other.neg();
      if (this.lt(summand)) {
        return summand.add(this.neg(), digits).neg();
      }
    }

    // retain maximum accuracy
    accuracy = Math.max(accuracy, other.accuracy);
    if (digits === undefined || digits < 0) {
      digits = accuracy;
    }

    var length = Math.ceil((Math.abs(exponent) + accuracy) / 8) + 2;
    var shift = length - Math.ceil(accuracy / 8);
    var augendShift = augend.length - Math.ceil(this.accuracy / 8) - shift;
    var addendShift = addend.length - Math.ceil(other.accuracy / 8) - shift;
    var sequence = new Array(length).fill(0);
    var radix = 100000000;
    for (var index = length - 1; index > 0; index--) {
      var value = sequence[index];
      value += (augend[index + augendShift] | 0) + signum * (addend[index + addendShift] | 0);
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
      type: this.isReal() || other.isReal() ? 'real' : 'integer',
      sign: sign || signum,
      accuracy: accuracy,
      sequence: sequence
    }).set('precision').toAccuracy(digits);
  },

  sub: function sub(other, digits) {
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

  mul: function mul(other, digits) {
    if (other.constructor !== Decimal) {
      throw new TypeError('mul() required an instance of Decimal class');
    }

    if (this.isZero() || other.isZero()) {
      return Decimal.ZERO;
    }

    var one = Decimal.ONE;
    if (this.eq(one)) {
      return other.clone();
    }
    if (other.eq(one)) {
      return this.clone();
    }

    // retain maximum accuracy
    var accuracy = this.accuracy + other.accuracy;
    if (digits === undefined || digits < 0) {
      digits = accuracy;
    }

    var multiplicand = this.sequence.slice().reverse();
    var multiplier = other.sequence.slice().reverse();
    var length = multiplicand.length + multiplier.length;
    var buffer = new ArrayBuffer(4 * length);
    var sequence = Array.of.apply(Array, _toConsumableArray((function (stdlib, foreign, buffer) {
      'use asm';
      var radix = 100000000;
      var base = 10000;
      var floor = stdlib.Math.floor;
      var imul = stdlib.Math.imul;
      var multiplicand = foreign.multiplicand;
      var multiplier = foreign.multiplier;
      var values = new stdlib.Int32Array(buffer);
      for (var index = 0, _length2 = values.length; index < _length2; index++) {
        var value = values[index];
        var nextIndex = index + 1;
        for (var i = 0; i <= index; i++) {
          var a = multiplicand[i] | 0;
          var b = multiplier[index - i] | 0;
          var a0 = a % base;
          var b0 = b % base;
          var a1 = floor(a / base);
          var b1 = floor(b / base);
          // Karatsuba algorithm
          var c0 = imul(a0, b0);
          var c2 = imul(a1, b1);
          var c1 = imul(a0 + a1, b0 + b1) - c0 - c2;
          value += c0 + imul(c1 % base, base);
          c2 += floor(c1 / base);
          if (value >= radix || c2) {
            values[nextIndex] += floor(value / radix) + c2;
            value %= radix;
            for (var j = nextIndex; values[j] >= radix; j++) {
              var element = values[j];
              values[j + 1] += floor(element / radix);
              values[j] = element % radix;
            }
          }
        }
        values[index] = value;
      }
      return values;
    })(global, { multiplicand: multiplicand, multiplier: multiplier }, buffer))).reverse();
    if (sequence[length - 1] === 0) {
      var remainder = this.accuracy % 8;
      var rest = other.accuracy % 8;
      if (remainder && rest && remainder + rest % 8 <= 8) {
        sequence.pop();
      }
    }
    while (sequence[0] === 0) {
      sequence.shift();
    }
    return new Decimal({
      type: this.type === 'real' || other.type === 'real' ? 'real' : 'integer',
      sign: this.sign * other.sign,
      accuracy: accuracy,
      sequence: sequence
    }).set('precision').toAccuracy(digits);
  },

  div: function div(other, digits) {
    if (other.constructor !== Decimal) {
      throw new TypeError('div() required an instance of Decimal class');
    }

    if (other.isZero()) {
      var sign = this.sign;
      if (sign !== 0) {
        return sign === -1 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
      }
      return Number.NaN;
    }
    if (digits === undefined || digits < 0) {
      digits = Math.max(this.precision, other.precision) + 6;
    }
    return this.mul(other.inv(digits + 1), digits);
  },

  // use Newton's method to approximate the reciprocal
  inv: function inv() {
    var digits = arguments.length <= 0 || arguments[0] === undefined ? 16 : arguments[0];
    var sign = this.sign;
    var exponent = this.exponent;
    var sequence = this.sequence;

    var one = Decimal.ONE;
    if (sign === 0) {
      return Number.POSITIVE_INFINITY;
    }
    if (sign === -1) {
      return this.neg().inv(digits).neg();
    }
    if (this.eq(one)) {
      return one;
    }
    if (this.gt(one) || this.lt(Decimal.exp(-1))) {
      var string = this.toString().replace(/^0\.0+|\./, '');
      return new Decimal('0.' + string).inv(digits).mul(Decimal.exp(-exponent - 1));
    }

    var accuracy = digits + 1;
    var epsilon = Decimal.exp(-digits);
    var reciprocal = new Decimal(100000000 / sequence[0]);
    var error = one.sub(this.mul(reciprocal));
    while (epsilon.lt(error.abs())) {
      reciprocal = reciprocal.add(reciprocal.mul(error, accuracy));
      error = one.sub(this.mul(reciprocal, accuracy));
    }
    return reciprocal.toAccuracy(digits);
  },

  toAccuracy: function toAccuracy(digits) {
    var type = this.type;
    var accuracy = this.accuracy;
    var sequence = this.sequence;

    if (digits >= 0 && digits !== accuracy) {
      var padding = digits - accuracy;
      if (type === 'real') {
        if (padding < 0) {
          // remove last elements
          sequence.length -= Math.ceil(accuracy / 8) - Math.ceil(digits / 8);
          if (digits % 8) {
            var lastIndex = sequence.length - 1;
            var lastValue = sequence[lastIndex];
            sequence[lastIndex] -= lastValue % Math.pow(10, 8 - digits % 8);
          }
        } else {
          if (accuracy % 8) {
            padding -= 8 - accuracy % 8;
          }
          sequence.push.apply(sequence, _toConsumableArray(new Array(Math.ceil(padding / 8)).fill(0)));
        }
      }
      if (type === 'integer' && digits > 0) {
        sequence.push.apply(sequence, _toConsumableArray(new Array(Math.ceil(digits / 8)).fill(0)));
      }
      this.precision += padding;
      this.accuracy = digits;
      this.sequence = sequence;
    }
    return this;
  },

  toInteger: function toInteger() {
    if (this.isInteger()) {
      return this;
    }

    var rounding = this.sequence[Math.floor(this.exponent / 8) + 1];
    this.toAccuracy(0).set('type', 'integer');
    if (rounding < 50000000) {
      return this;
    }
    return this.add(Decimal.ONE);
  },

  toString: function toString() {
    var sign = this.sign;
    var accuracy = this.accuracy;
    var sequence = this.sequence;

    if (sign === 0) {
      return '0';
    }

    var string = sequence.map(function (value) {
      return '0'.repeat(8 - String(value).length) + value;
    }).join('');
    if (accuracy > 0) {
      var _length3 = string.length;
      if (accuracy > _length3) {
        string = '0'.repeat(accuracy - _length3) + string;
      }
      if (accuracy % 8) {
        string = string.slice(0, accuracy % 8 - 8);
      }
      string = (string.slice(0, -accuracy) || '0') + '.' + string.slice(-accuracy);
    }
    return (sign === -1 ? '-' : '') + string.replace(/^0+(?=[^\.])/, '');
  },

  // format a number using fixed-point notation
  toFixed: function toFixed() {
    var digits = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

    if (digits < 0) {
      throw new RangeError('toFixed() digits argument must be non-negative');
    }

    if (this.isZero()) {
      return '0' + (digits > 1 ? '.' + '0'.repeat(digits) : '');
    }
    var sign = this.sign;
    var accuracy = this.accuracy;

    var string = this.toString();
    var padding = digits - accuracy;
    if (padding < 0) {
      var rounding = +string.charAt(string.length + padding);
      if (rounding >= 5) {
        string = this.add(Decimal.exp(-digits).set('sign', sign)).toString();
      }
      return string.slice(0, padding).replace(/\.$/, '');
    } else if (padding > 0) {
      return string + (this.isReal() ? '' : '.') + '0'.repeat(padding);
    }
    return string;
  },

  toExponential: function toExponential() {
    var digits = arguments.length <= 0 || arguments[0] === undefined ? this.precision : arguments[0];

    if (digits < 0) {
      throw new RangeError('toExponential() digits argument must be non-negative');
    }

    var sign = this.sign;
    var exponent = this.exponent;
    var precision = this.precision;

    if (sign === 0) {
      return '0' + (digits > 1 ? '.' + '0'.repeat(digits) : '') + 'e+0';
    }
    var string = this.toString().replace(/\D/g, '').replace(/^0*/, '');
    var padding = digits - precision;
    if (padding < -1) {
      var rounding = +string.charAt(digits + 1);
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

  toPrecision: function toPrecision(digits) {
    if (digits === undefined) {
      return this.toString();
    }
    if (digits < 0) {
      throw new RangeError('toPrecision() digits argument must be non-negative');
    }

    var exponent = this.exponent;
    var precision = this.precision;
    var accuracy = this.accuracy;

    if (this.isZero()) {
      return '0' + (digits > 1 ? '.' + '0'.repeat(digits - 1) : '');
    }
    if (digits > exponent) {
      return this.toFixed(accuracy + digits - precision);
    }
    return this.toExponential(digits - 1);
  },

  toSource: function toSource() {
    return Object.assign({}, this, {
      sequence: this.sequence.slice()
    });
  },

  clone: function clone() {
    return new Decimal(this.toSource());
  }
}, {
  toJSON: {
    get: function get() {
      return this.toString;
    },
    configurable: true,
    enumerable: true
  }
}));

exports['default'] = Decimal;
module.exports = exports['default'];