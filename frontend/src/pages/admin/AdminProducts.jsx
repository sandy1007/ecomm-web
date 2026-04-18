import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Loader from '../../components/common/Loader';
import { formatPrice } from '../../utils/helpers';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';

export default function AdminProducts() {
  const [data, setData] = useState({ products: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/products?page=${page}&keyword=${keyword}&limit=15`);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove "${name}" from store?`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product removed');
      fetchProducts();
    } catch {
      toast.error('Failed to remove product');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">Products ({data.total})</h1>
            <Link to="/admin/products/new" className="btn-primary flex items-center gap-2 text-sm">
              <FiPlus /> Add Product
            </Link>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search products..." className="input-field max-w-xs" />
            <button type="submit" className="btn-secondary flex items-center gap-1 text-sm"><FiSearch />Search</button>
          </form>

          {loading ? <Loader /> : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.products.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.images[0] || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 object-contain bg-gray-50 rounded" />
                          <span className="font-medium line-clamp-1 max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.category}</td>
                      <td className="px-4 py-3">
                        <div>{formatPrice(p.discountPrice > 0 ? p.discountPrice : p.price)}</div>
                        {p.discountPrice > 0 && <div className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.ratings.avg > 0 ? `${p.ratings.avg.toFixed(1)} ★ (${p.ratings.count})` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link to={`/admin/products/${p._id}/edit`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <FiEdit />
                          </Link>
                          <button onClick={() => handleDelete(p._id, p.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
