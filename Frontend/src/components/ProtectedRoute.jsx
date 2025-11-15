import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/authService";

export default function ProtectedRoute({ children }) {
  try {
    const authenticated = isAuthenticated();
    
    if (!authenticated) {
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (error) {
    console.error("ProtectedRoute error:", error);
    return <Navigate to="/login" replace />;
  }
}

