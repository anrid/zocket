'use strict'

const Assert = require('assert')
const Fs = require('fs')
const Path = require('path')
const P = require('bluebird')
const Client = require('../lib/client')

async function test () {
  const client = await Client('wss://devbox.taskworld.com:9001', { requestTimeout: 500 })

  // Echo.
  const resp1 = await client.request('echo', { some: 'value' })
  Assert(resp1.payload.some === 'value', 'Should get some=value')
  console.log('[client] Test 1 OK.')

  // Increment.
  const resp2 = await client.request('increment', { value: 10 })
  Assert(resp2.payload.value === 11, 'Should get value=11')
  console.log('[client] Test 2 OK.')

  // Increment.
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
  const { accessToken } = resp4.payload.credentials
  Assert(accessToken, 'Should get an access token')
  console.log('[client] Test 5 OK.')

  const resp5 = await client.request('auth:verify-access-token', { token: accessToken })
  Assert(resp5.topic === 'auth:success:token', 'Should auth successfully')
  console.log('[client] Test 6 OK.')

  client.close('We’re Done!')
}

test().catch(err => console.error('Error:', err))
