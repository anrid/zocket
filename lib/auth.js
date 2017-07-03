'use strict'

const Jwt = require('jsonwebtoken')
const { config } = require('./config')

function createAccessTokenFromProfileData (data) {
  const allowAllEmails = config.emails[0] === '*'
  if (!allowAllEmails) {
    const isWhitelistedEmail = data.email && config.emails.includes(data.email)
    if (!isWhitelistedEmail) {
      let err = `Not a whitelisted email address: '${data.email}'`
      console.log('[auth] Error:', err)
      throw new Error(err)
    }
  }

  const allowAllDomains = config.domains[0] === '*'
  if (!allowAllDomains) {
    const isWhitelistedDomain = data.hd && config.domains.includes(data.hd)
    if (!isWhitelistedDomain) {
      let err = `Not a whitelisted domain: '${data.hd}'`
      console.log('[auth] Error:', err)
      throw new Error(err)
    }
  }

  const profile = {
    email: data.email,
    picture: data.picture,
    name: data.name,
    domain: data.hd
  }

  const accessToken = createToken(profile)

  return {
    accessToken,
    profile
  }
}

function createToken (data) {
  const exp = Math.floor(Date.now() / 1000) + (60 * 60)
  return Jwt.sign({ exp, data }, config.key)
}

function checkToken (token) {
  return Jwt.verify(token, config.key)
}

module.exports = {
  createAccessTokenFromProfileData,
  createToken,
  checkToken
}
