import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FilterPage from "./pages/FilterPage";
import LocationDetails from "./pages/LocationDetails";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/filter" element={<FilterPage />} />
        <Route path="/location/:id" element={<LocationDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
