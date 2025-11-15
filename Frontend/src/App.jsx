import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import FilterPage from "./pages/FilterPage";
import LocationDetails from "./pages/LocationDetails";
import Account from "./pages/Account";
import ProtectedRoute from "./components/ProtectedRoute";
import UnverifiedRoute from "./components/UnverifiedRoute";
import GuestRoute from "./components/GuestRoute";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <UnverifiedRoute>
                <VerifyEmail />
              </UnverifiedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/filter" element={<FilterPage />} />
          <Route path="/location/:id" element={<LocationDetails />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
