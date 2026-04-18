const mongoose = require('mongoose');
const Product = require('./Product');

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.statics.calcAverageRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      'ratings.avg': Math.round(stats[0].avg * 10) / 10,
      'ratings.count': stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { 'ratings.avg': 0, 'ratings.count': 0 });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.product);
});

reviewSchema.post('deleteOne', { document: true }, function () {
  this.constructor.calcAverageRating(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);
