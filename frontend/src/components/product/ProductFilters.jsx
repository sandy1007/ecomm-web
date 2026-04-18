import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiFilter, FiX } from 'react-icons/fi';

const CATEGORIES = ['Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Books', 'Beauty', 'Toys', 'Grocery'];
const RATINGS = [4, 3, 2, 1];

export default function ProductFilters() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentCategory = searchParams.get('category') || '';
  const currentMin = searchParams.get('minPrice') || '';
  const currentMax = searchParams.get('maxPrice') || '';
  const currentRating = searchParams.get('minRating') || '';

  const applyFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    navigate(`/products?${params.toString()}`);
  };

  const clearFilters = () => navigate('/products');

  const hasFilters = currentCategory || currentMin || currentMax || currentRating;

  const FiltersContent = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <FiFilter /> Filters
        </h3>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <FiX /> Clear All
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Category</h4>
        {CATEGORIES.map((cat) => (
          <label key={cat} className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:text-blue-600">
            <input
              type="radio"
              name="category"
              checked={currentCategory === cat}
              onChange={() => applyFilter('category', currentCategory === cat ? '' : cat)}
              className="accent-blue-600"
            />
            {cat}
          </label>
        ))}
      </div>

      {/* Price */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Price Range</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={currentMin}
            onBlur={(e) => applyFilter('minPrice', e.target.value)}
            className="input-field text-xs"
          />
          <input
            type="number"
            placeholder="Max"
            defaultValue={currentMax}
            onBlur={(e) => applyFilter('maxPrice', e.target.value)}
            className="input-field text-xs"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Min Rating</h4>
        {RATINGS.map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:text-blue-600">
            <input
              type="radio"
              name="rating"
              checked={currentRating === String(r)}
              onChange={() => applyFilter('minRating', currentRating === String(r) ? '' : r)}
              className="accent-blue-600"
            />
            {r}★ & above
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block w-56 flex-shrink-0">
        <div className="card p-4 sticky top-20">
          <FiltersContent />
        </div>
      </aside>

      {/* Mobile toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 text-sm border border-gray-300 px-3 py-1.5 rounded bg-white"
        >
          <FiFilter /> Filter {hasFilters && <span className="bg-blue-600 text-white text-xs rounded-full px-1.5">!</span>}
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="w-72 bg-white h-full overflow-y-auto p-4">
              <FiltersContent />
              <button onClick={() => setMobileOpen(false)} className="mt-6 w-full btn-primary">Apply</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
