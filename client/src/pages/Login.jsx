import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchJson } from "../api";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      const profile = await fetchJson(`/api/users/profile?email=${encodeURIComponent(data.user.email)}`);
      onLogin({ ...data.user, enrolledCourses: profile.enrolledCourses });
      navigate("/dashboard");
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
          <h1>Where Skills Become Power</h1>
          <p>Sign in to access your personalized learning dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </label>

          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>

          {error && <p className="error-message">{error}</p>}
        </form>

        <div className="auth-links">
          <p>
            New here? <Link to="/register">Create an account</Link>
          </p>
          <p>
            <Link to="/forgot-password">Forgot password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
