const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, password, phone });
  const token = generateToken(user._id);

  res.status(201).json({
    token,
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

  const token = generateToken(user._id);

  res.json({
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
  });
};

const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
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

module.exports = { register, login, getProfile, updateProfile, addAddress, deleteAddress };
