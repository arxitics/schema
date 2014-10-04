
// Constructor of arbitrary-precision decimals
function Decimal(number) {
  var constructor = Object.prototype.toString.call(number).slice(8, -1);
  if (constructor === 'String') {
    return Decimal.parse(number);
  } else if (constructor === 'Object') {
    this.type = number.type || 'integer';
    this.sign = number.sign || 1;
    this.precision = number.precision || 0;
    this.sequence = number.sequence || [0];
  } else {
    throw new TypeError('Invalid parameters for Decimal class');
  }
}

Decimal._format = /^\d+$/;

Decimal.parse = function (string) {
  if (string.match(Decimal._format)) {
    let length = string.length;
    let array = [];
    for (let i = 0, j = (length % 4 || 4); j <= length; i = j, j += 4) {
      array.unshift(Number.parseInt(string.slice(i, j), 10)|0);
    }
    return new Decimal({
      sequence: array
    });
  } else {
    throw new TypeError('Invalid input for Decimal class');
  }
};

Decimal.prototype.constructor = Decimal;

Decimal.prototype.add = function (that) {
  if (that.constructor === Decimal) {
    var _this = this.sequence;
    var _that = that.sequence;
    var radix = 10000;
    var sum = Array.from({length: Math.max(_this.length, _that.length)}, x => 0);
    var division = 0;
    sum.forEach(function (value, index, array) {
      value += (_this[index] + _that[index]);
      if (value >= radix) {
        let next = index + 1;
        array[next] = (array[next]|0) + Math.floor(value / radix);
        value %= radix;
      }
      array[index] = value;
    });
    return new Decimal({
      sequence: sum
    });
  } else {
    throw new TypeError('Required Decimal class');
  }
};

Decimal.prototype.multiply = function (that) {
  var size = this.size;
  if (that.constructor === Decimal) {
    var _this = this.sequence;
    var _that = that.sequence;
    var radix = 10000;
    var product = Array.from({length: _this.length + _that.length - 1}, x => 0);
    product.forEach(function (value, index, array) {
      var next = index + 1;
      for (let i = 0; i <= index; i++) {
        value += Math.imul(_this[i], _that[index - i]);
        if (value >= radix) {
          array[next] = (array[next]|0) + Math.floor(value / radix);
          value %= radix;
          for (let j = next; array[j] >= radix; j++) {
            array[j + 1] = (array[j + 1]|0) + Math.floor(array[j] / radix);
            array[j] %= radix;
          }
        }
      }
      array[index] = value;
    });
    return new Decimal({
      sequence: product
    });
  } else {
    throw new TypeError('Required Decimal class');
  }
};

Decimal.prototype.toString = function () {
  return this.sequence.map(function (value) {
    return '0'.repeat(4 - String(value).length) + value;
  }).reverse().join('').replace(/^0+/, '');
};

Decimal.prototype.toJSON = Decimal.prototype.toString;

var start = Date.now();
for (let i = 0; i <= 100; i++) {
  var big1 = new Decimal('79'.repeat(1000 + i));
  var big2 = Decimal.parse('84'.repeat(1000 + i));
  var sum = big1.add(big2);
  console.log(sum.toString());
  var product = big1.multiply(big2);
  console.log(product.toString());
}
var end = Date.now();
console.log(end - start);
