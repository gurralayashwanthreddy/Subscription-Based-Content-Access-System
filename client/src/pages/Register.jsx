import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchJson } from "../api";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [adminPin, setAdminPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await fetchJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role, adminPin })
      });

      setSuccess("Account created. Redirecting to login...");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page shell">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Register as a new user to access the dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              required
            />
          </label>

          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {role === "admin" && (
            <label>
              Admin PIN
              <input
                type="password"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Enter admin pin"
                required
              />
            </label>
          )}

          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
        </form>

        <div className="auth-links">
          <p>
            Already have an account? <Link to="/">Login</Link>
          </p>
          <p>
            Forgot password? <Link to="/forgot-password">Reset here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
