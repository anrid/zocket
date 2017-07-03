'use strict'

async function echo (payload) {
  return {
    reply: {
      topic: 'echo',
      payload
    }
  }
}

module.exports = echo
