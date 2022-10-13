const express = require('express')

const reviewRouter = require('./reviewRoutes')
const {
  getAllTours,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getToursWithin,
  getToursDistance,
  uploadTourImages,
  resizeTourImages
} = require('../controllers/tourController')
const {
  protectRoute,
  restrictTo
} = require('../controllers/authController')

const router = express.Router()

router.route('/')
  .get(getAllTours)
  .post(protectRoute, restrictTo('admin', 'lead-guide'), createTour)

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin)

router.route('/distances/:latlng/unit/:unit')
  .get(getToursDistance)

router.route('/top-5-cheapest')
  .get(protectRoute, restrictTo('admin', 'lead-guide'), aliasTopTours, getAllTours)

router.route('/stats')
  .get(protectRoute, restrictTo('admin', 'lead-guide'), getTourStats)

router.route('/monthly-plan/:year')
  .get(protectRoute, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan)

router.route('/:id')
  .get(getTour)
  .patch(protectRoute, restrictTo('admin', 'lead-guide'), uploadTourImages, resizeTourImages, updateTour)
  .delete(protectRoute, restrictTo('admin', 'lead-guide'), protectRoute, deleteTour)

router.use('/:id/reviews', reviewRouter)

module.exports = router
