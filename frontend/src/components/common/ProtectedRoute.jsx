import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
