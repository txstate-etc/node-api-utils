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
}

module.exports = Util
