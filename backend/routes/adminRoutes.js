const express = require('express');
const { body } = require('express-validator');
const {
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

const router = express.Router();

router.use(protect, admin);

router.get('/dashboard', getDashboardStats);

router.get('/products', getAllProducts);
router.post(
  '/products',
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('price').isNumeric().withMessage('Valid price is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('brand').notEmpty().withMessage('Brand is required'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  ],
  createProduct
);
router.put(
  '/products/:id',
  [
    body('name').optional().trim().notEmpty().isLength({ max: 300 }).withMessage('Invalid product name'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('discountPrice').optional().isFloat({ min: 0 }).withMessage('Discount price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    body('brand').optional().trim().notEmpty().withMessage('Brand cannot be empty'),
  ],
  updateProduct
);
router.delete('/products/:id', deleteProduct);

router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

router.get('/users', getAllUsers);

module.exports = router;
