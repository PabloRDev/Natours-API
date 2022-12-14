const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const {
  promisify
} = require('util')

const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const sendEmail = require('../utils/email')

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body)

  newTokenRes(newUser, 201, res, req)
})

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) {
    return next(new AppError('Please, provide email and password!', 400))
  }

  const user = await User.findOne({ email }).select('+password')
  if (!user) next(new AppError('No user found with this email', 404))
  if (!(await user.correctPassword(password, user.password))) return next(new AppError('Incorrect password', 401))

  newTokenRes(user, 200, res, req)
})

exports.logout = catchAsync(async (req, res, next) => {
  if (req.headers.authorization !== 'Bearer null') {
    req.headers.authorization = ''
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000), // in 10 seconds
      httpOnly: true
    })

    res.status(200).json({ status: 'success', message: 'Successfully logged out' })
  } else {
    next(new AppError('You are already logged out', 401))
  }
})

exports.protectRoute = catchAsync(async (req, res, next) => {
  let token
  if (req.headers.authorization?.startsWith('Bearer')) { token = req.headers.authorization.split(' ')[1] }
  if (!token) return next(new AppError('You are not logged in! Please log in to get access.', 401))

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET) // Promisify -> function uses callback to function returns promise

  const currentUser = await User.findById(decoded.id)
  if (!currentUser) return next(new AppError('The user belonging to this token does no longer exist.', 401))
  if (currentUser.changedPasswordAfter(decoded.iat)) return next(new AppError('User recently changed password! Please log in again.', 401)) // iat -> time token was issued at

  req.user = currentUser

  next()
})

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new AppError(`As a ${req.user.role}, you do not have permission to perform this action. Only actionable by ${roles.join(', ')} `, 403))

  next()
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) return next(new AppError('No user found with that email.', 404))

  const resetToken = user.createPasswordResetToken() // Returns crypto token
  if (!resetToken) return next(new AppError('Error creating password reset token', 500))

  await user.save({ validateBeforeSave: false }) // Save with passwordResetToken and passwordResetExpires
  await sendTokenEmail(req, res, next, user, resetToken)
})

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken =
    crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex')

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  })
  if (!user) return next(new AppError('Token is invalid or has expired (10 min)', 401))

  user.password = req.body.password // Reset password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined // Reset token
  user.passwordResetExpires = undefined

  await user.save() // Save new password

  newTokenRes(user, 200, res, req)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401))
  }

  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  await user.save()

  newTokenRes(user, 200, res, req)
})

const newTokenRes = (user, statusCode, res, req) => {
  const token = createUserToken(user._id)
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  }

  res.cookie('jwt', token, cookieOptions)

  user.password = undefined

  res.status(statusCode).json({
    status: 'success',
    token,
    user
  })
}

const createUserToken = id => jwt.sign(
  { id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
)

const sendTokenEmail = async (req, res, next, user, resetToken) => {
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
  const message = `
  <p> Forgot your password? </br>
  Submit a PATCH request with your new password and passwordConfirm to: <a href= ${resetURL} target="_blank"> this URL. </a></br>
  If you didn't forget your password, please ignore this email.</p>
  `

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    })

    res.status(200).json({
      status: 'success',
      resetToken,
      message: 'Token sent to email!'
    })
  } catch (err) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })

    return next(new AppError('There was an error sending the email. Try again later!', 500)
    )
  }
}
