import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import HomeScreen from "./pages/homescreen";
import Register from "./pages/register";
import ProtectedRoute from "./routes/protectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/homescreen"
          element={
            <ProtectedRoute>
              <HomeScreen />
            </ProtectedRoute>
          }
        />
        {/* Redirige cualquier ruta no válida al login */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
