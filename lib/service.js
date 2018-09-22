const express = require('express')
require('express-async-errors')
const app = express()
var db = require('./db')

// server config
var server_port = parseInt(process.env.PORT, 10) || 80;

// start up
db.connect().then(function () {
  app.listen(server_port)
})

module.exports = app
