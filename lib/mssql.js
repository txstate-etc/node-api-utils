const mssql = require('mssql')
const _ = require('./util')

class Db {
  constructor (config = {}) {
    this.pool = new mssql.ConnectionPool({
      server: config.host || config.server || process.env.MSSQL_HOST || process.env.DB_HOST || 'mssql',
      domain: config.domain || process.env.MSSQL_DOMAIN || process.env.DB_DOMAIN || 'dev',
      user: config.user || process.env.MSSQL_USER || process.env.DB_USER || 'sa',
      password: config.password || config.pw || process.env.MSSQL_PASS || process.env.DB_PASS || 'secret',
      database: config.database || process.env.MSSQL_DATABASE || process.env.DB_DATABASE || 'default_database',
      port: config.port || process.env.MSSQL_PORT || process.env.DB_PORT || 1433
    })
  }

  createAnother (config = {}) {
    return new Db(config)
  }

  async wait () {
    if (this.connected) return
    let errorcount = 0
    while (true) {
      try {
        await this.pool.connect()
        this.connected = true
        return
      } catch (error) {
        if (errorcount > 2) console.error(error.message)
        errorcount++
        // sleep and try again
        console.log('Unable to connect to MSSQL database, trying again in 2 seconds.')
        await _.sleep(2000)
      }
    }
  }

  async _query (sql, bindvalues = {}, stream = false) {
    await this.wait()
    const req = this.pool.request()
    for (const [key, val] of Object.entries(bindvalues)) {
      req.input(key, val)
    }
    return req.query(sql)
  }

  async getval (...args) {
    const row = await this.getrow(...args)
    if (row) return Object.values(await this.getrow(...args))[0]
    return undefined
  }

  async getrow (...args) {
    const [firstresult] = await this.getall(...args)
    return firstresult
  }

  async getall (...args) {
    const response = await this._query(...args)
    return response.recordset
  }

  async execute (...args) {
    await this._query(...args)
    return true
  }

  async update (...args) {
    const response = await this._query(...args)
    return response.rowsAffected
  }

  async insert (sql, bindvalues) {
    return this.getval(sql + '; SELECT SCOPE_IDENTITY() AS id', bindvalues)
  }

  async stream (sql, bindvalues, rowhandler) {
    // allow stream(sql, handler) without bindvalues
    if (typeof bindvalues === 'function') rowhandler = bindvalues

    await this.wait()

    return new Promise((resolve, reject) => {
      let abort = false
      const req = this.pool.request()
      req.stream = true
      for (const [key, val] of Object.entries(bindvalues)) {
        req.input(key, val)
      }
      req.query(sql)
      req.on('row', async row => {
        if (abort) return
        try {
          const resp = rowhandler(row)
          if (resp && resp.then) { // rowhandler returns promises
            req.pause()
            await resp
            req.resume()
          }
        } catch (e) {
          // if rowhandler throws an error, allow the connection to finish, but
          // prevent further execution
          req.resume()
          abort = true
          reject(e)
        }
      })
      req.on('error', err => reject(err))
      req.on('done', resolve)
    })
  }
}

module.exports = new Db()
