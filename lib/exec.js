const childprocess = require('child_process')
const _ = require('./util')

module.exports = function (cmd, handler) {
  return new Promise((resolve, reject) => {
    let output = ''
    const child = childprocess.spawn(_.toArray(cmd)[0], _.toArray(cmd).slice(1))
    child.stdout.on('data', chunk => {
      const text = chunk.toString('utf8')
      output += text
      if (typeof handler === 'function') handler(text, 'stdout')
    })
    child.stderr.on('data', chunk => {
      const text = chunk.toString('utf8')
      output += text
      if (typeof handler === 'function') handler(text, 'stderr')
    })
    child.on('close', code => {
      if (code) reject(output)
      else resolve(output)
    })
  })
}
