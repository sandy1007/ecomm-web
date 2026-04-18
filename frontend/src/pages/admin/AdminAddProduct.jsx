import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const CATEGORIES = ['Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Books', 'Beauty', 'Toys', 'Grocery'];

const defaultForm = {
  name: '', description: '', price: '', discountPrice: '',
  category: 'Electronics', brand: '', stock: '', images: [''],
  featured: false, tags: '', specifications: [{ key: '', value: '' }],
};

export default function AdminAddProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`).then((r) => {
        const p = r.data;
        setForm({
          name: p.name, description: p.description, price: p.price, discountPrice: p.discountPrice || '',
          category: p.category, brand: p.brand, stock: p.stock, images: p.images.length ? p.images : [''],
          featured: p.featured, tags: p.tags?.join(', ') || '',
          specifications: p.specifications?.length ? p.specifications : [{ key: '', value: '' }],
        });
      }).catch(() => toast.error('Failed to load product'));
    }
  }, [id, isEdit]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setSpec = (i, key, val) => {
    const specs = [...form.specifications];
    specs[i] = { ...specs[i], [key]: val };
    set('specifications', specs);
  };

  const setImg = (i, val) => {
    const imgs = [...form.images];
    imgs[i] = val;
    set('images', imgs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discountPrice: Number(form.discountPrice) || 0,
        stock: Number(form.stock),
        images: form.images.filter(Boolean),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        specifications: form.specifications.filter((s) => s.key && s.value),
      };

      if (isEdit) {
        await api.put(`/admin/products/${id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/admin/products', payload);
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="card p-5 grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} required className="input-field" placeholder="e.g. Samsung Galaxy S24" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} required rows={3} className="input-field resize-none" placeholder="Product description..." />
              </div>
              {[
                { key: 'brand', label: 'Brand *', placeholder: 'Samsung', req: true },
                { key: 'price', label: 'Price (₹) *', placeholder: '29999', req: true, type: 'number' },
                { key: 'discountPrice', label: 'Discount Price (₹)', placeholder: '24999', type: 'number' },
                { key: 'stock', label: 'Stock *', placeholder: '100', req: true, type: 'number' },
              ].map(({ key, label, placeholder, req, type = 'text' }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={(e) => set(key, e.target.value)} required={req} min={type === 'number' ? 0 : undefined} className="input-field" placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input-field">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input value={form.tags} onChange={(e) => set('tags', e.target.value)} className="input-field" placeholder="smartphone, 5G, android" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">Featured product (shown on homepage)</label>
              </div>
            </div>

            {/* Images */}
            <div className="card p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product Images (URLs)</label>
              {form.images.map((img, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="url" value={img} onChange={(e) => setImg(i, e.target.value)} className="input-field" placeholder="https://example.com/image.jpg" />
                  {form.images.length > 1 && (
                    <button type="button" onClick={() => set('images', form.images.filter((_, j) => j !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded">
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => set('images', [...form.images, ''])} className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                <FiPlus /> Add Image
              </button>
            </div>

            {/* Specifications */}
            <div className="card p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Specifications</label>
              {form.specifications.map((spec, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={spec.key} onChange={(e) => setSpec(i, 'key', e.target.value)} className="input-field w-1/3" placeholder="Display" />
                  <input value={spec.value} onChange={(e) => setSpec(i, 'value', e.target.value)} className="input-field flex-1" placeholder="6.8 inches AMOLED" />
                  {form.specifications.length > 1 && (
                    <button type="button" onClick={() => set('specifications', form.specifications.filter((_, j) => j !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded">
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => set('specifications', [...form.specifications, { key: '', value: '' }])} className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                <FiPlus /> Add Specification
              </button>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary px-8">
                {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
              </button>
              <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
