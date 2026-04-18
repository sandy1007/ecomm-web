const mongoose = require('mongoose');

const specSchema = new mongoose.Schema({ key: String, value: String }, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    discountPrice: { type: Number, min: 0, default: 0 },
    images: { type: [String], default: [] },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Books', 'Beauty', 'Toys', 'Grocery'],
    },
    brand: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    ratings: {
      avg: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    specifications: [specSchema],
    tags: [String],
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
