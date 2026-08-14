import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPhoneAlt, FaVideo, FaMicrophoneSlash, FaVideoSlash, FaPhoneSlash, FaDesktop, FaUserInjured } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import './DoctorVideoCall.css';

const DoctorVideoCall = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  
  // Call Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected
  
  const timerRef = useRef(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const storedData = sessionStorage.getItem('doctorData');
      if (storedData) {
        const user = JSON.parse(storedData);
        const res = await axios.get(`${API_BASE_URL}/appointments/all/${encodeURIComponent(user.doctorName)}`);
        
        // Filter for online appointments today that are approved
        const onlineAppts = res.data.filter(app => 
          app.status?.toLowerCase() === 'approved' && 
          ((app.appointment_type || '').toLowerCase().includes('online') || app.video_call === 'Yes')
        );
        
        setAppointments(onlineAppts);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCall = async (appt) => {
    setActiveCall(appt);
    setCallStatus('calling');
    setCallDuration(0);
    
    // Simulate connection delay
    setTimeout(() => {
      setCallStatus('connected');
      startTimer();
    }, 2000);

    // In a real implementation with ZegoCloud or Jitsi:
    // 1. Send push notification to patient app
    // 2. Initialize Web SDK here
    /*
      await axios.post(`${API_BASE_URL}/push-notifications/send-call`, {
        bookingId: appt.id || appt._id,
        roomId: `drz_${appt.id || appt._id}`,
        doctorName: doctorName,
        patientMobile: appt.login_mobile
      });
    */
  };

  const endCall = () => {
    setCallStatus('idle');
    setActiveCall(null);
    stopTimer();
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="doc-vc-container">
        
        {/* Active Call UI */}
        {activeCall ? (
          <div className="doc-vc-active-call">
            <div className="doc-vc-video-area">
              {/* Remote Video Placeholder */}
              <div className="doc-vc-remote-video bg-slate-900">
                {callStatus === 'calling' ? (
                  <div className="doc-vc-status-msg">
                    <div className="doc-vc-pulse-ring"></div>
                    <h2>Calling {activeCall.patient_name}...</h2>
                    <p>Waiting for patient to join</p>
                  </div>
                ) : (
                  <div className="doc-vc-status-msg">
                    <FaUserInjured size={64} color="#475569" />
                    <h2 style={{ marginTop: '20px' }}>{activeCall.patient_name}</h2>
                    <p className="doc-vc-timer">{formatTime(callDuration)}</p>
                  </div>
                )}
                
                {/* Local Video Picture-in-Picture */}
                <div className={`doc-vc-local-video ${isVideoOff ? 'bg-slate-800' : 'bg-slate-700'}`}>
                  {isVideoOff ? (
                    <FaVideoSlash size={24} color="#94A3B8" />
                  ) : (
                    <span style={{color: '#94A3B8', fontSize: '12px'}}>You</span>
                  )}
                </div>
              </div>

              {/* Call Controls */}
              <div className="doc-vc-controls">
                <button 
                  className={`doc-vc-control-btn ${isMuted ? 'active-mute' : ''}`}
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophoneSlash size={20} color="#334155" />}
                </button>
                
                <button 
                  className={`doc-vc-control-btn ${isVideoOff ? 'active-mute' : ''}`}
                  onClick={() => setIsVideoOff(!isVideoOff)}
                >
                  {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} color="#334155" />}
                </button>
                
                <button className="doc-vc-control-btn">
                  <FaDesktop size={20} color="#334155" />
                </button>

                <button className="doc-vc-control-btn end-call" onClick={endCall}>
                  <FaPhoneSlash size={20} color="#FFF" />
                </button>
              </div>
            </div>

            {/* Patient Details Panel */}
            <div className="doc-vc-side-panel">
              <div className="doc-vc-panel-header">
                <h3>Patient Details</h3>
              </div>
              <div className="doc-vc-panel-content">
                <div className="doc-vc-detail-group">
                  <label>Name</label>
                  <p>{activeCall.patient_name}</p>
                </div>
                <div className="doc-vc-detail-group">
                  <label>Booking ID</label>
                  <p>{activeCall.booking_id || 'N/A'}</p>
                </div>
                <div className="doc-vc-detail-group">
                  <label>Appointment</label>
                  <p>{activeCall.appointment_date} • {activeCall.appointment_time}</p>
                </div>
                <div className="doc-vc-detail-group">
                  <label>Symptoms / Category</label>
                  <p>{activeCall.treatment_category || 'General Consultation'}</p>
                </div>
                
                <button className="doc-vc-write-rx-btn">
                  Write Prescription
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* List of Pending Video Calls */
          <div className="doc-vc-list-view">
            <div className="doc-vc-list-header">
              <h3>Upcoming Online Consultations</h3>
            </div>
            
            <div className="doc-vc-list">
              {loading ? (
                <div className="doc-vc-empty">Loading online appointments...</div>
              ) : appointments.length === 0 ? (
                <div className="doc-vc-empty">
                  <FaVideo size={48} color="#CBD5E1" style={{marginBottom: '15px'}} />
                  <p>No online consultations scheduled.</p>
                </div>
              ) : (
                <div className="doc-vc-grid">
                  {appointments.map(appt => (
                    <div key={appt.id || appt._id} className="doc-vc-card">
                      <div className="doc-vc-card-avatar">
                        {appt.patient_name ? appt.patient_name.charAt(0) : 'U'}
                      </div>
                      <div className="doc-vc-card-info">
                        <h4>{appt.patient_name}</h4>
                        <p>{appt.appointment_time}</p>
                        <span className="doc-vc-badge">Online</span>
                      </div>
                      <button className="doc-vc-start-btn" onClick={() => startCall(appt)}>
                        <FaPhoneAlt size={12} /> Call
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

    </div>
  );
};

export default DoctorVideoCall;
