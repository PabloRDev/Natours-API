const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    unique: true,
    trim: true,
    maxlength: [40, 'A user name must have less or equal then 40 characters'],
    minlength: [10, 'A user name must have more or equal then 10 characters']
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.png'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: [8, 'A user password must have more or equal then 8 characters'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A user must confirm his password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (x) {
        return x === this.password
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
})

userSchema.pre('save', async function (next) { // Bcrypt the password
  if (!this.isModified('password')) return next() // Mongooose middleware

  const salt = await bcrypt.genSaltSync(12)
  this.password = bcrypt.hashSync(this.password, salt)
  this.passwordConfirm = undefined

  next()
})

userSchema.pre('save', function (next) { // Set passwordChangedAt
  if (!this.isModified('password') || this.isNew) return next()

  this.passwordChangedAt = Date.now() - 1000 // 1 second before for not to have a problem with the token
  next()
})

userSchema.pre(/^find/, function (next) { // Exclude inactive users
  this.find({ active: { $ne: false } })

  next()
})

userSchema.methods.correctPassword = async (candidatePassword, userPassword) => await bcrypt.compare(candidatePassword.toString(), userPassword)

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) { // Check password was changed after token was issued
  if (this.passwordChangedAt) {
    const changedTimestamp =
      parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      )

    return JWTTimestamp < changedTimestamp
  }
}

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')

  this.passwordResetToken = // Saved in DB
    crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // 10 min

  return resetToken // Sent to user's email
}

const User = mongoose.model('User', userSchema)

module.exports = User
