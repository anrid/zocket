'use strict'

const P = require('bluebird')
const Os = require('os')

function getCpuAndMemUsageForProcess (processPattern) {
  return new P(resolve => {
    const exec = require('child_process').exec
    exec('ps aux | grep node', (error, stdout, stderr) => {
      if (error) {
        return console.error(`exec error: ${error}`)
      }
      const lines = stdout.trim().split(/[\r\n]+/).filter(x => x.length)
      const stats = lines.reduce((acc, x) => {
        const parts = x.trim().split(/[\t\s]+/)
        if (parts.length >= 10 && x.includes(processPattern)) {
          const cpuUsage = parseFloat(parts[2])
          const memUsage = parseFloat(parts[3])
          acc.cpu += cpuUsage
          acc.mem += memUsage
        }
        return acc
      }, { cpu: 0, mem: 0 })

      resolve(stats)
    })
  })
}

function getMeanCpuIdlePercentage () {
  const idles = []

  for (const cpu of Os.cpus()) {
    const total = Object.keys(cpu.times)
    .map(x => cpu.times[x])
    .reduce((acc, x) => acc + x, 0)
    idles.push(Math.round(100 * cpu.times['idle'] / total))
  }

  console.log('All:', idles)
  return idles.reduce((acc, x) => acc + x, 0) / idles.length
}

module.exports = {
  getCpuAndMemUsageForProcess,
  getMeanCpuIdlePercentage
}
