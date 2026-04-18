import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../store/slices/authSlice';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  useEffect(() => {
    if (user) navigate('/', { replace: true });
    return () => dispatch(clearError());
  }, [user, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(register(form));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Create Account</h1>
          <p className="text-sm text-gray-500 mb-6">Sign up to start shopping</p>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email' },
              { key: 'phone', label: 'Phone (optional)', type: 'tel', placeholder: 'Enter phone number' },
              { key: 'password', label: 'Password', type: 'password', placeholder: 'At least 6 characters' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  required={key !== 'phone'}
                  className="input-field"
                />
              </div>
            ))}
            <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-blue-600 font-medium text-sm hover:underline">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
