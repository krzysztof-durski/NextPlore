import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/authService";

export default function GuestRoute({ children }) {
  // If user is logged in, redirect to home page
  // Only unauthenticated users can access login/register pages
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

