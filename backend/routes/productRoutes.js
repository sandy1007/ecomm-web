const express = require('express');
const { body } = require('express-validator');
const { getProducts, getProductById, getCategories, createReview, getReviews } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);
router.get('/:id/reviews', getReviews);
router.post(
  '/:id/reviews',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('title').trim().notEmpty().isLength({ max: 200 }).withMessage('Title is required (max 200 chars)'),
    body('comment').trim().notEmpty().isLength({ min: 10, max: 2000 }).withMessage('Comment must be 10–2000 characters'),
  ],
  createReview
);

module.exports = router;
