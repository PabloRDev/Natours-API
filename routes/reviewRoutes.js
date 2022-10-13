const express = require('express')

const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview
} = require('../controllers/reviewController')
const {
  protectRoute,
  restrictTo
} = require('../controllers/authController')

const router = express.Router({
  mergeParams: true
})

router.use(protectRoute)

router.route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourUserIds, createReview)

router.route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview)

module.exports = router
