import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders } from '../store/slices/orderSlice';
import Loader from '../components/common/Loader';
import { formatPrice, getOrderStatusColor } from '../utils/helpers';
import { FiPackage } from 'react-icons/fi';

export default function OrdersPage() {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((s) => s.orders);

  useEffect(() => { dispatch(fetchMyOrders()); }, [dispatch]);

  if (loading) return <Loader text="Loading orders..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-lg">No orders yet</p>
          <p className="text-gray-400 text-sm mb-6">Start shopping to see your orders here</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400">Order ID</p>
                  <p className="text-sm font-mono font-medium">#{order._id.slice(-10).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Placed on</p>
                  <p className="text-sm">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-sm font-bold">{formatPrice(order.total)}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${getOrderStatusColor(order.orderStatus)}`}>
                  {order.orderStatus}
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1">
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 min-w-0">
                    <img src={item.image || 'https://via.placeholder.com/50'} alt={item.name} className="w-12 h-12 object-contain bg-gray-50 rounded flex-shrink-0" />
                    <p className="text-xs text-gray-600 line-clamp-2 w-28">{item.name}</p>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="flex items-center text-xs text-gray-400 px-2">+{order.items.length - 3} more</div>
                )}
              </div>

              <div className="flex justify-end mt-3">
                <Link to={`/orders/${order._id}`} className="text-blue-600 text-sm hover:underline font-medium">
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
