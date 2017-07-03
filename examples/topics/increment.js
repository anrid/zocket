'use strict'

async function increment ({ value }) {
  return {
    reply: {
      topic: 'increment',
      payload: { value: value + 1 }
    }
  }
}

module.exports = increment
