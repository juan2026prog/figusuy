import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { canAccessBusinessDashboard } from '../helpers/businessAccess';

export default function BusinessAccessGuard({ children }) {
  const profile = useAuthStore((state) => state.profile);

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  // If approved business or admin
  if (canAccessBusinessDashboard(profile)) {
    return children;
  }

  // If pending
  if (profile.business_status === 'pending') {
    return <Navigate to="/business/pending" replace />;
  }

  // If suspended
  if (profile.business_status === 'suspended') {
    // We could have a suspended page, for now redirect to apply which might handle it or just profile
    return <Navigate to="/business/suspended" replace />;
  }

  // Otherwise, user needs to apply
  return <Navigate to="/business/apply" replace />;
}
