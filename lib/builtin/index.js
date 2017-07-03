
module.exports = {
  'time': { handler: require('./time'), requireSession: false },
  'time:broadcast': { handler: require('./timeBroadcast'), requireSession: false },
  'auth:verify-google-id-token': { handler: require('./authVerifyGoogleIdToken'), requireSession: false },
  'auth:verify-access-token': { handler: require('./authVerifyAccessToken'), requireSession: false }
}
