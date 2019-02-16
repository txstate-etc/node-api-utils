const mysql = require('mysql2')

class Db {
  constructor () {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'mysql',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'secret',
      database: process.env.DB_DATABASE || 'mediaflo_encoder'
    }).promise()
  }

  async getval (...args) {
    const [ firstcolumn ] = Object.values(await this.getrow(...args))
    return firstcolumn
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
