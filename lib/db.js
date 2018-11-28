var mongoose = require('mongoose')
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

// start up
const connect = async function () {
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
      break
    } catch (err) {
      console.log('trying again in 200 milliseconds')
      await util.sleep(200)
    }
  }
}

const isproduction = function () { // also returns true in qual
  return dbAuthdb.length || dbUser.length || dbName.toLowerCase().includes('production')
}

const reset = async function () {
  const db = mongoose.connection.db
  const collections = await db.listCollections().toArray()
  await Promise.all(collections.map(async function (c) {
    if (!c.name.startsWith('system.')) await db.collection(c.name).deleteMany({})
  }))
}

const dropCollection = async function (collection) {
  const db = mongoose.connection.db
  await new Promise((resolve, reject) => {
    db.dropCollection(collection, (err, result) => {
      if (err) {
        reject(err.message)
        return
      }
      resolve(result)
    })
  }).catch(err => console.log(err))
}

const close = function () {
  return mongoose.disconnect()
}

module.exports = {
  connect: connect,
  reset: reset,
  dropCollection: dropCollection,
  isproduction: isproduction,
  disconnect: close
}
