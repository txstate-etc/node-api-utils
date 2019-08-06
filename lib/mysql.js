const mysql = require('mysql2')

class Db {
  constructor () {
    const mypool = mysql.createPool({
      host: process.env.MYSQL_HOST || process.env.DB_HOST || 'mysql',
      user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_PASS || process.env.DB_PASS || 'secret',
      database: process.env.MYSQL_DATABASE || process.env.DB_DATABASE || 'default_database',
      // client side connectTimeout is unstable in mysql2 library
      // it throws an error you can't catch and crashes node
      // best to leave this at 0 (disabled)
      connectTimeout: 0,
      ...(process.env.MYSQL_SKIPTZFIX ? { timezone: 'Z' } : {})
    })
    if (!process.env.MYSQL_SKIPTZFIX) {
      mypool.on('connection', function (connection) {
        connection.query('SET time_zone="UTC"')
      })
    }
    this.pool = mypool.promise()
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

  async stream (...args) {
    const sql = args[0]
    const bind = args.slice(1, -1)
    const rowhandler = args.slice(-1)[0]
    const conn = await this.pool.getConnection()

    return new Promise((resolve, reject) => {
      let abort = false
      const req = conn.query(sql, bind)
      req.on('result', async row => {
        if (abort) return
        try {
          const resp = rowhandler(row)
          if (resp && resp.then) { // rowhandler returns promises
            conn.pause()
            await resp
            conn.resume()
          }
        } catch (e) {
          // if rowhandler throws an error, allow the connection to finish, but
          // prevent further execution
          conn.resume()
          abort = true
          reject(e)
        }
      })
      req.on('error', err => {
        this.pool.releaseConnection(conn)
        reject(err)
      })
      req.on('end', () => {
        this.pool.releaseConnection(conn)
        resolve()
      })
    })
  }
}

module.exports = new Db()
