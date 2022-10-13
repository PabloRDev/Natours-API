const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const APIFeatures = require('../utils/apiFeatures')

exports.getAll = Model => catchAsync(async (req, res, next) => {
  // To allow for nested GET reviews on tour (hack)
  let filter = {}
  if (req.params.id) filter = { tour: req.params.id }

  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()

  const data = await features.query

  res.status(200).json({
    status: 'success',
    results: data.length,
    data
  })
})

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
  let query = Model.findById(req.params.id)
  if (popOptions) query = query.populate(popOptions)

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
  const updatedData = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })

  if (!updatedData) {
    return next(new AppError('No document found with that ID', 404))
  }

  res.status(200).json({
    status: 'success',
    updatedData
  })
})

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  const deletedDoc = await Model.findByIdAndDelete(req.params.id)

  if (!deletedDoc) {
    return next(new AppError('No document found with that ID', 404))
  }

  res.status(204).json({
    status: 'success',
    message: 'Deleted document',
    deletedDoc
  })
})
