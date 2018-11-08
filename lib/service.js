const express = require('express')
require('express-async-errors')
const app = express()
const https = require('https')
const fs = require('fs')
const nodeutil = require('util')
const logger = require('morgan')

const readFile = nodeutil.promisify(fs.readFile)

app.disable('x-powered-by')
app.use(logger('tiny'))

var start = async function () {
  if (process.env.NODE_ENV === 'development' || process.env.SERVE_HTTP) {
    app.listen(80)
  } else {
    const [key, cert] = await Promise.all([
      readFile('/securekeys/private.key'),
      readFile('/securekeys/cert.pem')
    ])
    https.createServer({
      key: key,
      cert: cert
    }, app).listen(443)
  }
}

module.exports = {
  app: app,
  start: start
}
