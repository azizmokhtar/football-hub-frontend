import React from 'react';
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, useAuthUser } from '@/stores/auth.store';

// Forbid authenticated users from seeing pages like Login/Register
export const GuestGuard = ({ children }: { children: React.ReactElement }) => {
  const { accessToken } = useAuth();
  if (accessToken) {
    return <Navigate to="/app" replace />;
  }
  return children;
};

// Protect routes that require authentication
export const AuthGuard = ({ children }: { children: React.ReactElement }) => {
  const { accessToken } = useAuth();
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
};


export const AdminGuard = ({ children }: { children: React.ReactElement }) => {
  const user = useAuthUser();
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/app" replace />;
  }
  return children;
};


