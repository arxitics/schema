'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _decimal = require('decimal');

var _decimal2 = _interopRequireDefault(_decimal);

var _math = require('math');

var _math2 = _interopRequireDefault(_math);

var integer = {};

Object.assign(integer, {
  rem: function rem(a, b) {
    var n = new _decimal2['default'](a);
    var d = new _decimal2['default'](b);
    if (!(n.isInteger() && d.isInteger())) {
      throw new TypeError('rem() invalid arguments');
    }
    if (n.lt(d)) {
      return n;
    }
    if (n.eq(d)) {
      return _decimal2['default'].ZERO;
    }

    var exponent = d.exponent;
    while (n.gt(d)) {
      var e = n.exponent - exponent - 1;
      var s = e > 0 ? d.mul(_decimal2['default'].exp(e)) : d;
      n = n.sub(s);
    }
    return n;
  },

  // Greatest Common Divisor (GCD)
  gcd: function gcd(a, b) {
    // Euclid's algorithm
    var n = new _decimal2['default'](a);
    var d = new _decimal2['default'](b);
    if (!(n.isInteger() && d.isInteger())) {
      throw new TypeError('gcd() invalid arguments');
    }
    while (!n.isZero()) {
      var r = n.clone();
      n = integer.rem(d, r);
      d = r;
    }
    return d;
  },

  // Lowest Common Multiple (LCM)
  lcm: function lcm(a, b) {
    return a.mul(b).div(integer.gcd(a, b)).toInteger();
  },

  // factorial n!
  factorial: function factorial(n) {
    var num = new _decimal2['default'](n);
    if (num.isInteger()) {
      var one = _decimal2['default'].ONE;
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
  factorial2: function factorial2(n) {
    var num = new _decimal2['default'](n);
    if (num.isInteger()) {
      var one = _decimal2['default'].ONE;
      var two = new _decimal2['default'](2);
      if (num.isNegative()) {
        return Number.NaN;
      }
      if (num.lte(one)) {
        return one;
      }
      if (num.isOdd()) {
        return integer.factorial2(num.sub(two)).mul(num);
      }

      var half = num.div(two).toInteger();
      return _math2['default'].pow(2, half).mul(integer.factorial(half));
    }
  },

  binomial: function binomial(n, k) {
    var one = _decimal2['default'].ONE;
    var m = new _decimal2['default'](n);
    var l = new _decimal2['default'](k);
    if (l.isNegative() || l.gt(m)) {
      return _decimal2['default'].ZERO;
    }

    // take advantage of symmetry
    var r = m.sub(l);
    if (l.gt(r)) {
      return integer.binomial(m, r);
    }

    var p = one;
    while (m.gt(r)) {
      p = p.mul(m);
      m = m.sub(one);
    }
    return p.div(integer.factorial(l)).toInteger();
  },

  multinomial: function multinomial() {
    var zero = _decimal2['default'].ZERO;
    var one = _decimal2['default'].ONE;
    var s = zero;
    var p = one;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
        values[_key] = arguments[_key];
      }

      for (var _iterator = values[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var value = _step.value;

        var v = new _decimal2['default'](value);
        if (v.isNegative()) {
          return zero;
        }
        s = s.add(v);
        p = p.mul(integer.binomial(s, v));
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

    return p;
  }
});

exports['default'] = integer;
module.exports = exports['default'];