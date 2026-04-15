import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import CourseContent from "./pages/CourseContent";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("subscription-user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("subscription-user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("subscription-user");
  };

  const handleUserUpdate = (userData) => {
    setUser(userData);
    localStorage.setItem("subscription-user", JSON.stringify(userData));
  };

  return (
    <Routes>
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/dashboard"
        element={
          user ? (
            user.role === "admin" ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <UserDashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
            )
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route path="/content/:courseId/:contentType/:itemIndex" element={user ? <CourseContent /> : <Navigate to="/" />} />
    </Routes>
  );
}

export default App;
