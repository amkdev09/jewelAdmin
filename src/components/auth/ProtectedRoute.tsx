import { Navigate, useLocation } from "react-router";
import Cookies from "js-cookie";

const PUBLIC_PATHS = ["/signin", "/signup", "/reset-password"];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const token = Cookies.get("token");
  const isPublic = PUBLIC_PATHS.some((p) => location.pathname.startsWith(p));

  if (isPublic) {
    if (token) return <Navigate to="/" replace />;
    return <>{children}</>;
  }

  if (!token) return <Navigate to="/signin" state={{ from: location }} replace />;
  return <>{children}</>;
}
