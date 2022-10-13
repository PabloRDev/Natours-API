const express = require('express')
const {
  getCheckoutSession,
  getAllBookings,
  createBooking,
  deleteBooking,
  updateBooking,
  getBooking
} = require('../controllers/bookingController')
const { protectRoute, restrictTo } = require('../controllers/authController')

const router = express.Router()

router.use(protectRoute)

router.get('/checkout-session/:tourId', protectRoute, getCheckoutSession)

router.use(restrictTo('admin', 'lead-guide'))

router.route('/')
  .get(getAllBookings)
  .post(createBooking)
router.route('/:id')
  .get(getBooking)
  .patch(updateBooking)
  .delete(deleteBooking)

module.exports = router
