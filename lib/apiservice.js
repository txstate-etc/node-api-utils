const express = require('express')
const logger = require('morgan')
const service = require('./service')
const app = service.app

app.use(logger('tiny'))
app.use(express.json())

const origins = {}
const regexes = []
const addOrigin = function (origin) {
  if (origin instanceof RegExp) {
    regexes.push(origin)
  } else {
    origins[origin] = true
  }
}
const checkOrigin = function (origin) {
  if (!origin) return true
  if (origins[origin]) return true
  for (let regex of regexes) {
    if (origin.match(regex)) return true
  }
}
app.use(function (req, res, next) {
  const origin = req.get('Origin')
  const originPasses = (origin === req.hostname || checkOrigin(origin))

  // origin check to prevent XSRF
  if (req.method !== 'GET') {
    if (origin !== req.hostname && !originPasses) {
      return res.status(400).send('Failed origin check. Suspected Cross Site Request Forgery attack.')
    }
  }

  // CORS support
  if (originPasses) res.set('Access-Control-Allow-Origin', origin)

  next()
})

module.exports = {
  app: app,
  addOrigin: addOrigin,
  start: service.start
}
