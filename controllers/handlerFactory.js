const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const APIFeatures = require('../utils/apiFeatures')

exports.getAll = Model => catchAsync(async (req, res, next) => {
  // Get reviews for a specific tour
  let filter = {}
  if (req.params.id) filter = { tour: req.params.id }

  const features = new APIFeatures(Model.find(filter), req.query)
    .filter() // duration[gte]=5
    .sort() // sort=-price
    .limitFields() // fields=name,price,duration
    .paginate() // page=2&limit=10

  const data = await features.query

  res.status(200).json({
    status: 'success',
    results: data.length,
    data
  })
})

exports.getOne = (Model, populateProps) => catchAsync(async (req, res, next) => {
  let query = Model.findById(req.params.id)
  if (populateProps) query = query.populate(populateProps)

  const data = await query
  if (!data) return next(new AppError('No document found with that ID', 404))

  res.status(200).json({
    status: 'success',
    data
  })
})

exports.createOne = Model => catchAsync(async (req, res, next) => {
  const newDoc = await Model.create(req.body)

  res.status(201).json({
    status: 'success',
    document: newDoc
  })
})

exports.updateOne = Model => catchAsync(async (req, res, next) => {
  const newData = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
  if (!newData) return next(new AppError('No document found with that ID', 404))

  res.status(200).json({
    status: 'success',
    document: newData
  })
})

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  const targetDoc = await Model.findByIdAndDelete(req.params.id)
  if (!targetDoc) {
    return next(new AppError('No document found with that ID', 404))
  }

  res.status(204).json({
    status: 'success',
    message: 'Deleted document',
    deletedDoc: targetDoc
  })
})
