const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Review = require('../models/Review');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getProducts = async (req, res) => {
  const {
    keyword = '',
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    sort = '-createdAt',
    page = 1,
    featured,
  } = req.query;
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100);

  const filter = { isActive: true };

  if (keyword) filter.$text = { $search: keyword };
  if (category) filter.category = category;
  if (brand) filter.brand = { $regex: escapeRegex(brand), $options: 'i' };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (minRating) filter['ratings.avg'] = { $gte: Number(minRating) };
  if (featured === 'true') filter.featured = true;

  const skip = (Number(page) - 1) * limit;
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter).sort(sort).skip(skip).limit(limit);

  res.json({
    products,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    total,
  });
};

const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

const getCategories = async (_req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  res.json(categories);
};

const createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { rating, title, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const existing = await Review.findOne({ product: product._id, user: req.user._id });
  if (existing) return res.status(400).json({ message: 'You already reviewed this product' });

  const review = await Review.create({
    product: product._id,
    user: req.user._id,
    rating: Number(rating),
    title,
    comment,
  });

  res.status(201).json(review);
};

const getReviews = async (req, res) => {
  const reviews = await Review.find({ product: req.params.id })
    .populate('user', 'name avatar')
    .sort('-createdAt')
    .limit(20);
  res.json(reviews);
};

module.exports = { getProducts, getProductById, getCategories, createReview, getReviews };
