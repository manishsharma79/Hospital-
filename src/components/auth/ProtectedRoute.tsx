import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useHMIS } from '../../context/HMISContext';
import { UserRole } from '../../types/hmis';
import { getRoleHomeRoute, getRoleLabel } from '../../utils/hmisHelpers';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { currentUser } = useHMIS();
  const location = useLocation();
  const navigate = useNavigate();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8FC] p-6">
        <div className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">Access Restricted</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Your account is signed in as{' '}
            <span className="font-semibold text-slate-900">{getRoleLabel(currentUser.role)}</span>.
            You do not have permission to open this clinical module.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(getRoleHomeRoute(currentUser.role), { replace: true })}
              className="rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap"
            >
              Return to My Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
