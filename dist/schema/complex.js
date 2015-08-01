
// Constructor of complex numbers
'use strict';

function Complex(real, imaginary) {
  if (Number.isNaN(real) || Number.isNaN(imaginary)) {
    throw new TypeError('Invalid parameters for Complex class');
  }
  this.real = real;
  this.imaginary = imaginary;
}

Complex._format = /^(\d+)\s*\+\s*(\d+)(i|I)$/;

Complex.parse = function (string) {
  try {
    var matches = Complex._format.exec(string);
    return new Complex(Number.parseInt(matches[1]), Number.parseInt(matches[2]));
  } catch (error) {
    throw new TypeError('Invalid input for Complex class');
  }
};

Complex.prototype.constructor = Complex;

Complex.prototype.real = undefined.real;

Complex.prototype.imaginary = undefined.imaginary;

// Absolute value of a complex number
Complex.prototype.abs = function () {
  return Math.hypot(this.real, this.imaginary);
};

// Argument of a complex number
Complex.prototype.arg = function () {
  return Math.atan2(this.imaginary, this.real);
};

Complex.prototype.conjugate = function () {
  return new Complex(this.real, -this.imaginary);
};

// Complex addition
Complex.prototype.add = function (that) {
  return new Complex(this.real + that.real, this.imaginary + that.imaginary);
};

// Complex multiplication
Complex.prototype.multiply = function (that) {
  // Gauss's algorithm
  var s = Math.imul(this.real + this.imaginary, that.real);
  var t = Math.imul(this.real, that.imaginary - that.real);
  var u = Math.imul(this.imaginary, that.real + that.imaginary);
  return new Complex(s - u, s + t);
};

Complex.prototype.equals = function (that) {
  return that.constructor === Complex && that.real === this.real && that.imaginary === that.imaginary;
};

Complex.prototype.toString = function () {
  return this.real + '+' + this.imaginary + 'i';
};

Complex.prototype.toJSON = Complex.prototype.toString;

var z1 = new Complex(123, 456);
var z2 = Complex.parse('789+987i');
console.log(z1.toString());
console.log(z2.toString());
console.log(z1.add(z2).toJSON());
console.log(JSON.stringify(z1.multiply(z2)));