'use strict'

const { log } = require('./util')
const Cpu = require('./cpu')

const _stats = {
  received: 0,
  accepted: 0,
  lastAccepted: 0,
  heartbeat: 0,
  lastHeartbeat: Date.now(),
  lastCallsPerSec: 0,
  topics: { }
}

async function heartbeat () {
  ++_stats.heartbeat

  const usage = await Cpu.getCpuAndMemUsageForProcess('.js')

  // Calc stats.
  const now = Date.now()
  const active = _stats.accepted - _stats.lastAccepted
  const secs = (now - _stats.lastHeartbeat) / 1000
  const callsPerSec = active / secs

  // Print if there’s currently CPU activity.
  if (usage.cpu) {
    log(
      `[server] ` +
      `cps: ${callsPerSec.toFixed(2)} | ` +
      `cpu: ${usage.cpu.toFixed(2)} | ` +
      `mem: ${usage.mem.toFixed(2)} | ` +
      `msg: ${active} active (${_stats.accepted} / ${_stats.received} accepted) | ` +
      `hb: ${_stats.heartbeat}`
    )
  }

  if (!callsPerSec && _stats.lastCallsPerSec) {
    log('[server] Topic stats:', Object.keys(_stats.topics).map(x => `${x}=${_stats.topics[x]}`).join(' '))
  }

  // Keep track of things.
  _stats.lastAccepted = _stats.accepted
  _stats.lastHeartbeat = now
  _stats.lastCallsPerSec = callsPerSec

  return _stats.heartbeat
}

module.exports = {
  heartbeat,
  received: () => _stats.received++,
  accepted: topic => {
    _stats.accepted++
    if (!_stats.topics[topic]) _stats.topics[topic] = 0
    _stats.topics[topic]++
  }
}
