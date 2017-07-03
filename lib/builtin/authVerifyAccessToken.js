'use strict'

const auth = require('../auth')

async function authVerifyAccessToken (payload) {
  const { token } = payload
  if (!token) throw new Error('Missing "token" parameter. Requires a JSON Web Token (JWT)')

  try {
    const result = auth.checkToken(token)
    const profile = result.data
    if (!profile || !profile.email) throw new Error('Token is missing profile data')

    return {
      reply: {
        topic: 'auth:success:token',
        payload: { }
      },
      session: {
        email: profile.email
      }
    }
  } catch (err) {
    return {
      reply: {
        topic: 'auth:failed',
        payload: { message: err.message }
      }
    }
  }
}

module.exports = authVerifyAccessToken
