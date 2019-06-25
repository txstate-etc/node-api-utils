const dotProp = require('dot-prop')

class RequestError extends Error {
  constructor (status, message) {
    super(message)
    this.status = status
    if (status === 400 && !message) this.message = 'Bad input.'
    if (status === 403 && !message) this.message = 'Not authorized.'
    if (status === 404 && !message) this.message = 'Not found.'
  }
}

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
      stringify = obj => dotProp.get(obj, key)
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

  static hashify (objArray, key = '_id') {
    return objArray.reduce(function (hash, obj) {
      let val
      if (typeof key === 'function') {
        val = key(obj)
      } else {
        // I often use this function with arrays of mongoose objects, which need to be converted to basic objects
        // before using dotProp, so I'll do that here
        const realobj = obj.toObject ? obj.toObject() : obj
        val = dotProp.get(realobj, key)
      }
      if (val) hash[val] = obj
      return hash
    }, {})
  }

  static csvescape (entry) {
    if (/[,\n"]/.test(entry)) return `"${entry.replace(/"/, '""')}"`
    return entry
  }
}

module.exports = Util
