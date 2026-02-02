'use strict'
const noop = () => {}
const { ERR_OPERATION_FAILED } = require('pear-errors')
const match = require('ptnm')

module.exports = function opwait(stream, pattern, onstatus) {
  if (typeof onstatus !== 'function') onstatus = noop
  if (typeof pattern === 'function') {
    onstatus = pattern
    pattern = null
  }

  return new Promise((resolve, reject) => {
    let final = null
    stream.once('error', reject)
    stream.on('end', () => {
      resolve(final)
    })
    stream.on('data', (status) => {
      const { data } = status
      if (match(status, { tag: 'error' })) {
        stream.destroy(
          ERR_OPERATION_FAILED(data.stack || data.message || 'Unknown', data)
        )
        return
      }
      if (match(status, { tag: 'final' })) final = data
      try {
        if (pattern && !match(status, pattern)) return
        const p = onstatus(status)
        if (typeof p?.catch === 'function') {
          p.catch((err) => stream.destroy(err))
        }
      } catch (err) {
        stream.destroy(err)
      }
    })
  })
}
