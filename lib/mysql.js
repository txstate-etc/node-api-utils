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

  getval (...args) {
    const [ firstcolumn ] = Object.values(this.getrow(...args))
  }

  async getrow (...args) {
    const [ firstresult ] = await this.getall(...args)
    return firstresult
  }

  async getall (sql, ...bind) {
    const [results, fields] = await pool.query(sql, bind)
    return results
  }

  async execute (sql, ...bind) {
    const [results, fields] = await pool.query(sql, bind)
    return results.changedRows
  }
}

module.exports = new Db()