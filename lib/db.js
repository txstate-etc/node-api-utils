var mongoose = require('mongoose')
const glob = require('glob')
const path = require('path')
var util = require('./util.js')

// database config
var dbHost = process.env.DB_HOST || 'localhost'
var dbPort = process.env.DB_PORT || '27017'
var dbAuthdb = process.env.DB_AUTHDATABASE || ''
var dbUser = process.env.DB_USER || ''
var dbPw = process.env.DB_PASSWORD || ''
var dbName = process.env.DB_DATABASE || 'default_database'
var dbUserpasswordPrefix = ''
if (dbUser.length > 0 && dbPw.length > 0) dbUserpasswordPrefix = dbUser + ':' + dbPw + '@'
var dbAuthdbSuffix = ''
if (dbAuthdb.length > 0) dbAuthdbSuffix = '?authSource=' + dbAuthdb

const disableIndex = function () {
  mongoose.set('autoIndex', false)
}

// start up
const connect = async function () {
  let failures = 0
  while (true) {
    try {
      await mongoose.connect('mongodb://' + dbUserpasswordPrefix + dbHost + ':' + dbPort + '/' + dbName + dbAuthdbSuffix, {
        ssl: process.env.DB_SSL === 'true',
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 500,
        poolSize: 50,
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
      })
      console.log('DB connection alive')
      initcheckloop()
      break
    } catch (err) {
      failures++
      console.log('Connection to MongoDB failed. Trying again in 200 milliseconds.')
      if (failures > 4) console.error(err)
      await util.sleep(200)
    }
  }
}

const initcheckloop = async function (seconds = 5) {
  while (true) {
    await util.sleep(seconds * 1000)
    try {
      await mongoose.connection.db.listCollections()
    } catch (e) {
      console.log('txstate-node-utils: caught an error just trying to list collections, reconnecting mongoose')
      console.log(e)
      await mongoose.disconnect()
      connect()
      break
    }
  }
}

const usefixtures = function () {
  if (process.env.FIXTURES === 'false') return false
  if (dbName.toLowerCase().includes('production')) return false
  if (process.env.FIXTURES === 'true') return true
  return process.env.NODE_ENV === 'development'
}

const reset = async function () {
  const db = mongoose.connection.db
  const collections = await db.listCollections().toArray()
  await Promise.all(collections.map(async function (c) {
    if (!c.name.startsWith('system.')) {
      await db.collection(c.name).deleteMany({})
    }
  }))
}

const fixtures = async function () {
  const fixtures = glob.sync('?(.|src)/fixtures/**/*.js')
  if (fixtures.length > 0) {
    await reset()
    await Promise.all(fixtures.map(async function (fixture) {
      try {
        await require(path.resolve(fixture))()
      } catch (e) {
        console.log(e)
      }
    }))
  }
}

const migrationversion = async function (setversion) {
  const db = mongoose.connection.db
  if (setversion > 0) {
    await db.collection('txstatenodeutils').updateOne({ name: 'migrationversion' }, { $set: { value: setversion } }, { upsert: true })
    return setversion
  }
  const record = await db.collection('txstatenodeutils').findOne({ name: 'migrationversion' }) || { value: 0 }
  return record.value
}

const autoIndex = async function () {
  await Promise.all(mongoose.modelNames().map(async modelName => {
    await mongoose.model(modelName).createIndexes()
  }))
}

const disconnect = function () {
  return mongoose.disconnect()
}

module.exports = {
  disableIndex,
  connect,
  reset,
  fixtures,
  autoIndex,
  migrationversion,
  usefixtures,
  disconnect
}
