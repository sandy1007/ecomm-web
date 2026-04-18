import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../store/slices/productSlice';
import ProductCard from '../components/product/ProductCard';
import Loader from '../components/common/Loader';
import { FiArrowRight } from 'react-icons/fi';

const CATEGORY_ICONS = {
  Electronics: '📱',
  Clothing: '👗',
  'Home & Kitchen': '🏠',
  Sports: '⚽',
  Books: '📚',
  Beauty: '💄',
  Toys: '🧸',
  Grocery: '🛒',
};

export default function HomePage() {
  const dispatch = useDispatch();
  const { items: products, categories, loading } = useSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchProducts({ featured: 'true', limit: 8 }));
  }, [dispatch]);

  return (
    <div>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to ShopKart</h1>
          <p className="text-xl text-blue-100 mb-8">Millions of products. Unbeatable prices. Free shipping.</p>
          <Link to="/products" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-3 rounded text-lg inline-flex items-center gap-2 transition">
            Shop Now <FiArrowRight />
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Shop by Category</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {(categories.length > 0 ? categories : Object.keys(CATEGORY_ICONS)).map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${encodeURIComponent(cat)}`}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-center"
            >
              <span className="text-2xl">{CATEGORY_ICONS[cat] || '📦'}</span>
              <span className="text-xs font-medium text-gray-700 leading-tight">{cat}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Featured Products</h2>
          <Link to="/products" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
            View all <FiArrowRight />
          </Link>
        </div>

        {loading ? (
          <Loader text="Loading products..." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Promo Banner */}
      <div className="bg-orange-50 border-y border-orange-100 py-8 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6 text-center">
          {[
            { icon: '🚚', title: 'Free Delivery', desc: 'On orders above ₹500' },
            { icon: '↩️', title: 'Easy Returns', desc: '30 days return policy' },
            { icon: '🔒', title: 'Secure Payments', desc: '100% secure transactions' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center">
              <span className="text-4xl mb-2">{item.icon}</span>
              <h3 className="font-semibold text-gray-800">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
