const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setTokenCookie = (res, userId) => {
  const token = generateToken(userId);
  res.cookie('jwt', token, COOKIE_OPTIONS);
};

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, password, phone });
  setTokenCookie(res, user._id);

  res.status(201).json({
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
  });
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  setTokenCookie(res, user._id);

  res.json({
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
  });
};

const logout = (_req, res) => {
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out' });
};

const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};

const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const { name, phone, password } = req.body;

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (password) {
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    user.password = password;
  }

  await user.save();
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone });
};

const addAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const user = await User.findById(req.user._id);
  const { street, city, state, pincode, phone, isDefault } = req.body;

  if (isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  user.addresses.push({ street, city, state, pincode, phone, isDefault: isDefault || false });
  await user.save();
  res.status(201).json(user.addresses);
};

const deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.id);
  await user.save();
  res.json(user.addresses);
};

module.exports = { register, login, logout, getProfile, updateProfile, addAddress, deleteAddress };
