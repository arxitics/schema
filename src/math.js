
var math = {};

Object.assign(math, {
  pow() {
    
  },

  factorial(number) {
    if (number.isInterger()) {
      if (number < 0) {
        return Number.NaN;
      }
      if (number < 2) {
        return new Decimal(1);
      }
      return math.factorial(number - 1).multiply(new Decimal(number));
    }
  }
});

console.log(math.factorial(1000));
