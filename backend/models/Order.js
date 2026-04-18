const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shippingAddress: { type: shippingSchema, required: true },
    paymentMethod: { type: String, enum: ['COD', 'UPI', 'Card', 'NetBanking'], default: 'COD' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
    },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paidAt: Date,
    deliveredAt: Date,
    trackingNumber: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
