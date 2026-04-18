import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
    return () => dispatch(clearError());
  }, [user, navigate, from, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(form));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Login</h1>
          <p className="text-sm text-gray-500 mb-6">Get access to your Orders, Wishlist and Recommendations</p>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter Email"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter Password"
                required
                className="input-field"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 mb-4">
              By continuing, you agree to ShopKart's Terms of Use and Privacy Policy.
            </p>
            <Link to="/register" className="text-blue-600 font-medium text-sm hover:underline">
              New to ShopKart? Create an account
            </Link>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-gray-600">
            <strong>Demo accounts:</strong><br />
            Admin: admin@ecomm.com / admin123<br />
            User: john@example.com / password123
          </div>
        </div>
      </div>
    </div>
  );
}
