const _ = require('./util')

class Mongoose {
  // This function makes it easier to populate things without knowing in advance
  // whether we have a document, a query, or an array of documents
  async populate (target, populates = []) {
    if (_.isEmpty(populates) || _.isEmpty(target)) return target
    if (Array.isArray(target) && target.length > 0) {
      // we got an array of documents, we need to use Model.populate
      // filter out anything that isn't a mongoose model
      const applicable = target.filter(t => t.populate)
      // assume they are all the same model type, pull out the first object as a representative
      const Model = applicable[0].constructor
      await Model.populate(applicable, populates)
      return target
    }
    if (target.populate) {
      // we either have a single document or a query, either way we need
      // to chain populate commands for each populate in our populates parameter
      const chained = populates.reduce((acc, p) => acc.populate(p), target)

      // we got a document
      if (target.execPopulate) return chained.execPopulate()

      // we got a query
      return chained
    }
  }

  convertMongoErrors (errors) {
    const ret = {}
    for (const key of Object.keys(errors)) {
      const err = errors[key]
      const msg = err.reason ? err.reason.message : '' || err.message
      ret[key] = msg
    }
    return ret
  }
}

module.exports = new Mongoose()
