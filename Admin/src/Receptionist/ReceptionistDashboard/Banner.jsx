import React from 'react';
import { FaArrowRight } from 'react-icons/fa';
import './Banner.css';

const Banner = () => {
  return (
    <div className="rd-banner">
      <div className="rd-banner-decor"></div>
      <div className="rd-banner-subtitle">NEW APPOINTMENT MADE EASY</div>
      <div className="rd-banner-title">Book & manage patient appointments quickly and efficiently.</div>
      <button className="rd-banner-btn">
        View now 
        <span className="rd-banner-btn-icon"><FaArrowRight size={12} /></span>
      </button>
    </div>
  );
};

export default Banner;
