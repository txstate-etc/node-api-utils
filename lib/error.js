class RequestError extends Error {
  constructor (status, message) {
    super(message)
    this.status = status
    if (status === 400 && !message) this.message = 'Bad input.'
    if (status === 403 && !message) this.message = 'Not authorized.'
    if (status === 404 && !message) this.message = 'Not found.'
  }
}

module.exports = {
  RequestError
}
