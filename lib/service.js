const express = require('express')
require('express-async-errors')
const app = express()
var db = require('./db')
const https = require('https')
const fs = require('fs')

// start up
db.connect().then(function () {
  var privateKey = fs.readFileSync('/securekeys/private.key')
  var cert = fs.readFileSync('/securekeys/cert.pem')
  https.createServer({
    key: privateKey,
    cert: cert
  }, app).listen(443)
})

module.exports = app
