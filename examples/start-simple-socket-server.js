'use strict'

const Path = require('path')
const server = require('../lib/server')

server({
  host: 'devbox.taskworld.com',
  port: 9001,
  cert: Path.resolve(__dirname, '../../keys/tw/cert.crt'),
  key: Path.resolve(__dirname, '../../keys/tw/cert.key'),
  topics: Path.join(__dirname, 'topics'),
  emails: '*',
  domains: 'taskworld.com'
})
