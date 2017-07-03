'use strict'

const auth = require('../auth')
const { httpsGet } = require('../util')

async function authVerifyGoogleIdToken (payload) {
  const { token } = payload
  if (!token) throw new Error('Missing "token" parameter. Requires a Google OAuth2 id token')

  try {
    const result = await httpsGet(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`)
    if (result.statusCode !== 200) throw new Error('Invalid token')

    const data = JSON.parse(result.data)
    const credentials = auth.createAccessTokenFromProfileData(data)

    return {
      reply: {
        topic: 'auth:success',
        payload: { credentials }
      },
      session: {
        email: credentials.profile.email
      }
    }
  } catch (err) {
    console.log('Auth error:', err)
    return {
      reply: {
        topic: 'auth:failed',
        payload: { message: err.message }
      }
    }
  }
}

module.exports = authVerifyGoogleIdToken
