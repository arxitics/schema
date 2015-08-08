'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _decimal = require('./decimal');

var _decimal2 = _interopRequireDefault(_decimal);

var math = {};

Object.assign(math, {
  floor: function floor(n) {
    var num = new _decimal2['default'](n);
    if (num.isInteger()) {
      return num.clone();
    }
    if (num.isNegative()) {
      return math.ceil(num.neg()).neg();
    }
    return num.clone().toAccuracy(0).set('type', 'integer');
  },

  ceil: function ceil(n) {
    var num = new _decimal2['default'](n);
    if (num.isInteger()) {
      return num.clone();
    }
    if (num.isNegative()) {
      return math.floor(num.neg()).neg();
    }
    var integer = num.clone().toAccuracy(0).set('type', 'integer');
    if (math.floor(num).eq(num)) {
      return integer;
    }
    return integer.add(_decimal2['default'].ONE);
  },

  // use Newton's method to approximate the square root
  sqrt: function sqrt(n) {
    var digits = arguments.length <= 1 || arguments[1] === undefined ? 16 : arguments[1];

    var num = new _decimal2['default'](n);
    var one = _decimal2['default'].ONE;
    if (num.isNegative()) {
      return Number.NaN;
    }

    var exponent = num.exponent;
    if (num.lt(one) || num.gt(_decimal2['default'].exp(2))) {
      exponent -= exponent % 2;
      return math.sqrt(num.div(_decimal2['default'].exp(exponent)), digits + exponent).mul(_decimal2['default'].exp(exponent / 2)).toAccuracy(digits);
    }

    var accuracy = digits + 2;
    var half = new _decimal2['default'](0.5);
    var epsilon = _decimal2['default'].exp(-digits - 1);
    var root = new _decimal2['default'](Math.sqrt(num.sequence[0]));
    var error = root.mul(root, accuracy).sub(num);
    while (epsilon.lt(error.abs())) {
      root = root.add(num.div(root, accuracy)).mul(half);
      error = root.mul(root, accuracy).sub(num);
    }
    return root.toAccuracy(digits);
  },

  // Halley’s method to approximate the cube root
  cbrt: function cbrt(n) {
    var digits = arguments.length <= 1 || arguments[1] === undefined ? 16 : arguments[1];

    var num = new _decimal2['default'](n);
    var one = _decimal2['default'].ONE;
    if (num.isNegative()) {
      return math.cbrt(this.neg(), digits).neg();
    }

    var exponent = num.exponent;
    if (num.lt(one) || num.gt(_decimal2['default'].exp(3))) {
      exponent -= exponent % 3;
      return math.cbrt(num.div(_decimal2['default'].exp(exponent)), digits + exponent).mul(_decimal2['default'].exp(exponent / 3)).toAccuracy(digits);
    }

    var accuracy = digits + 3;
    var two = new _decimal2['default'](2);
    var epsilon = _decimal2['default'].exp(-digits - 1);
    var root = new _decimal2['default'](Math.cbrt(num.sequence[0]));
    var cube = math.pow(root, 3, accuracy);
    var error = cube.sub(num);
    while (epsilon.lt(error.abs())) {
      root = root.mul(cube.add(num.mul(two)).div(cube.mul(two).add(num), accuracy));
      cube = math.pow(root, 3, accuracy);
      error = cube.sub(num);
    }
    return root.toAccuracy(digits);
  },

  pow: function pow(b, n) {
    var digits = arguments.length <= 2 || arguments[2] === undefined ? 16 : arguments[2];

    var base = new _decimal2['default'](b);
    var num = new _decimal2['default'](n);
    var one = _decimal2['default'].ONE;
    if (base.eq(one) || num.isZero()) {
      return one;
    }
    if (num.isNegative()) {
      return math.pow(base, num.neg()).inv();
    }
    if (num.isInteger()) {
      var two = new _decimal2['default'](2);
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
      var integer = math.floor(num);
      return math.pow(base, integer).mul(math.pow(base, num.sub(integer)));
    }
  },

  sum: function sum() {
    var result = _decimal2['default'].ZERO;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
        values[_key] = arguments[_key];
      }

      for (var _iterator = values[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var value = _step.value;

        result = result.add(new _decimal2['default'](value));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator['return']) {
          _iterator['return']();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return result;
  },

  product: function product() {
    var result = _decimal2['default'].ONE;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _len2 = arguments.length, values = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        values[_key2] = arguments[_key2];
      }

      for (var _iterator2 = values[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var value = _step2.value;

        result = result.mul(new _decimal2['default'](value));
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2['return']) {
          _iterator2['return']();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    return result;
  }
});

exports['default'] = math;
module.exports = exports['default'];