'use strict'

async function time (payload) {
  return {
    reply: {
      topic: 'time',
      payload: { serverTime: Date.now() }
    }
  }
}

module.exports = time
