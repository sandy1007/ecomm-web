import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Loader from '../../components/common/Loader';
import { formatPrice, getOrderStatusColor } from '../../utils/helpers';
import api from '../../services/api';
import { FiPackage, FiShoppingBag, FiUsers, FiDollarSign } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Products', value: stats.totalProducts, icon: FiPackage, color: 'bg-blue-500' },
    { label: 'Total Orders', value: stats.totalOrders, icon: FiShoppingBag, color: 'bg-orange-500' },
    { label: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'bg-green-500' },
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: FiDollarSign, color: 'bg-purple-500' },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-800 mb-6">Dashboard</h1>

          {loading ? <Loader text="Loading stats..." /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card) => (
                  <div key={card.label} className="card p-4">
                    <div className="flex items-center gap-3">
                      <div className={`${card.color} text-white p-2.5 rounded-lg`}>
                        <card.icon className="text-lg" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                        <p className="text-xs text-gray-500">{card.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order status breakdown */}
              {stats?.statusCounts?.length > 0 && (
                <div className="card p-4 mb-6">
                  <h2 className="font-semibold text-gray-700 mb-3">Orders by Status</h2>
                  <div className="flex flex-wrap gap-3">
                    {stats.statusCounts.map((s) => (
                      <span key={s._id} className={`text-sm font-medium px-3 py-1 rounded-full capitalize ${getOrderStatusColor(s._id)}`}>
                        {s._id}: {s.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent orders */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-700">Recent Orders</h2>
                  <Link to="/admin/orders" className="text-blue-600 text-sm hover:underline">View all</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map((h) => (
                          <th key={h} className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats?.recentOrders?.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-xs">#{order._id.slice(-8).toUpperCase()}</td>
                          <td className="px-3 py-2">{order.user?.name}</td>
                          <td className="px-3 py-2 font-medium">{formatPrice(order.total)}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getOrderStatusColor(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
