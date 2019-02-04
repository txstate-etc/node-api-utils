const express = require('express')
require('express-async-errors')
const app = express()
const https = require('https')
const fsp = require('fs').promises
const logger = require('morgan')

app.disable('x-powered-by')
app.use(logger('tiny'))

var start = async function () {
  if (process.env.NODE_ENV === 'development' || process.env.SERVE_HTTP) {
    app.listen(80)
  } else {
    try {
      const [key, cert] = await Promise.all([
        fsp.readFile('/securekeys/private.key'),
        fsp.readFile('/securekeys/cert.pem')
      ])
      https.createServer({
        key: key,
        cert: cert
      }, app).listen(443)
    } catch (e) {
      // fall back to hosting on HTTP
      app.listen(80)
    }
  }
}

module.exports = {
  app: app,
  start: start
}
