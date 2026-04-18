import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Loader from '../../components/common/Loader';
import { formatPrice, getOrderStatusColor } from '../../utils/helpers';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUSES = ['', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [data, setData] = useState({ orders: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/orders?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}`);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const updateStatus = async (orderId, orderStatus) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/admin/orders/${orderId}/status`, { orderStatus });
      toast.success('Status updated');
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Orders ({data.total})</h1>

          <div className="flex gap-2 mb-4 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`text-xs px-3 py-1 rounded-full border capitalize transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:border-blue-400'}`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          {loading ? <Loader /> : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map((h) => (
                        <th key={h} className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <Link to={`/orders/${order._id}`} className="font-mono text-xs text-blue-600 hover:underline">
                            #{order._id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium">{order.user?.name}</div>
                          <div className="text-xs text-gray-400">{order.user?.email}</div>
                        </td>
                        <td className="px-3 py-3 text-gray-500">{order.items.length}</td>
                        <td className="px-3 py-3 font-medium">{formatPrice(order.total)}</td>
                        <td className="px-3 py-3">
                          <span className={`text-xs font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => updateStatus(order._id, e.target.value)}
                            disabled={updatingId === order._id}
                            className={`text-xs border rounded px-2 py-1 capitalize ${getOrderStatusColor(order.orderStatus)}`}
                          >
                            {['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-gray-400 whitespace-nowrap text-xs">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3">
                          <Link to={`/orders/${order._id}`} className="text-blue-600 text-xs hover:underline">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.pages > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t">
                  {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-sm rounded ${p === page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>{p}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
