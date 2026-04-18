import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { updateCartItem, removeFromCart } from '../../store/slices/cartSlice';
import { formatPrice } from '../../utils/helpers';

export default function CartItem({ item }) {
  const dispatch = useDispatch();
  const { product, quantity } = item;
  if (!product) return null;

  const price = product.discountPrice > 0 ? product.discountPrice : product.price;

  return (
    <div className="card p-4 flex gap-4">
      <Link to={`/products/${product._id}`}>
        <img
          src={product.images[0] || 'https://via.placeholder.com/100'}
          alt={product.name}
          className="w-24 h-24 object-contain bg-gray-50 rounded"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }}
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/products/${product._id}`} className="text-sm font-medium text-gray-800 hover:text-blue-600 line-clamp-2">
          {product.name}
        </Link>
        <p className="text-xs text-gray-500 mt-0.5">{product.brand}</p>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-base font-bold">{formatPrice(price)}</span>
          {product.discountPrice > 0 && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center border border-gray-300 rounded">
            <button
              onClick={() => quantity > 1
                ? dispatch(updateCartItem({ productId: product._id, quantity: quantity - 1 }))
                : dispatch(removeFromCart(product._id))
              }
              className="px-2 py-1 hover:bg-gray-100 text-gray-600"
            >
              <FiMinus className="text-sm" />
            </button>
            <span className="px-3 text-sm font-medium">{quantity}</span>
            <button
              onClick={() => dispatch(updateCartItem({ productId: product._id, quantity: quantity + 1 }))}
              disabled={quantity >= product.stock}
              className="px-2 py-1 hover:bg-gray-100 text-gray-600 disabled:opacity-40"
            >
              <FiPlus className="text-sm" />
            </button>
          </div>

          <button
            onClick={() => dispatch(removeFromCart(product._id))}
            className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
          >
            <FiTrash2 /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}
