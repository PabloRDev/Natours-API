const AppError = require('../utils/appError')
const Review = require('./../models/reviewModel')
const catchAsync = require('./../utils/catchAsync')
const factory = require('./handlerFactory')

exports.getAllReviews = factory.getAll(Review)
exports.getReview = factory.getOne(Review)

exports.createReview = factory.createOne(Review)
exports.updateReview = factory.updateOne(Review)
exports.deleteReview = factory.deleteOne(Review)

exports.setTourUserIds = catchAsync(async (req, res, next) => { // Allow nested routes, e.g. /tours/:tourId/reviews
  if (!req.body.tour) req.body.tour = req.params.id
  if (!req.body.user) req.body.user = req.user.id

  next()
})

exports.getMyReviews = catchAsync(async (req, res, next) => {
  if (!req.user.id) return next(new AppError('There is no user Id, please login again.', 401))

  const data = await Review.find({ user: req.user.id })
  res.status(200).json({
    status: 'success',
    results: data.length,
    data
  })
})
