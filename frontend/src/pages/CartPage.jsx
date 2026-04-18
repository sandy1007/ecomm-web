import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import CartItem from '../components/cart/CartItem';
import { selectCartTotal } from '../store/slices/cartSlice';
import { formatPrice } from '../utils/helpers';

export default function CartPage() {
  const { items, loading } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);
  const total = useSelector(selectCartTotal);
  const shippingCost = total >= 500 ? 0 : 49;

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <FiShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Please login to view your cart</p>
        <Link to="/login" className="btn-primary">Login</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <FiShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Your cart is empty!</h2>
        <p className="text-gray-500 mb-6">Add some products to get started</p>
        <Link to="/products" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Shopping Cart ({items.length} items)</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => <CartItem key={item.product?._id} item={item} />)}
        </div>

        {/* Order Summary */}
        <div className="card p-5 h-fit sticky top-20">
          <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wide mb-4">Price Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Price ({items.length} items)</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
              </span>
            </div>
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-bold text-base">
            <span>Total Amount</span>
            <span>{formatPrice(total + shippingCost)}</span>
          </div>
          {shippingCost > 0 && (
            <p className="text-xs text-gray-400 mt-1">Add ₹{500 - total} more for free delivery</p>
          )}
          <Link to="/checkout" className="btn-primary block text-center mt-4 py-3">
            Proceed to Checkout <FiArrowRight className="inline" />
          </Link>
        </div>
      </div>
    </div>
  );
}
