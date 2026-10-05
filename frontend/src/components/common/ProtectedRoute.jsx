import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FullPageSpinner } from './Spinner';

export default function ProtectedRoute({ children }) {
  useTranslation();
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) return <FullPageSpinner label={i18n.t('common:startingUp')} />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return children;
}
