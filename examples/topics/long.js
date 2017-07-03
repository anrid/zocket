'use strict'

const P = require('bluebird')

async function long () {
  // Delay 2 sec.
  await P.delay(2000)

  return {
    reply: {
      topic: 'long',
      payload: { message: 'Done!' }
    }
  }
}

module.exports = long
