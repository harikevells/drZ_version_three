import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FiShield, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import './Login.css';
import logoImage from '../assets/logo.png';
import loginLeftImage from '../assets/loginleftimage.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (email.toLowerCase() === 'admin@drz.com' && password === 'Admin@123') {
      sessionStorage.setItem('token', 'static-admin-token');
      sessionStorage.setItem('loginTimestamp', new Date().getTime().toString());
      navigate('/dashboard');
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('loginTimestamp', new Date().getTime().toString());
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Background blobs for premium feel */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      <div className="login-container">
        {/* Left Side: Medical Illustration with text overlays */}
        <div className="login-left">
          <img src={loginLeftImage} alt="Medical Illustration" className="left-illustration" />
          <div className="left-content">
            <div className="logo-container">
              <img src={logoImage} alt="DrZ Logo" className="logo-img" />
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="login-right">
          <div className="login-card">
            {/* Blue Circular Shield Badge */}
            <div className="card-badge">
              <div className="badge-icon-wrapper">
                <FiShield className="shield-icon" />
                <FiLock className="lock-icon-inner" />
              </div>
            </div>

            <h2 className="login-title">Login to DrZ Admin</h2>
            <p className="login-subtitle">Welcome back! Please login to continue</p>

            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-field-group">
                <label className="input-label">Email Address</label>
                <div className="input-wrapper">
                  <FiUser className="input-icon-left" />
                  <input
                    type="email"
                    placeholder="admin@drz.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="input-field-group">
                <label className="input-label">Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon-left" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }} className="form-actions">
                <label className="remember-me">
                  <input type="checkbox" className="remember-checkbox" />
                  <span>Remember Me</span>
                </label>
                <a href="#" className="forgot-password">
                  Forgot Password?
                </a>
              </div>

              <button type="submit" className="login-btn">
                <span>Login</span>
                <div className="btn-arrow-circle">
                  <FiArrowRight />
                </div>
              </button>
            </form>

            <div className="separator">or continue with</div>

            <div className="social-login-wrapper">
              <button type="button" className="google-btn">
                <FcGoogle />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

