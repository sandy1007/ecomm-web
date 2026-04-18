const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const createOrder = async (req, res) => {
  const { shippingAddress, paymentMethod, items } = req.body;

  if (!items || items.length === 0) return res.status(400).json({ message: 'No items in order' });

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: `Product not found: ${item.productId}` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ message: `Insufficient stock for: ${product.name}` });
    }

    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    subtotal += price * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || '',
      price,
      quantity: item.quantity,
    });

    product.stock -= item.quantity;
    await product.save();
  }

  const shippingCost = subtotal >= 500 ? 0 : 49;
  const total = subtotal + shippingCost;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'COD',
    paymentStatus: paymentMethod === 'COD' ? 'pending' : 'paid',
    subtotal,
    shippingCost,
    total,
    ...(paymentMethod !== 'COD' && { paidAt: new Date() }),
  });

  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  res.status(201).json(order);
};

const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json(orders);
};

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(order);
};

const cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied' });

  if (['shipped', 'delivered'].includes(order.orderStatus)) {
    return res.status(400).json({ message: 'Cannot cancel order after shipping' });
  }

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }

  order.orderStatus = 'cancelled';
  await order.save();
  res.json(order);
};

module.exports = { createOrder, getMyOrders, getOrderById, cancelOrder };
