import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import Login from "./components/pages/login";
import Signup from "./components/pages/sign-up";
import Dashboard from "./components/pages/dashboard";
import TemperaturePage from "./components/pages/temperature-page";
import ProtectedRoute from "./utils/ProtectedRoutes";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🌐 Pages accessibles sans être connecté */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<Signup />} />

        {/* 🔒 Routes protégées */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/temperature"
          element={
            <ProtectedRoute>
              <TemperaturePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
