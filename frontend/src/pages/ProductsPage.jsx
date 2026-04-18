import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchProducts } from '../store/slices/productSlice';
import ProductCard from '../components/product/ProductCard';
import ProductFilters from '../components/product/ProductFilters';
import Loader from '../components/common/Loader';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useBugsnagFlowContext } from '../hooks/useBugsnag.jsx';
import bugsnagManager from '../utils/bugsnag.jsx';

const SORT_OPTIONS = [
  { label: 'Relevance', value: '-createdAt' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Best Rating', value: '-ratings.avg' },
  { label: 'Newest First', value: '-createdAt' },
];

export default function ProductsPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: products, pagination, loading } = useSelector((s) => s.products);

  const params = Object.fromEntries(searchParams.entries());

  useBugsnagFlowContext('Product Discovery');

  useEffect(() => {
    dispatch(fetchProducts(params));
  }, [searchParams.toString(), dispatch]);

  // Track search and filter actions as breadcrumbs
  useEffect(() => {
    const keyword = searchParams.get('keyword');
    const category = searchParams.get('category');
    if (keyword) {
      bugsnagManager.trackSearch(keyword, pagination.total);
    }
    if (category) {
      bugsnagManager.leaveBreadcrumb('Category Filter Applied', { category }, 'user');
    }
  }, [searchParams.toString()]);

  const setSort = (val) => {
    bugsnagManager.leaveBreadcrumb('Sort Applied', { sortBy: val }, 'user');
    const p = new URLSearchParams(searchParams);
    p.set('sort', val);
    p.delete('page');
    setSearchParams(p);
  };

  const setPage = (p) => {
    const ps = new URLSearchParams(searchParams);
    ps.set('page', p);
    setSearchParams(ps);
    window.scrollTo(0, 0);
  };

  const keyword = searchParams.get('keyword');
  const category = searchParams.get('category');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb + heading */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          {keyword && <>Search results for "<strong>{keyword}</strong>" · </>}
          {category && <>{category} · </>}
          {pagination.total} products found
        </p>
      </div>

      <div className="flex gap-6">
        <ProductFilters />

        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-4 bg-white p-3 rounded border border-gray-200">
            <span className="text-sm text-gray-600 font-medium">Sort by:</span>
            <div className="flex gap-2 flex-wrap">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value + opt.label}
                  onClick={() => setSort(opt.value)}
                  className={`text-xs px-3 py-1 rounded border transition-colors ${
                    params.sort === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:border-blue-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <Loader text="Loading products..." />
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-600 text-lg font-medium">No products found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search terms</p>
              <Link to="/products" className="text-blue-600 text-sm hover:underline mt-4 inline-block">Clear filters</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <FiChevronLeft />
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded text-sm ${
                        p === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
