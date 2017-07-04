'use strict'

const Assert = require('assert')
const Fs = require('fs')
const Path = require('path')
const P = require('bluebird')
const Client = require('../lib/client')

async function test () {
  const client = await Client('wss://devbox.taskworld.com:9001', { requestTimeout: 2000 })

  // Echo.
  const resp1 = await client.request('echo', { some: 'value' })
  Assert(resp1.payload.some === 'value', 'Should get some=value')
  console.log('[client] Test 1 OK.')

  // Increment.
  const resp2 = await client.request('increment', { value: 10 })
  Assert(resp2.payload.value === 11, 'Should get value=11')
  console.log('[client] Test 2 OK.')

  // Increment (again).
  const resp3 = await client.request('increment', { value: 999 })
  Assert(resp3.payload.value === 1000, 'Should get value=1000')
  console.log('[client] Test 3 OK.')

  // Long running topic.
  try {
    await client.request('long', { })
    Assert.fail('Should hit a timeout!')
  } catch (err) {
    Assert(err instanceof P.TimeoutError, 'Should throw a TimeoutError')
    console.log('[client] Test 4 OK.')
  }

  // Authenticate Google ID token.
  const token = Fs.readFileSync(Path.resolve(__dirname, '../../test-id-token.txt'), 'utf8')
  const resp4 = await client.request('auth:verify-google-id-token', { token })
  Assert(resp4.topic === 'auth:success', 'Should successfully verify the Google id token')
  Assert(resp4.payload.credentials.accessToken, 'Should get a new JWT access token')
  const accessToken = resp4.payload.credentials.accessToken
  console.log('[client] Test 5 OK.')

  // Authenticate using JWT token lots of times, hitting the API throttle limits.
  const authStats = {
    ok: 0,
    maxCalls: 0,
    tooBusy: 0
  }

  for (let i = 0; i < 100; i++) {
    try {
      const r = await client.request('auth:verify-access-token', { token: accessToken })
      Assert(r.topic === 'auth:success:token', 'Should auth successfully')
      authStats.ok++
    } catch (e) {
      Assert(e.topic === 'error' && e.payload.message, 'Should get a socket error')
      const isMaxCallsPerSocketError = e.payload.message.includes('max calls per socket')
      const isServerTooBusyError = e.payload.message.includes('server too busy')
      Assert(isServerTooBusyError || isMaxCallsPerSocketError, `Should get either a API throttle error, got: ${JSON.stringify(e)}`)
      authStats.maxCalls += isMaxCallsPerSocketError ? 1 : 0
      authStats.tooBusy += isServerTooBusyError ? 1 : 0
    }
  }

  Assert(authStats.ok >= 5 && authStats.maxCalls >= 10 && authStats.tooBusy >= 70, 'Should successfully auth but then have lots of failed calls')
  console.log('[client] Test 6 OK. Stats:', authStats)

  client.close('We’re Done!')
}

test().catch(err => console.error('Error:', err))
