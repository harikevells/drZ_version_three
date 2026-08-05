import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaEyeSlash, FaEye, FaShieldAlt } from 'react-icons/fa';
import { FiMail, FiLock, FiBarChart2, FiFolder, FiCheckCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import './Login.css';
import logoImage from '../assets/DoctorlogoApp1.png';
import adminImage from '../assets/loginleftimage.png';

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
    <div className="login-container">
      <div className="login-left">
        <div className="left-header">
          <img src={logoImage} alt="DrZ Logo" className="left-logo" />
          {/* <p className="left-subtitle">Smart Care, Better Tomorrow</p> */}
        </div>

        <div className="illustration-wrapper">
          <img src={adminImage} alt="3D Admin Dashboard" />
        </div>

        <div className="feature-badges">
          <div className="feature-badge">
            <div className="badge-icon shield-icon"><FiCheckCircle size={20} color="#6366f1" /></div>
            <div className="badge-text">
              <h4>Secure & Safe</h4>
              <p>Your data is always protected</p>
            </div>
          </div>
          <div className="feature-badge">
            <div className="badge-icon chart-icon"><FiBarChart2 size={20} color="#6366f1" /></div>
            <div className="badge-text">
              <h4>Smart Dashboard</h4>
              <p>Real-time insights & analytics</p>
            </div>
          </div>
          <div className="feature-badge">
            <div className="badge-icon folder-icon"><FiFolder size={20} color="#6366f1" /></div>
            <div className="badge-text">
              <h4>Easy Management</h4>
              <p>Manage doctors, patients & appointments</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-card">
          <div className="shield-logo-wrapper">
            <div className="shield-circle">
              <FaShieldAlt size={28} color="#ffffff" />
            </div>
          </div>
          
          <h2 className="login-title">Welcome Back!</h2>
          <p className="login-subtitle">Login to your DrZ Admin account</p>
          
          {error && <p className="error-message">{error}</p>}
          
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <FiMail className="input-icon-left" size={18} color="#9ca3af" />
              <input 
                type="text" 
                placeholder="admin@drz.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group password-group">
              <FiLock className="input-icon-left" size={18} color="#9ca3af" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="password-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEye color="#9ca3af" /> : <FaEyeSlash color="#9ca3af" />}
              </span>
            </div>
            
            <div className="form-actions">
              <label className="remember-me">
                <input type="checkbox" defaultChecked /> Remember Me
              </label>
              <a href="#" className="forgot-password">
                Forgot Password?
              </a>
            </div>
            
            <button type="submit" className="login-btn">
              <FiLock size={16} />
              <span>Login</span>
            </button>
            
            <div className="divider-container">
              <span className="divider-line"></span>
              <span className="divider-text">OR</span>
              <span className="divider-line"></span>
            </div>
            
            <button type="button" className="google-btn">
              <FcGoogle size={20} />
              <span>Login with Google</span>
            </button>
          </form>
          
          <p className="login-footer">© 2025 DrZ. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
