const multer = require('multer')
const sharp = require('sharp')

const User = require('../models/userModel')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')
// Multer configuration
const multerStorage = multer.memoryStorage()
const multerFilter = (req, file, cb) => {
  file.mimetype.startsWith('image')
    ? cb(null, true)
    : cb(new AppError('Not an image! Please, upload any images.', 400), false)
}
const upload = multer({ storage: multerStorage, fileFilter: multerFilter })

exports.getAllUsers = factory.getAll(User)
exports.getUser = factory.getOne(User)
exports.createUser = factory.createOne(User)
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)

exports.deleteMe = catchAsync(async (req, res) => { // Inactive user
  await User.findByIdAndUpdate(req.user.id, { active: false })

  res.status(204).json({
    status: 'success',
    data: null
  })
})

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) return next(new AppError('This route is not for password updates. Please use /updatePassword.', 400))

  const fieldsUpdate = filterObj(req.body, 'name', 'email')
  if (req.file) fieldsUpdate.photo = req.file.filename

  const newUser = await User.findByIdAndUpdate(req.user.id, fieldsUpdate, { new: true, runValidators: true })

  res.status(200).json({
    status: 'success',
    newUser
  })
})

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id

  next()
}

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next()

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`)

  next()
})

const filterObj = (body, ...fieldsUpdateMe) => {
  const fieldsObj = {}

  Object.keys(body).forEach(bodyProp => {
    if (fieldsUpdateMe.includes(bodyProp)) fieldsObj[bodyProp] = body[bodyProp]
  })

  return fieldsObj
}
