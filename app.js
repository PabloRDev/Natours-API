const express = require('express')
const morgan = require('morgan')
const dotenv = require('dotenv')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const compression = require('compression')
const cors = require('cors')

const globalErrorHandler = require('./controllers/errorController')

dotenv.config({ path: './config.env' })
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const bookingRouter = require('./routes/bookingRoutes')
const AppError = require('./utils/appError')

const app = express()

const limiterAPICalls = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
})

app.use(helmet()) // Security headers
process.env.NODE_ENV === 'development' && app.use(morgan('dev')) // Color logging
app.use(express.json({ limit: '10kb' }))
app.use(mongoSanitize()) // Sanitize inputs against query selector injection attacks
app.use(xss()) // Filter input from users to prevent XSS attacks
app.use(hpp({ // Protect against HTTP Parameter Pollution attacks
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}))
app.use(compression()) // Compress responses sent to users
app.use('/api', limiterAPICalls)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString()

  next()
})
app.use(cors()) // Cross-origin resource sharing
app.options('*', cors())
app.enable('trust proxy') // Allow secure HTTPS connections from Heroku for Express

// ROUTES

app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)

app.all('*', (req, res, next) => { // All routes except those defined above
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(globalErrorHandler)

module.exports = app
