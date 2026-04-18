import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart, FiUser, FiSearch, FiMenu, FiX, FiLogOut, FiPackage, FiSettings } from 'react-icons/fi';
import { logout } from '../../store/slices/authSlice';
import { selectCartItemCount } from '../../store/slices/cartSlice';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const cartCount = useSelector(selectCartItemCount);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold whitespace-nowrap flex-shrink-0">
          <span className="italic">Shop</span>
          <span className="text-yellow-400">Kart</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="flex">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products, brands and more"
              className="w-full px-4 py-2 text-gray-800 text-sm rounded-l outline-none"
            />
            <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-r">
              <FiSearch className="text-gray-800 text-lg" />
            </button>
          </div>
        </form>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-auto">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1 hover:text-yellow-300"
              >
                <FiUser /> {user.name.split(' ')[0]}
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg py-1 z-50">
                  <Link to="/orders" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => setProfileOpen(false)}>
                    <FiPackage /> My Orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => setProfileOpen(false)}>
                      <FiSettings /> Admin Panel
                    </Link>
                  )}
                  <hr />
                  <button
                    onClick={() => { dispatch(logout()); setProfileOpen(false); navigate('/'); }}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-sm w-full text-left text-red-600"
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="hover:text-yellow-300 flex items-center gap-1">
              <FiUser /> Login
            </Link>
          )}

          <Link to="/cart" className="relative hover:text-yellow-300 flex items-center gap-1">
            <FiShoppingCart className="text-xl" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-yellow-400 text-gray-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Mobile cart */}
        <Link to="/cart" className="md:hidden relative ml-auto">
          <FiShoppingCart className="text-2xl" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-800 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-700 px-4 py-3 text-sm space-y-2">
          {user ? (
            <>
              <Link to="/orders" className="block py-1" onClick={() => setMenuOpen(false)}>My Orders</Link>
              {user.role === 'admin' && <Link to="/admin" className="block py-1" onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
              <button className="block py-1 text-red-300" onClick={() => { dispatch(logout()); setMenuOpen(false); navigate('/'); }}>Logout</button>
            </>
          ) : (
            <Link to="/login" className="block py-1" onClick={() => setMenuOpen(false)}>Login / Register</Link>
          )}
        </div>
      )}
    </header>
  );
}
