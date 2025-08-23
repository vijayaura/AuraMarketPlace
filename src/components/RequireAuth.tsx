import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { setAuthToken } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

interface RequireAuthProps {
  children: ReactNode;
  requiredRole?: string;
}

export const RequireAuth = ({ children, requiredRole }: RequireAuthProps) => {
  const location = useLocation();

  let token: string | null = null;
  let userRole: string | null = null;
  try {
    token = getAuthToken();
    const userRaw = localStorage.getItem("authUser");
    if (userRaw) {
      const user = JSON.parse(userRaw);
      userRole = user?.role ?? null;
    }
  } catch {
    // ignore storage access issues
  }

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (requiredRole && userRole && userRole !== requiredRole) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default RequireAuth;


