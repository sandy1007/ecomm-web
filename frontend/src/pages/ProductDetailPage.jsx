import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart, FiStar, FiArrowLeft } from 'react-icons/fi';
import { fetchProductById, fetchReviews, submitReview, clearCurrentProduct } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import Loader from '../components/common/Loader';
import { formatPrice, getDiscountPercent } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useBugsnagFlowContext, useBugsnagProductTracking } from '../hooks/useBugsnag.jsx';
import bugsnagManager from '../utils/bugsnag.jsx';

export default function ProductDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProduct: product, reviews, productLoading } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  useBugsnagFlowContext('Product View');
  useBugsnagProductTracking(product ? { id: product._id, name: product.name, category: product.category, price: product.price, rating: product.ratings?.avg } : null);

  useEffect(() => {
    dispatch(fetchProductById(id));
    dispatch(fetchReviews(id));
    return () => dispatch(clearCurrentProduct());
  }, [id, dispatch]);

  if (productLoading) return <Loader text="Loading product..." />;
  if (!product) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Product not found.</p>
      <Link to="/products" className="text-blue-600 mt-2 inline-block hover:underline">← Back to products</Link>
    </div>
  );

  const discount = getDiscountPercent(product.price, product.discountPrice);
  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

  const handleAddToCart = () => {
    if (!user) { toast.error('Please login to add to cart'); return; }
    bugsnagManager.trackActionClick('add_to_cart', {
      productId: product._id,
      productName: product.name,
      price: finalPrice,
      quantity: qty,
    });
    dispatch(addToCart({ productId: product._id, quantity: qty }));
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    bugsnagManager.trackFormSubmit('review_form', { productId: id, rating: reviewForm.rating });
    dispatch(submitReview({ productId: id, ...reviewForm }))
      .unwrap()
      .then(() => { toast.success('Review submitted!'); setShowReviewForm(false); })
      .catch((err) => toast.error(err));
  };

  // ── DEV-ONLY: test error injection ──────────────────────────────────────
  const triggerUIcrash = () => {
    bugsnagManager.setFlowContext('Product View');
    bugsnagManager.leaveBreadcrumb('Simulating UI Crash', { productId: product._id }, 'user');
    // This will be caught by the ErrorBoundary and reported to Bugsnag
    undefinedFunctionCall(); // eslint-disable-line no-undef
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/products" className="text-blue-600 text-sm hover:underline flex items-center gap-1 mb-4">
        <FiArrowLeft /> Back to products
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Images */}
        <div>
          <div className="card p-4 mb-3">
            <img
              src={product.images[activeImg] || 'https://via.placeholder.com/400'}
              alt={product.name}
              className="w-full h-80 object-contain"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/400'; }}
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`border-2 rounded p-1 ${activeImg === i ? 'border-blue-500' : 'border-gray-200'}`}>
                  <img src={img} alt="" className="w-12 h-12 object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-blue-600 font-medium">{product.brand}</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-1 mb-2">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <span className="bg-green-600 text-white px-2 py-0.5 rounded text-sm flex items-center gap-1">
              {product.ratings.avg > 0 ? product.ratings.avg.toFixed(1) : 'New'} <FiStar />
            </span>
            {product.ratings.count > 0 && (
              <span className="text-gray-500 text-sm">{product.ratings.count.toLocaleString()} ratings</span>
            )}
          </div>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-gray-900">{formatPrice(finalPrice)}</span>
            {discount > 0 && (
              <>
                <span className="text-gray-400 line-through">{formatPrice(product.price)}</span>
                <span className="text-green-600 font-semibold">{discount}% off</span>
              </>
            )}
          </div>

          <p className={`text-sm font-medium mb-4 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left!` : 'Out of Stock'}
          </p>

          {product.stock > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium text-gray-700">Qty:</label>
              <select
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="input-field w-20"
              >
                {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 mb-6">
            <button onClick={handleAddToCart} disabled={product.stock === 0} className="btn-primary flex items-center gap-2 flex-1 justify-center py-3">
              <FiShoppingCart /> Add to Cart
            </button>
            <Link
              to="/checkout"
              onClick={() => { if (!user) { toast.error('Please login'); return; } dispatch(addToCart({ productId: product._id, quantity: qty })); }}
              className="btn-secondary flex items-center justify-center flex-1 py-3"
            >
              Buy Now
            </Link>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {product.specifications?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Specifications</h3>
              <table className="w-full text-sm">
                <tbody>
                  {product.specifications.map((s, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-1.5 px-3 font-medium text-gray-600 w-40">{s.key}</td>
                      <td className="py-1.5 px-3 text-gray-800">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <p className="font-semibold text-yellow-800 mb-2">⚡ Bugsnag Test — Product View Flow</p>
              <button
                type="button"
                onClick={triggerUIcrash}
                className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-900 px-3 py-1 rounded border border-yellow-300"
              >
                Simulate: UI Crash (uncaught error)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Customer Reviews ({reviews.length})</h2>
          {user && !showReviewForm && (
            <button onClick={() => setShowReviewForm(true)} className="btn-secondary text-sm">Write a Review</button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-4 rounded mb-6 space-y-3">
            <h3 className="font-semibold text-gray-700">Your Review</h3>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Rating</label>
              <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })} className="input-field w-24">
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ★</option>)}
              </select>
            </div>
            <input type="text" placeholder="Review Title" value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} required className="input-field" />
            <textarea placeholder="Write your review..." value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} required rows={3} className="input-field resize-none" />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm">Submit Review</button>
              <button type="button" onClick={() => setShowReviewForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="border-b pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">
                    {review.rating} ★
                  </span>
                  <span className="font-semibold text-sm">{review.title}</span>
                </div>
                <p className="text-sm text-gray-600">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-1">by {review.user?.name} · {new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
