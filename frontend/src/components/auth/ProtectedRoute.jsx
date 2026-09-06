import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-tech-blue border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If supervisor tries to access operator or vice versa, redirect appropriately
    if (user.role === "SUPERVISOR") {
      return <Navigate to="/supervisor/dashboard" replace />;
    } else if (user.role === "OPERATOR") {
      return <Navigate to="/operator/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}
