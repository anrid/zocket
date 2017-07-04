'use strict'

const Https = require('https')
const URL = require('url')
const Zlib = require('zlib')
const format = require('date-fns/format')

function httpsGet (url) {
  console.log(`[HTTPS GET] Fetching: ${url}`)
  const headers = {
    'accept-encoding': 'gzip,deflate'
  }
  const options = Object.assign(URL.parse(url), { headers })

  return new Promise((resolve, reject) => {
    Https.get(options, (res) => {
      const encoding = res.headers['content-encoding']
      console.log(`[HTTPS GET] Status code: ${res.statusCode} (encoding: ${encoding})`)

      const chunks = []
      const result = {
        statusCode: res.statusCode,
        data: ''
      }

      res.on('data', d => {
        chunks.push(d)
      })

      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        if (encoding === 'gzip') {
          Zlib.gunzip(buffer, (err, decoded) => {
            if (err) throw err
            result.data = decoded.toString()
            resolve(result)
          })
        } else if (encoding === 'deflate') {
          Zlib.inflate(buffer, (err, decoded) => {
            if (err) throw err
            result.data = decoded.toString()
            resolve(result)
          })
        } else {
          result.data = buffer.toString()
          resolve(result)
        }
      })
    })
    .on('error', e => {
      console.error('[HTTPS GET] Error:', e)
      reject(e)
    })
  })
}

function log (...s) {
  console.log(`${format(new Date())}`, ...s)
}

function niceStack (err) {
  if (!err.stack) return ''
  return err.stack.toString()
  .split(`\n`)
  .filter(x => !x.includes('node_modules/'))
  .join(`\n`)
}

module.exports = {
  httpsGet,
  log,
  niceStack
}
