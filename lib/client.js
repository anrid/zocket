'use strict'

const P = require('bluebird')
const WebSocket = require('uws')

const _stats = {
  requestId: 0,
  requests: { }
}

function client (url, opts = { }) {
  return new P((resolve, reject) => {
    const ws = new WebSocket(url)
    ws.on('open', () => {
      console.log('[client] Connected.')
      resolve(ws)
    })

    ws.on('error', () => {
      console.log('[client] Error connecting!')
    })

    ws.on('message', json => {
      try {
        const data = JSON.parse(json)
        // console.log('Message:', data)
        if (data.meta && data.meta.requestId) {
          const f = _stats.requests[data.meta.requestId]
          if (f) {
            if (data.topic === 'error') {
              f.reject(data)
            } else {
              f.resolve(data)
            }
            delete _stats.requests[data.meta.requestId]
          }
        }
      } catch (err) {
        console.error('[client] Bad message:', err)
      }
    })

    ws.on('close', (code, message) => {
      console.log(`[client] Disconnected: code=${code} message=${message}.`)
    })

    ws.request = function request (topic, payload) {
      const requestId = ++_stats.requestId
      const meta = { requestId }
      ws.send(JSON.stringify({ topic, payload, meta }))
      const promise = new P((resolve, reject) => {
        _stats.requests[requestId] = { resolve, reject }
      })
      return promise.timeout(opts.requestTimeout || 3000)
    }
  })
}

module.exports = client
