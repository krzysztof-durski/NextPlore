import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../services/authService";

export default function UnverifiedRoute({ children }) {
  const location = useLocation();

  // If user is logged in, redirect to login page
  if (isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Check if email is provided via navigation state (from registration)
  // or if there's a pending verification email in localStorage
  const hasEmailInState = !!location.state?.email;
  const hasPendingVerification = !!localStorage.getItem("pendingVerificationEmail");

  // If no email in state and no pending verification, redirect to login
  // This ensures only users coming from registration or with pending verification can access
  if (!hasEmailInState && !hasPendingVerification) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

