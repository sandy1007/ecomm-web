const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Dashboard stats
const getDashboardStats = async (_req, res) => {
  const [totalProducts, totalOrders, totalUsers, revenueAgg] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  const statusCounts = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
  ]);

  const recentOrders = await Order.find().sort('-createdAt').limit(5).populate('user', 'name email');

  res.json({
    totalProducts,
    totalOrders,
    totalUsers,
    totalRevenue: revenueAgg[0]?.total || 0,
    statusCounts,
    recentOrders,
  });
};

// Products
const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const product = await Product.create(req.body);
  res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product removed' });
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getAllProducts = async (req, res) => {
  const { page = 1, keyword = '', category } = req.query;
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = {};
  if (keyword) filter.name = { $regex: escapeRegex(keyword), $options: 'i' };
  if (category) filter.category = category;

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
};

// Orders
const getAllOrders = async (req, res) => {
  const { page = 1, status } = req.query;
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = status ? { orderStatus: status } : {};

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
};

const updateOrderStatus = async (req, res) => {
  const { orderStatus, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.orderStatus = orderStatus;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (orderStatus === 'delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = 'paid';
  }

  await order.save();
  res.json(order);
};

// Users
const getAllUsers = async (req, res) => {
  const { page = 1 } = req.query;
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const total = await User.countDocuments();
  const users = await User.find().select('-password').sort('-createdAt').skip((page - 1) * limit).limit(limit);
  res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
};

module.exports = {
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
};
