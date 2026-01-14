/**
 * Protected Route Component
 *
 * @description Wrapper component that requires authentication to access
 */

import * as React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { authService } from '@/services/auth.service';

export function ProtectedRoute(): React.JSX.Element {
  const isLoggedIn = authService.isLoggedIn();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
