'use strict'

const THROTTLE_PERIOD = 1000
const THROTTLE_API_CALLS_PER_SOCKET = 5
const THROTTLE_API_CALLS_TOTAL = 20

const _stats = {
  throttle: { }
}

function throttle (id) {
  const t = _stats.throttle
  const now = Date.now()

  if (!t.total) {
    t.total = {
      count: 0,
      last: Date.now()
    }
  }
  if (now - t.total.last < THROTTLE_PERIOD) {
    t.total.count++
    if (t.total.count > THROTTLE_API_CALLS_TOTAL) {
      throw new Error('API server too busy')
    }
  } else {
    t.total.count = 0
    t.total.last = Date.now()
  }

  if (!t[id]) {
    t[id] = {
      count: 0,
      last: Date.now()
    }
  }
  if (now - t[id].last < THROTTLE_PERIOD) {
    t[id].count++
    if (t[id].count > THROTTLE_API_CALLS_PER_SOCKET) {
      throw new Error('API max calls per socket exceeded')
    }
  } else {
    t[id].count = 0
    t[id].last = Date.now()
  }

  return true
}

module.exports = throttle
