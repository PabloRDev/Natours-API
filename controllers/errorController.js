const AppError = require('../utils/appError')

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  })
}

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    })
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR', err)

    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    })
  }
}

// PRODUCTION HANDLERS

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`

  return new AppError(message, 400)
}

const handleDuplicatedFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
  const message = `Duplicated field value: ${value}. Please use another value!`

  return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message)

  const message = `Invalid input data. ${errors.join('. ')}`

  return new AppError(message, 400)
}

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401)

const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again', 401)

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res)
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }

    switch (error.name) {
      case 'CastError': // Mongoose failed to cast a value
        error = handleCastErrorDB(error)
        break
      case 'ValidationError': // Schema failed validation
        error = handleValidationErrorDB(error)
        break
      case 'JsonWebTokenError':
        error = handleJWTError()
        break
      case 'TokenExpiredError':
        error = handleJWTExpiredError()
        break

      default:
        break
    }

    if (error.code === 11000) error = handleDuplicatedFieldsDB(error)

    sendErrorProd(error, res)
  }

  next()
}
