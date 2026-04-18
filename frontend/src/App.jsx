import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import { fetchCart } from './store/slices/cartSlice';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminAddProduct from './pages/admin/AdminAddProduct';

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token) dispatch(fetchCart());
  }, [token, dispatch]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />

          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute adminOnly><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/products/new" element={<ProtectedRoute adminOnly><AdminAddProduct /></ProtectedRoute>} />
          <Route path="/admin/products/:id/edit" element={<ProtectedRoute adminOnly><AdminAddProduct /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminOrders /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
