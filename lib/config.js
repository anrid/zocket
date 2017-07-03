'use strict'

const Assert = require('assert')
const Fs = require('fs')
const { log } = require('./util')

const config = {
  emails: [],
  domains: []
}

function load (opts) {
  Assert(opts.cert, 'Missing cert parameter. Set to a valid SSL certificate, e.g. server.crt.')
  Assert(opts.key, 'Missing key parameter. Set to a valid SSL certificate private key, e.g. server.key.')
  Assert(opts.host, 'Missing host parameter. Set to a host that resolves to this machine and matches the SSL certificate, e.g. dev.mydomain.com.')
  Assert(opts.port, 'Missing port parameter. Set to port to listen on, e.g. 9001.')
  Assert(opts.topics, 'Missing topics parameter. Set to a directory with topic handlers, e.g. api/topics.')

  if (opts.emails) {
    config.emails = opts.emails.trim().toLowerCase().split(/\s*,\s*/)
    console.log(`[config] Whitelisted emails: ${config.emails}`)
  }
  if (opts.domains) {
    config.domains = opts.domains.trim().toLowerCase().split(/\s*,\s*/)
    console.log(`[config] Whitelisted domains: ${config.domains}`)
  }

  config.cert = Fs.readFileSync(opts.cert)
  config.key = Fs.readFileSync(opts.key)

  // Load built-in topics first.
  config.topics = require('./builtin')
  // Merge user topics.
  Object.assign(config.topics, require(opts.topics))

  log(`[config] Loaded ${Object.keys(config.topics).length} topics.`)

  return config
}

module.exports = {
  load,
  config
}
