const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart) return res.json({ items: [] });

  const validItems = cart.items.filter((item) => item.product && item.product.isActive);
  res.json({ items: validItems });
};

const addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) return res.status(404).json({ message: 'Product not found' });
  if (product.stock < 1) return res.status(400).json({ message: 'Product out of stock' });

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existingItem = cart.items.find((item) => item.product.toString() === productId);

  if (existingItem) {
    const newQty = existingItem.quantity + Number(quantity);
    existingItem.quantity = Math.min(newQty, product.stock);
  } else {
    cart.items.push({ product: productId, quantity: Math.min(Number(quantity), product.stock) });
  }

  await cart.save();
  await cart.populate('items.product');
  res.json({ items: cart.items });
};

const updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  if (quantity < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) return res.status(404).json({ message: 'Item not in cart' });

  const product = await Product.findById(productId);
  item.quantity = Math.min(Number(quantity), product.stock);
  await cart.save();
  await cart.populate('items.product');
  res.json({ items: cart.items });
};

const removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  await cart.populate('items.product');
  res.json({ items: cart.items });
};

const clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json({ items: [] });
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
