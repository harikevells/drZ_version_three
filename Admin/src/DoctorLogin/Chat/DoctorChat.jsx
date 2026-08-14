import React from 'react';
import { FaTools } from 'react-icons/fa';
import './DoctorChat.css';

const DoctorChat = () => {
  return (
    <div className="doc-chat-container">
        <div className="doc-chat-card">
          {/* If the image exists in assets, you can replace the icon with an image tag.
              <img src="/assets/chatimage.png" alt="Under Construction" className="doc-chat-img" /> 
          */}
          <FaTools size={80} color="#CBD5E1" className="doc-chat-icon" />
          <h1 className="doc-uc-text">UNDER<br/>CONSTRUCTION</h1>
          <p className="doc-uc-subtext">We're working hard to bring you the best messaging experience. Stay tuned!</p>
        </div>
    </div>
  );
};

export default DoctorChat;
