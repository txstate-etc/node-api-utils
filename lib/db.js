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
var connect = async function () {
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

var close = function () {
  return mongoose.disconnect()
}

module.exports = {
  connect: connect,
  disconnect: close
}
