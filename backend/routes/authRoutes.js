const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getProfile, updateProfile, addAddress, deleteAddress } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post('/logout', logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post(
  '/address',
  protect,
  [
    body('street').trim().notEmpty().isLength({ max: 200 }).withMessage('Street is required'),
    body('city').trim().notEmpty().isLength({ max: 100 }).withMessage('City is required'),
    body('state').trim().notEmpty().isLength({ max: 100 }).withMessage('State is required'),
    body('pincode').trim().matches(/^\d{6}$/).withMessage('Valid 6-digit pincode is required'),
    body('phone').trim().matches(/^\+?[0-9]{7,15}$/).withMessage('Valid phone number is required'),
  ],
  addAddress
);
router.delete('/address/:id', protect, deleteAddress);

module.exports = router;
