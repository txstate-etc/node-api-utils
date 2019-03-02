const newerThan = (dt, seconds) => new Date() - dt < seconds * 1000
const _ = require('./util')

class Cache {
  constructor (fetcher, options = {}) {
    this.fetcher = fetcher
    this.options = {
      freshseconds: options.freshseconds || 5 * 60,
      validseconds: options.validseconds || 10 * 60,
      invalidator: options.invalidator,
      invalidatorseconds: options.invalidatorseconds || 10
    }
    this.storage = {}
    this.active = {}
    this.lastinvalidation = new Date()
    this._cleanup()
  }

  invalidate (key) {
    if (!key) this.storage = {}
    else delete this.storage[key]
  }

  async _cleanup () {
    await _.sleep(this.options.invalidatorseconds * 1000)
    try {
      if (this.options.invalidator) {
        const lastinvalidationsafe = new Date(this.lastinvalidation.getTime() - 1000)
        this.lastinvalidation = new Date()
        const toinvalidate = await this.options.invalidator(lastinvalidationsafe)
        if (toinvalidate === true) this.invalidate()
        else if (Array.isArray(toinvalidate)) {
          for (const key of toinvalidate) {
            this.invalidate(key)
          }
        }
      }
    } finally {
      for (const [key, stored] of Object.entries(this.storage)) {
        if (!this.valid(stored)) this.invalidate(key)
      }
    }
    this._cleanup()
  }

  async refresh (key) {
    if (this.active[key]) return this.active[key]
    this.active[key] = this.fetcher(key)
    try {
      const data = await this.active[key]
      this.storage[key] = { fetched: new Date(), data }
      return data
    } finally {
      delete this.active[key]
    }
  }

  fresh (stored) {
    return newerThan(stored.fetched, this.options.freshseconds)
  }

  valid (stored) {
    return newerThan(stored.fetched, this.options.validseconds)
  }

  async fetch (key) {
    const stored = this.storage[key]
    if (stored) {
      if (this.fresh(stored)) {
        return stored.data
      } else if (this.valid(stored)) {
        // background task - do NOT await the refresh
        this.refresh(key).catch(error => {
          // since this is a background refresh, errors are invisible to
          // the cache client
          // client will receive errors normally on the first call or
          // after the stored value goes invalid
          console.log(error)
        })
        return stored.data
      }
    }
    return this.refresh(key)
  }
}

module.exports = Cache
