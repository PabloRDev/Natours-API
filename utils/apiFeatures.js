class APIFeatures {
  constructor (query, queryString) {
    this.query = query
    this.queryString = queryString
  }

  filter () {
    const queryObj = { ...this.queryString }
    const excludedFields = ['page', 'sort', 'limit', 'fields']
    excludedFields.forEach(el => delete queryObj[el])

    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

    this.query = this.query.find(JSON.parse(queryStr))

    return this
  }

  sort () {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ')
      this.query = this.query.sort(sortBy)
    } else {
      this.query = this.query.sort('-createdAt')
    }

    return this
  }

  limitFields () {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ')
      this.query = this.query.select(fields)
    } else {
      this.query = this.query.select('-__v')
    }

    return this
  }

  paginate () {
    const page = +this.queryString.page || 1
    const limit = +this.queryString.limit || 100
    const skip = (page - 1) * limit // Example: skip 10 results if on page 2

    this.query = this.query.skip(skip).limit(limit)

    return this
  }

  async paginateResults () {
    const results = await this.query

    return results
  }

  async paginateResultsCount () {
    const resultsCount = await this.query.countDocuments()

    return resultsCount
  }

  async paginateResultsPage () {
    const resultsPage = await this.query.page()

    return resultsPage
  }

  async paginateResultsLimit () {
    const resultsLimit = await this.query.limit()

    return resultsLimit
  }

  async paginateResultsSkip () {
    const resultsSkip = await this.query.skip()

    return resultsSkip
  }

  async paginateResultsTotalPages () {
    const resultsTotalPages = await this.query.totalPages()

    return resultsTotalPages
  }

  async paginateResultsHasPrevPage () {
    const resultsHasPrevPage = await this.query.hasPrevPage()

    return resultsHasPrevPage
  }

  async paginateResultsHasNextPage () {
    const resultsHasNextPage = await this.query.hasNextPage()

    return resultsHasNextPage
  }

  async paginateResultsPrevPage () {
    const resultsPrevPage = await this.query.prevPage()

    return resultsPrevPage
  }

  async paginateResultsNextPage () {
    const resultsNextPage = await this.query.nextPage()

    return resultsNextPage
  }

  async paginateResultsTotalDocs () {
    const resultsTotalDocs = await this.query.totalDocs()

    return resultsTotalDocs
  }

  async paginateResultsOffset () {
    const resultsOffset = await this.query.offset()

    return resultsOffset
  }

  async paginateResultsDocs () {
    const resultsDocs = await this.query.docs()

    return resultsDocs
  }
}

module.exports = APIFeatures
