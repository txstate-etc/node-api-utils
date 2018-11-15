const express = require('express')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const db = require('./db')
const service = require('./service')
const app = service.app

app.use(express.json())

const origins = {}
const regexes = []
const addOrigin = function (origin) {
  if (origin instanceof RegExp) {
    regexes.push(origin)
  } else if (origin instanceof String) {
    if (origin.match(/^\w+:\/\//)) {
      origins[origin] = true
    } else {
      origins['http://' + origin] = true
      origins['https://' + origin] = true
    }
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
  const originPasses = (origin === req.protocol + '://' + req.hostname || checkOrigin(origin))

  // origin check to prevent XSRF
  if (req.method !== 'GET') {
    if (origin !== req.hostname && !originPasses) {
      return res.status(400).send('Failed origin check. Suspected Cross Site Request Forgery attack.')
    }
  }

  // CORS support
  if (originPasses && origin) res.set('Access-Control-Allow-Origin', origin)

  next()
})

if (fs.existsSync('./swagger.yml')) {
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
  addOrigin: addOrigin,
  start: async function () {
    await db.connect()
    if (process.env.NODE_ENV === 'development' && !db.isproduction()) {
      const fixtures = glob.sync('./fixtures/**/*.js')
      if (fixtures.length > 0) {
        await db.reset()
        await Promise.all(fixtures.map(async function (fixture) {
          try {
            await require(path.resolve(fixture))()
          } catch (e) {
            console.log(e)
          }
        }))
      }
    }
    await service.start()
  }
}
