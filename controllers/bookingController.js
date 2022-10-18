const stripe = require('stripe')(process.env.STRIPE_SECRET)

const Tour = require('../models/tourModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Booking = require('../models/bookingModel')
const factory = require('./handlerFactory')

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId)
  !tour && new AppError('No tour found with that ID', 404)

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/api/v1/tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: tour.price * 100, // price in cents
          product_data: {
            name: tour.name,
            description: tour.summary,
            images: [`
            ${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}
            `]
          }
        },
        quantity: 1
      }
    ]
  })

  res.status(200).json({
    status: 'success',
    session
  })
})

exports.getAllBookings = factory.getAll(Booking)
exports.createBooking = factory.createOne(Booking)
exports.getBooking = factory.getOne(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)
