const mssql = require('mssql')
const _ = require('./util')

class Db {
  constructor (config = {}) {
    this.pool = mssql.ConnectionPool({
      server: config.host || config.server || process.env.MSSQL_HOST || process.env.DB_HOST || 'mssql',
      domain: config.domain || process.env.MSSQL_DOMAIN || process.env.DB_DOMAIN || 'dev',
      user: config.user || process.env.MSSQL_USER || process.env.DB_USER || 'sa',
      password: config.password || config.pw || process.env.MSSQL_PASS || process.env.DB_PASS || 'secret',
      database: config.database || process.env.MSSQL_DATABASE || process.env.DB_DATABASE || 'default_database'
    })
  }

  createAnother (config = {}) {
    return new Db(config)
  }

  async wait () {
    if (this.connected) return
    while (true) {
      try {
        await this.pool.connect()
        this.connected = true
        return
      } catch (error) {
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
      const req = this.pool.request()
      req.stream = true
      for (const [key, val] of Object.entries(bindvalues)) {
        req.input(key, val)
      }
      req.query(sql)
      req.on('row', rowhandler)
      req.on('error', err => reject(err))
      req.on('done', resolve)
    })
  }
}

module.exports = new Db()
