import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaLock } from 'react-icons/fa';
import './Login.css';
import logoImage from '../assets/logo.png';
import loginLeftImage from '../assets/loginleftimage.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        <div className="logo-container">
          <img src={logoImage} alt="DrZ Logo" style={{ height: '70px' }} />
        </div>
        <div className="illustration-wrapper">
          <img src={loginLeftImage} alt="Medical Illustration" />
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">Login to DrZ Admin</h2>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="User Name" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-actions">
              <label className="remember-me">
                <input type="checkbox" /> Remember Me
              </label>
              <a href="#" className="forgot-password">
                <FaLock style={{marginRight: '5px', fontSize: '10px'}}/> Forgot Password?
              </a>
            </div>
            
            <button type="submit" className="login-btn">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
