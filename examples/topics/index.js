'use strict'

module.exports = {
  'echo': { handler: require('./echo'), requireSession: false },
  'increment': { handler: require('./increment'), requireSession: false },
  'long': { handler: require('./long'), requireSession: false }
}
