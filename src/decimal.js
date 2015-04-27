
var global = Function('return this')();
var schema = {}
Object.assign(schema, {
  Decimal,
  bind: Function.prototype.call.bind(Function.prototype.bind)
});

// Constructor of arbitrary-precision decimals
function Decimal(number) {
  if (number === undefined || number === null) {
    throw new TypeError('Decimal constructor() missing arguments');
  }
  if (number.constructor === Decimal) {
    return number;
  } else {
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
      accuracy: 0, // the number of digits after the decimal point
      sequence: []
    }, number);
  }
}

Object.assign(Decimal, {
  parse(string) {
    let trimedString = String(string).trim();
    let matches = trimedString.replace(/^\D+/, '').match(/^(\d+)(?:\.(\d*))?([Ee]([\+\-]?\d+))?$/);
    if (matches) {
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
      if (trimedString.contains('.') || fractionalPart) {
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
        sign: trimedString.startsWith('-') ? -1 : 1,
        precision,
        accuracy,
        sequence
      };
    } else {
      throw new TypeError('Decimal.parse() invalid arguments');
    }
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

  equals(decimal) {
    if (decimal.constructor === Decimal) {
      let {sign, exponent, sequence} = this;
      if (sign !== decimal.sign || exponent !== decimal.exponent) {
        return false;
      }

      return sequence.length === decimal.sequence.length &&
        decimal.sequence.every((value, index) => value === sequence[index]);
    } else {
      throw new TypeError('equals() required an instance of Decimal class');
    }
  },

  lessThan(decimal) {
    if (decimal.constructor === Decimal) {
      let {sign, exponent, sequence} = this;
      if (sign !== decimal.sign) {
        return sign < decimal.sign;
      }

      let less = (exponent !== decimal.exponent) ?
        exponent < decimal.exponent :
        decimal.sequence.some((value, index) => {
          return value > (sequence[index]|0);
        });
      return sign === 1 ? less : !less;
    } else {
      throw new TypeError('lessThan() required an instance of Decimal class');
    }
  },

  greaterThan(decimal) {
    if (decimal.constructor === Decimal) {
      return decimal.lessThan(this);
    } else {
      throw new TypeError('greaterThan() required an instance of Decimal class');
    }
  },

  add(decimal, digits) {
    if (decimal.constructor === Decimal) {
      let {sign, exponent, accuracy, sequence: augend} = this;
      let {sign: signum, sequence: addend} = decimal;
      // a + (-a) => 0
      if (this.equals(decimal.opposite())) {
        return new Decimal(0);
      }
      // a < 0: a + b => b + a
      if (sign < 0) {
        if (signum > 0) {
          return decimal.add(this);
        } else {
          return decimal.opposite().add(this.opposite(), digits).opposite();
        }
      }
      // a < -b : a + b => -((-b) + (-a))
      if (sign > signum) {
        let summand = decimal.opposite();
        if (this.lessThan(summand)) {
          return summand.add(this.opposite(), digits).opposite();
        }
      }

      // retain maximum accuracy
      accuracy = Math.max(accuracy, decimal.accuracy);
      if (digits === undefined || digits < 0) {
        digits = accuracy;
      }

      let length = Math.ceil((Math.abs(exponent) + accuracy) / 8) + 2;
      let shift = length - Math.ceil(accuracy / 8);
      let augendShift = augend.length - Math.ceil(this.accuracy / 8) - shift;
      let addendShift = addend.length - Math.ceil(decimal.accuracy / 8) - shift;
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
        type: (this.type === 'real' || decimal.type === 'real') ? 'real' : 'integer',
        sign,
        accuracy,
        sequence
      }).set('precision').toAccuracy(digits);
    } else {
      throw new TypeError('add() required an instance of Decimal class');
    }
  },

  subtract(decimal, digits) {
    if (decimal.constructor === Decimal) {
      // a < b : a - b => -(b + (-a))
      if (this.lessThan(decimal)) {
        return decimal.add(this.opposite(), digits).opposite();
      }
      // -a - b => -(a + b)
      if (this.sign < decimal.sign) {
        return this.opposite().add(decimal, digits).opposite();
      }
      // a - b => a + (-b)
      return this.add(decimal.opposite(), digits);
    } else {
      throw new TypeError('subtract() required an instance of Decimal class');
    }
  },

  multiply(decimal, digits) {
    if (decimal.constructor === Decimal) {
      // retain maximum accuracy
      let accuracy = this.accuracy + decimal.accuracy;
      if (digits === undefined || digits < 0) {
        digits = accuracy;
      }

      let multiplicand = this.sequence.slice().reverse();
      let multiplier = decimal.sequence.slice().reverse();
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
        let rest = decimal.accuracy % 8;
        if (remainder && rest && remainder + rest % 8 <= 8) {
          sequence.pop();
        }
      }
      while (sequence[0] === 0) {
        sequence.shift();
      }
      return new Decimal({
        type: (this.type === 'real' || decimal.type === 'real') ? 'real' : 'integer',
        sign: this.sign * decimal.sign,
        accuracy,
        sequence
      }).set('precision').toAccuracy(digits);
    } else {
      throw new TypeError('multiply() required an instance of Decimal class');
    }
  },

  divide(decimal, digits) {
    if (decimal.constructor === Decimal) {
      if (decimal.sign === 0) {
        let sign = this.sign;
        if (sign !== 0) {
          return (sign === -1) ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
        }
        return Number.NaN;
      }
      return this.multiply(decimal.inverse(digits + 1), digits);
    } else {
      throw new TypeError('divide() required an instance of Decimal class');
    }
  },

  opposite() {
    return new Decimal(this.toSource()).set('sign', -this.sign);
  },

  absolute() {
    if (this.sign === -1) {
      return this.opposite();
    }
    return new Decimal(this.toSource());
  },

  // use Newton's method to find the reciprocal
  inverse(digits = 16) {
    let {sign, exponent, sequence} = this;
    const one = new Decimal(1);
    if (sign === 0) {
      return Number.POSITIVE_INFINITY;
    }
    if (sign === -1) {
      return this.opposite().inverse(digits).opposite();
    }
    if (this.subtract(one).sign === 0) {
      return one;
    }
    if (this.lessThan(new Decimal(0.1))) {
      return new Decimal(this.toString().replace(/\.0+/ , '.')).inverse(digits)
        .multiply(new Decimal('1' + '0'.repeat(-exponent - 1)));
    }
    if (this.greaterThan(one)) {
      return new Decimal('0.' + this.toString().replace('.', '')).inverse(digits)
        .multiply(new Decimal('0.' + '0'.repeat(exponent) + '1'));
    }

    const accuracy = digits + 1;
    let epsilon = new Decimal('0.' + '0'.repeat(digits - 1) + '1');
    let reciprocal = new Decimal(100000000 / sequence[0]);
    let error = one.subtract(this.multiply(reciprocal));
    while (epsilon.lessThan(error.absolute())) {
      reciprocal = reciprocal.add(reciprocal.multiply(error, accuracy));
      error = one.subtract(this.multiply(reciprocal, accuracy));
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

  toString() {
    let {sign, accuracy, sequence} = this;
    if (sign === 0) {
      return '0';
    }

    let string = sequence.map(function (value) {
          return '0'.repeat(8 - String(value).length) + value;
        }).join('');
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

  // format a number using fixed-point notation without rounding
  toFixed(digits = 0) {
    let {sign, type, accuracy} = this;
    if (sign === 0) {
      return '0' + (digits > 1 ? '.' + '0'.repeat(digits) : '');
    }
    if (digits >= 0) {
      let string = this.toString();
      if (digits === accuracy) {
        return string;
      }
      if (digits === 0) {
        return string.replace(/\.\d*$/, '');
      } else {
        let padding = digits - accuracy;
        if (padding < 0) {
          return string.slice(0, padding);
        }
        return string + (type === 'real' ? '' : '.') + '0'.repeat(padding);
      }
    } else {
      throw new RangeError('toFixed() digits argument must be non-negative');
    }
  },

  toExponential(digits) {
    let {sign, exponent, precision} = this;
    if (sign === 0) {
      return '0' + (digits > 1 ? '.' + '0'.repeat(digits) : '') + 'e+0';
    }
    let string = this.toString().replace(/\D/g, '').replace(/^0*([1-9])/, '$1.');
    if (digits >= 0) {
      if (digits > precision) {
        string += '0'.repeat(digits - precision);
      }
      string = string.slice(0, digits + 2).replace(/\.$/, '');
    }
    string = string.replace(/\.$/, '');
    if (exponent) {
      string += 'e' + (exponent > 0 ? '+' : '') + exponent;
    }
    return (sign === -1 ? '-' : '') + string;
  },

  toPrecision(digits) {
    if (digits === undefined) {
      return this.toString();
    }
    let {sign, exponent, precision, accuracy} = this;
    if (sign === 0) {
      return '0' + (digits >= 1 ? '.' + '0'.repeat(digits - 1) : '');
    }
    if (digits > 0) {
      if (digits > exponent) {
        return this.toFixed(accuracy + digits - precision);
      }
      return this.toExponential(digits - 1);
    } else {
      throw new RangeError('toPrecision() digits argument must be non-negative');
    }
  },

  get toJSON() {
    return this.toString;
  },

  toSource() {
    return Object.assign({}, this, {
      sequence: this.sequence.slice()
    });
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

let difference = big1.subtract(big2);
console.log(difference);
console.log(difference.sequence);
console.log(difference.toExponential());

let product = big1.multiply(big2);
console.log(sum.lessThan(product));
console.log(product);
console.log(product.sequence);
console.log(product.toPrecision(4));

let division = big1.divide(big2, 20);
console.log(division.lessThan(product));
console.log(division);
console.log(division.sequence);
console.log(division.toString());

let start = performance.now();
let reciprocal = Decimal('-1.2345678989').inverse(1000);
console.log(reciprocal);
console.log(reciprocal.sequence);
console.log(reciprocal.toString());
let end = performance.now();
console.log(end - start);
