import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById, cancelOrder } from '../store/slices/orderSlice';
import Loader from '../components/common/Loader';
import { formatPrice, getOrderStatusColor } from '../utils/helpers';
import { FiArrowLeft } from 'react-icons/fi';

const STATUS_STEPS = ['processing', 'confirmed', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder: order, loading } = useSelector((s) => s.orders);

  useEffect(() => { dispatch(fetchOrderById(id)); }, [id, dispatch]);

  if (loading || !order) return <Loader text="Loading order..." />;

  const stepIndex = STATUS_STEPS.indexOf(order.orderStatus);
  const canCancel = !['shipped', 'delivered', 'cancelled'].includes(order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link to="/orders" className="text-blue-600 text-sm hover:underline flex items-center gap-1 mb-4">
        <FiArrowLeft /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Order Details</h1>
          <p className="text-sm text-gray-500">#{order._id.slice(-10).toUpperCase()}</p>
        </div>
        <span className={`text-sm font-semibold px-4 py-1.5 rounded-full capitalize ${getOrderStatusColor(order.orderStatus)}`}>
          {order.orderStatus}
        </span>
      </div>

      {/* Status tracker */}
      {order.orderStatus !== 'cancelled' && (
        <div className="card p-5 mb-5">
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= stepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span className="text-xs mt-1 capitalize text-gray-500">{step}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 ${i < stepIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {/* Shipping */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-700 mb-2">Delivery Address</h2>
          <p className="text-sm text-gray-600">
            {order.shippingAddress.street}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
            Phone: {order.shippingAddress.phone}
          </p>
        </div>

        {/* Payment */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-700 mb-2">Payment Info</h2>
          <p className="text-sm text-gray-600">Method: <strong>{order.paymentMethod}</strong></p>
          <p className="text-sm text-gray-600">Status: <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{order.paymentStatus}</span></p>
          <p className="text-sm text-gray-600 mt-1">Placed: {new Date(order.createdAt).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Items */}
      <div className="card p-4 mb-5">
        <h2 className="font-semibold text-gray-700 mb-3">Items Ordered</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center">
              <img src={item.image || 'https://via.placeholder.com/60'} alt={item.name} className="w-14 h-14 object-contain bg-gray-50 rounded" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
              </div>
              <p className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span className={order.shippingCost === 0 ? 'text-green-600' : ''}>{order.shippingCost === 0 ? 'FREE' : formatPrice(order.shippingCost)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </div>

      {canCancel && (
        <button
          onClick={() => dispatch(cancelOrder(order._id))}
          className="border border-red-500 text-red-500 hover:bg-red-50 px-6 py-2 rounded text-sm font-medium transition-colors"
        >
          Cancel Order
        </button>
      )}
    </div>
  );
}
