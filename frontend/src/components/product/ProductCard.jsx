import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart, FiStar } from 'react-icons/fi';
import { addToCart } from '../../store/slices/cartSlice';
import { formatPrice, getDiscountPercent } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const discount = getDiscountPercent(product.price, product.discountPrice);
  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
  };

  return (
    <Link to={`/products/${product._id}`} className="card hover:shadow-md transition-shadow duration-200 group flex flex-col">
      <div className="relative overflow-hidden rounded-t-lg bg-white">
        <img
          src={product.images[0] || 'https://via.placeholder.com/300x300?text=No+Image'}
          alt={product.name}
          className="w-full h-52 object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300?text=No+Image'; }}
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
            {discount}% off
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-red-500 font-semibold text-sm">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
        <h3 className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 flex-1">{product.name}</h3>

        <div className="flex items-center gap-1 mt-2">
          <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
            {product.ratings.avg > 0 ? product.ratings.avg.toFixed(1) : 'New'} <FiStar className="text-xs" />
          </span>
          {product.ratings.count > 0 && (
            <span className="text-xs text-gray-400">({product.ratings.count.toLocaleString()})</span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-bold text-gray-900">{formatPrice(finalPrice)}</span>
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="mt-3 w-full btn-primary flex items-center justify-center gap-2 text-sm py-1.5 disabled:opacity-50"
        >
          <FiShoppingCart /> Add to Cart
        </button>
      </div>
    </Link>
  );
}
