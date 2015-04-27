

// 

 "1+2*x-x^3"

var tree = {
  structure: 'simplified',
  node: {
    type: 'operator',
    value: 'plus'
  },
  children: [
    {
      structure: 'simplified',
      node: {
        type: 'integer',
        value: 1
      }
    },
    {
      structure: 'simplified',
      node: {
        type: 'operator',
        value: 'times'
      },
      children: [
        {
          type: 'integer',
          value: 2
        },
        {
          type: 'symbol',
          value: Symbol.for('x')
        }
      ]
    },
    {
      structure: 'simplified',
      node: {
        type: 'operator',
        value: 'times'
      },
      children: [
        {
          structure: 'simplified',
          node: {
            type: 'integer',
            value: -1
          }
        },
        {
          structure: 'simplified',
          node: {
            type: 'operator',
            value: 'power'
          },
          children: [
            {
              type: 'symbol',
              value: Symbol.for('x')
            },
            {
              type: 'integer',
              value: 3
            }
          ]
        }
      ]
    }
  ]
};
