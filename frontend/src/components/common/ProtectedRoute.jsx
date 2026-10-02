import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FullPageSpinner } from './Spinner';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) return <FullPageSpinner label="Đang khởi động" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return children;
}
