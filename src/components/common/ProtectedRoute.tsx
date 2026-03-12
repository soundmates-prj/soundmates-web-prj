import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

/**
 * ProtectedRoute component to guard routes based on authentication and role
 * @param children - Child components to render if authorized
 * @param requiredRole - Required role to access the route (e.g., "ADMIN")
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  // Check if user is authenticated
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    // Not authenticated, redirect to login
    return <Navigate to="/" replace />;
  }

  // Check role if required
  if (requiredRole) {
    const userInfoStr = localStorage.getItem('userInfo');
    
    if (!userInfoStr) {
      // User info not found, redirect to login
      return <Navigate to="/login" replace />;
    }

    try {
      const userInfo = JSON.parse(userInfoStr);
      const userRole = userInfo.roleName?.toUpperCase();
      
      if (userRole !== requiredRole.toUpperCase()) {
        // User doesn't have required role, redirect to home
        return <Navigate to="/" replace />;
      }
    } catch (error) {
      console.error('Failed to parse user info:', error);
      return <Navigate to="/login" replace />;
    }
  }

  // User is authenticated and has required role (if specified)
  return <>{children}</>;
}
