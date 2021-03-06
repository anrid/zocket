'use strict'

const Assert = require('assert')
const Https = require('https')
const Express = require('express')
const WebSocketServer = require('uws').Server
const format = require('date-fns/format')
const { load } = require('./config')
const { log, niceStack } = require('./util')
const stats = require('./stats')
const throttle = require('./throttle')

function socketServer (opts) {
  const config = load(opts)

  const app = setupExpressApp(opts)

  const server = Https.createServer({
    cert: config.cert,
    key: config.key
  }, app)

  setupWebSocketServer(server, config.topics)

  server.listen(opts.port, opts.host, () => {
    log(`Zocket server running on ${opts.host}:${opts.port} ..`)
  })
}

function setupExpressApp (opts) {
  const app = Express()

  // Load connect middleware.
  const cors = require('cors')
  app.use(cors())

  app.set('port', opts.port || 9001)
  app.options('/', cors())

  app.get('/', function (req, res) {
    res.end(`Zocket Server: ${format(new Date())}`)
  })

  return app
}

function setupWebSocketServer (server, topics) {
  const wss = new WebSocketServer({ server, path: '/' })
  wss.on('connection', onConnection)

  // Rock the server heartbeat!
  setInterval(async () => {
    const count = await stats.heartbeat()
    const message = {
      target: 'ALL',
      topic: 'heartbeat',
      payload: { serverTime: Date.now(), count }
    }
    broadcast(wss, [message], { })
  }, 5000)

  function onConnection (socket) {
    socket.on('message', onMessage)

    async function onMessage (json) {
      stats.received() // Count message as received.

      const meta = {
        ms: 0,
        sid: socket.session ? socket.session.email : 'public'
      }

      try {
        const message = JSON.parse(json)
        Assert(typeof message === 'object', 'Message is not an object')
        meta.requestId = message.meta ? message.meta.requestId : null

        Assert(message.topic, 'Message missing topic')
        Assert(message.payload, 'Message missing payload')

        const topic = topics[message.topic]
        Assert(topic, `Message contains unsupported topic ${message.topic}`)
        meta.from = message.topic

        // Ensure we’ve have a session if the topic requires one.
        if (topic.requireSession !== false) {
          Assert(socket.session, `Topic ${message.topic} requires a valid session`)
        }

        // Handle API throttling.
        await throttle(meta.sid)

        log(`[socket] recv=1 topic=${message.topic} sid=${meta.sid}`)

        // Call the topic handler and deal with response, if there is one.
        stats.accepted(message.topic) // Count message as accepted.
        meta.ms = Date.now() // Start timer.

        const response = await topic.handler(message.payload)

        meta.ms = Date.now() - meta.ms // Stop timer.

        // Send a response if needed.
        if (isValidResponse(response)) {
          // Upgrade this socket connection (handshake) if a session is returned.
          if (response.session) {
            log(`ns=${response.session.email}`)
            socket.session = response.session
          }
          if (response.reply) {
            send(socket, response.reply.topic, response.reply.payload, meta)
          }
          if (response.broadcast) {
            broadcast(wss, response.broadcast, meta)
          }
        }
      } catch (err) {
        log(`[socket] error=${niceStack(err)}`)
        log(`[socket] errorSource=${json}`)
        send(socket, 'error', { message: err.message }, meta)
      }
    }
  }

  return wss
}

function isValidResponse (resp) {
  if (!resp || typeof resp !== 'object') return false

  if (resp.reply && typeof resp.reply === 'object') {
    if (!resp.reply.topic || !resp.reply.payload) {
      log('[socket] error=Invalid reply payload=' + JSON.stringify(resp.reply))
      resp.reply = null
    }
  }

  if (resp.broadcast && Array.isArray(resp.broadcast)) {
    if (!resp.broadcast.every(x => x.topic && x.payload)) {
      log('[socket] error=Invalid broadcast payload=' + JSON.stringify(resp.broadcast))
      resp.broadcast = null
    }
  }

  return resp.reply || resp.broadcast
}

function broadcast (wss, messages, meta) {
  meta.broadcast = true
  const map = messages.reduce((acc, message) => {
    const target = message.target || 'NONE'
    if (!acc[target]) acc[target] = []
    acc[target].push(message)
    return acc
  }, { })

  wss.clients.forEach(socket => {
    const messages = map[socket.userId || 'ALL']
    if (messages) {
      messages.forEach(message => (
        send(socket, message.topic, message.payload, meta)
      ))
    }
  })
}

function send (socket, topic, payload, meta) {
  const message = JSON.stringify({ topic, payload, meta })
  if (topic !== 'heartbeat') {
    log(`[socket] send=1 topic=${topic} ms=${meta.ms || 0} from=${meta.from || ''} size=${message.length} sid=${meta.sid}`)
  }
  socket.send(message)
}

module.exports = socketServer
