const mysql = require('mysql2')

class Db {
  constructor () {
    const mypool = mysql.createPool({
      host: process.env.DB_HOST || 'mysql',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'secret',
      database: process.env.DB_DATABASE || 'default_database',
      timezone: 'Z'
    })
    mypool.on('connection', function (connection) {
      connection.query('SET time_zone="UTC"')
    })
    this.pool = mypool.promise()
  }

  async getval (...args) {
    const row = await this.getrow(...args)
    if (row) return Object.values(await this.getrow(...args))[0]
    return undefined
  }

  async getrow (...args) {
    const [ firstresult ] = await this.getall(...args)
    return firstresult
  }

  async getall (sql, ...bind) {
    const [results] = await this.pool.query(sql, bind)
    return results
  }

  async execute (sql, ...bind) {
    await this.pool.query(sql, bind)
    return true
  }

  async update (sql, ...bind) {
    const [results] = await this.pool.query(sql, bind)
    return results.changedRows
  }

  async insert (sql, ...bind) {
    const [results] = await this.pool.query(sql, bind)
    return results.insertId
  }
}

module.exports = new Db()
