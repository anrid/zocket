'use strict'

async function timeBroadcast (payload) {
  return {
    broadcast: [
      {
        target: 'ALL',
        topic: 'time:broadcast',
        payload: { serverTime: Date.now() }
      }
    ]
  }
}

module.exports = timeBroadcast
