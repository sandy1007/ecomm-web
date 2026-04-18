import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder } from '../store/slices/orderSlice';
import { selectCartTotal } from '../store/slices/cartSlice';
import { formatPrice } from '../utils/helpers';
import { FiCreditCard, FiTruck } from 'react-icons/fi';

const PAYMENT_METHODS = [
  { id: 'COD', label: 'Cash on Delivery', icon: '💵' },
  { id: 'UPI', label: 'UPI (Mock)', icon: '📱' },
  { id: 'Card', label: 'Credit/Debit Card (Mock)', icon: '💳' },
];

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((s) => s.cart);
  const { placing } = useSelector((s) => s.orders);
  const cartTotal = useSelector(selectCartTotal);
  const shippingCost = cartTotal >= 500 ? 0 : 49;

  const [address, setAddress] = useState({ street: '', city: '', state: '', pincode: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const [key, val] of Object.entries(address)) {
      if (!val.trim()) return;
    }

    const orderItems = items.map((item) => ({
      productId: item.product._id,
      quantity: item.quantity,
    }));

    const result = await dispatch(createOrder({ shippingAddress: address, paymentMethod, items: orderItems }));
    if (createOrder.fulfilled.match(result)) {
      navigate(`/orders/${result.payload._id}`);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Checkout</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Shipping Address */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <FiTruck /> Delivery Address
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { key: 'street', label: 'Street Address', placeholder: '123 Main St, Apt 4B', full: true },
                  { key: 'city', label: 'City', placeholder: 'Mumbai' },
                  { key: 'state', label: 'State', placeholder: 'Maharashtra' },
                  { key: 'pincode', label: 'Pincode', placeholder: '400001' },
                  { key: 'phone', label: 'Phone Number', placeholder: '9876543210' },
                ].map(({ key, label, placeholder, full }) => (
                  <div key={key} className={full ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      type={key === 'phone' ? 'tel' : 'text'}
                      value={address[key]}
                      onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
                      placeholder={placeholder}
                      required
                      className="input-field"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <FiCreditCard /> Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((pm) => (
                  <label key={pm.id} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value={pm.id}
                      checked={paymentMethod === pm.id}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="accent-blue-600"
                    />
                    <span className="text-lg">{pm.icon}</span>
                    <span className="font-medium text-sm">{pm.label}</span>
                  </label>
                ))}
              </div>
              {paymentMethod !== 'COD' && (
                <p className="text-xs text-gray-400 mt-2 bg-yellow-50 p-2 rounded">
                  This is a demo app. No real payment is processed. Order will be marked as paid.
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="card p-5 h-fit sticky top-20">
            <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wide mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => {
                const price = item.product?.discountPrice > 0 ? item.product.discountPrice : item.product?.price;
                return (
                  <div key={item.product?._id} className="flex justify-between text-sm">
                    <span className="line-clamp-1 flex-1 mr-2 text-gray-600">{item.product?.name} × {item.quantity}</span>
                    <span className="font-medium">{formatPrice(price * item.quantity)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span><span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                  {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                <span>Total</span><span>{formatPrice(cartTotal + shippingCost)}</span>
              </div>
            </div>
            <button type="submit" disabled={placing} className="btn-primary w-full mt-4 py-3">
              {placing ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
