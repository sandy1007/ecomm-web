const express = require('express');
const { getProducts, getProductById, getCategories, createReview, getReviews } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);
router.get('/:id/reviews', getReviews);
router.post('/:id/reviews', protect, createReview);

module.exports = router;
