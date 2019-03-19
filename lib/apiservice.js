const express = require('express')
const fs = require('fs')
const db = require('./db')
const service = require('./service')
const app = service.app

app.use(express.json())

const domains = {}
const regexes = []
const addDomain = function (domain) {
  if (domain instanceof RegExp) {
    regexes.push(domain)
  } else if (domain instanceof String) {
    domains[domain.replace(/^\w+:\/\//, '')] = true
  }
}
const checkOrigin = function (domain) {
  if (!domain) return true
  if (domains[domain]) return true
  for (let regex of regexes) {
    if (domain.match(regex)) return true
  }
}
app.use(function (req, res, next) {
  const origin = req.get('Origin') || ''
  const domain = origin.replace(/^\w+:\/\//, '')
  const passes = (domain === req.hostname || checkOrigin(domain))

  // origin check to prevent XSRF
  if (req.method !== 'GET' && !passes) {
    return res.status(400).send('Failed origin check. Suspected Cross Site Request Forgery attack.')
  }

  // CORS support
  if (passes && origin) res.set('Access-Control-Allow-Origin', origin)

  // Set no-cache on API endpoints
  // clients can manage their own caching strategy and avoid calling the API
  if (process.env.ALLOW_BROWSER_CACHE !== 'true') res.header('Cache-Control', 'no-cache')

  next()
})

if (fs.existsSync('./swagger.yml') && process.env.SKIP_SWAGGER !== 'true') {
  const swagger = require('swagger-ui-express')
  const yaml = require('yamljs')

  const swaggersetup = function () {
    const swaggerconfig = yaml.load('./swagger.yml')
    const swaggeroptions = {
      defaultModelExpandDepth: 2,
      defaultModelsExpandDepth: -1
    }
    return swagger.setup(swaggerconfig, { swaggerOptions: swaggeroptions })
  }

  let swaggersetupinstance = swaggersetup()
  let swaggermodified = fs.statSync('./swagger.yml').mtimeMs

  app.use('/docs', swagger.serve, function (req, res, next) {
    if (process.env.NODE_ENV === 'development') {
      const newmodified = fs.statSync('./swagger.yml').mtimeMs
      if (newmodified > swaggermodified) {
        swaggermodified = newmodified
        swaggersetupinstance = swaggersetup()
      }
    }
    swaggersetupinstance(req, res, next)
  })
}

module.exports = {
  app: app,
  addDomain: addDomain,
  start: async function (migrations = async () => null) {
    db.disableIndex()
    await db.connect()
    await migrations(db)
    if (db.usefixtures()) await db.fixtures()
    await db.autoIndex()
    await service.start()
  }
}
