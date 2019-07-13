const express = require('express')
require('express-async-errors')
const app = express()
const http = require('http')
const https = require('https')
const fsp = require('fs').promises
const logger = require('morgan')

app.disable('x-powered-by')
app.use(logger('tiny'))

// Provide a simple firewall by setting comma-separated WHITELIST_IP4
// or WHITELIST_IP6 environment variables
const whitelist = []
whitelist.concat((process.env.WHITELIST_IP4 || '').split(',').map(ip => ip.trim()).filter(ip => ip).map(ip => `::ffff:${ip}`))
whitelist.concat((process.env.WHITELIST_IP6 || '').split(',').map(ip => ip.trim()).filter(ip => ip))
if (whitelist.length) whitelist.push('::ffff:127.0.0.1') // allow localhost for health checks
app.use((req, res, next) => {
  if (whitelist.length) {
    const nearestip = req.ips.length ? req[req.ips.length - 1] : req.ip
    if (!whitelist.includes(nearestip)) return res.status(403).send()
  }
  next()
})

var start = async function () {
  if (process.env.NODE_ENV === 'development' || process.env.SERVE_HTTP === 'true') {
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
      // redirect 80 to 443
      http.createServer((req, res) => {
        res.writeHead(301, { Location: 'https://' + req.headers.host + req.url })
        res.end()
      })
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
