const express = require('express')
require('express-async-errors')
const app = express()
var db = require('./db')
const https = require('https')
const fs = require('fs')
const nodeutil = require('util')

const readFile = nodeutil.promisify(fs.readFile)

// start up
var start = async function () {
  let [key, cert] = await Promise.all([
    readFile('/securekeys/private.key'),
    readFile('/securekeys/cert.pem'),
    db.connect()
  ])
  https.createServer({
    key: key,
    cert: cert
  }, app).listen(443)
}

module.exports = {
  app: app,
  start: start
}
