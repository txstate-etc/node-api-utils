const dotProp = require('dot-prop')
const pLimit = require('p-limit')

class Util {
  static isBlank (str) {
    return !str || !str.trim || str.trim().length === 0
  }
  static isHex (str) {
    return !this.isBlank(str) && !str.match(/[^a-f0-9]/)
  }
  static sleep (milliseconds) {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds)
    })
  }

  static ucfirst (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  static isEmpty (obj) {
    if (typeof obj === 'undefined' || obj === null) return true
    if (Array.isArray(obj)) return !obj.length
    if (typeof obj.isEmpty === 'function') return obj.isEmpty()
    if (typeof obj.size === 'function') return !obj.size()
    if (typeof obj.length === 'number') return !obj.length
    if (typeof obj === 'string') return Util.isBlank(obj)
    if (typeof obj === 'object') return !Object.keys(obj).length
    return !obj
  }

  static toArray (obj) {
    if (Array.isArray(obj)) return obj
    if (typeof obj === 'undefined' || obj === null) return []
    return [obj]
  }

  static concat () {
    const ret = []
    for (const arg of arguments) {
      ret.push(...this.toArray(arg))
    }
    return ret
  }

  static unique (arr, stringify = JSON.stringify) {
    if (typeof stringify !== 'function') {
      const key = stringify
      stringify = obj => this.dp(obj, key)
    }
    const seen = {}
    const ret = []
    for (const e of arr) {
      const s = stringify(e)
      if (!seen[s]) {
        ret.push(e)
        seen[s] = true
      }
    }
    return ret
  }

  static intersect () {
    let stringify, arrays
    if (typeof arguments[0] === 'function') {
      stringify = arguments[0]
      arrays = arguments.slice(1)
    } else if (typeof arguments[arguments.length - 1] === 'function') {
      stringify = arguments[arguments.length - 1]
      arrays = arguments.slice(0, -1)
    } else {
      stringify = JSON.stringify
      arrays = arguments
    }
    const seen = {}
    for (const e of arrays[0]) {
      const s = stringify(e)
      seen[s] = 1
    }
    const ret = []
    for (const e of arrays[1]) {
      const s = stringify(e)
      if (seen[s] === 1) {
        ret.push(e)
        seen[s] = 2
      }
    }
    return arrays.length > 2 ? this.intersect(stringify, ret, ...arrays.slice(2)) : ret
  }

  // I often want to get properties from a mongoose object, but
  // dotProp does not work on them, so here is a convenience function
  // that does
  static dp (obj, key) {
    const usableObject = obj.toObject ? obj.toObject() : obj
    return dotProp.get(usableObject, key)
  }

  static hashify (objArray, key = '_id') {
    return objArray.reduce((hash, obj) => {
      let val
      if (typeof key === 'function') {
        val = key(obj)
      } else {
        val = this.dp(obj, key)
      }
      if (val) hash[val] = obj
      return hash
    }, {})
  }

  static csvescape (entry) {
    if (/[,\n"]/.test(entry)) return `"${entry.replace(/"/, '""')}"`
    return entry
  }

  static batch (items, run, batchsize = 10) {
    const limit = pLimit(batchsize)
    const qitems = items.map(item => limit(() => run(item)))
    return Promise.all(qitems)
  }

  static isNetID (netid) {
    return /^\w+\d+$/i.test(netid)
  }
}

module.exports = Util
