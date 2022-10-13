const express = require('express')

const router = express.Router()

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protectRoute,
  restrictTo,
  logout
} = require('../controllers/authController')
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteMe,
  updateMe,
  deleteUser,
  getMe,
  createUser,
  uploadUserPhoto,
  resizeUserPhoto
} = require('../controllers/userController')

router.post('/signup', signup)
router.post('/login', login)
router.post('/logout', logout)
router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)

router.use(protectRoute)

router.patch('/updatePassword', updatePassword)
router.get('/me', getMe, getUser)
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe)
router.delete('/deleteMe', deleteMe)

router.use(restrictTo('admin'))

router.route('/').get(getAllUsers).post(createUser)
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser)

module.exports = router
