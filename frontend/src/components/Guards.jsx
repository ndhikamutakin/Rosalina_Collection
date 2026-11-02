import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './ui';

// Wajib login
export function ProtectedRoute({ children }) {
  const { user, loading, manualLogout } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={manualLogout ? undefined : { from: location }} />;
  return children;
}

// Wajib peran tertentu (sama dengan authorize(...) di backend)
export function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export function HomeRedirect() {
  const { isOwner } = useAuth();
  return <Navigate to={isOwner ? '/monitoring' : '/work-order'} replace />;
}
