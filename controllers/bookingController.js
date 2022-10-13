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
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params._id}&user=${req.user._id}&price=${tour.price}`, // temporary solution, not secure
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
            images: [`https://www.travelhack.dk/${tour.imageCover}`]
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

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
// Temporary solution, used until webhooks is configured
//   const { tour, user, price } = req.query
//   if (!tour || !user || !price) next(new AppError('Missing URL parameters (tour, user and price)', 400))

//   await Booking.create({ tour, user, price })
//   console.log(Booking.find({}))

//   res.redirect(req.originalUrl.split('?')[0])
// })
