const express = require('express')
const logger = require('morgan')
var app = require('./service')

app.use(logger('tiny'))
app.use(express.json())

module.exports = app
