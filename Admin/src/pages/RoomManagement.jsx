import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
  FaBed, FaPlus, FaSearch, FaUserInjured, 
  FaDoorOpen, FaTimes, FaDoorClosed, FaBroom, FaTools, FaEdit, FaCheck, FaImage, FaUpload, FaTrash
} from 'react-icons/fa';
import './RoomManagement.css';

const INITIAL_AMENITIES = { ac: false, tv: false, wifi: false, bathroom: false, fridge: false };

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [floorFilter, setFloorFilter] = useState('All');

  // Modals
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [admitRoom, setAdmitRoom] = useState(null);
  const [dischargeRoom, setDischargeRoom] = useState(null);

  // Form States
  const defaultRoomState = { roomNo: '', type: 'Private', floor: '1st Floor', capacity: '1', price: '', description: '', amenities: { ...INITIAL_AMENITIES }, status: 'Available', image: null };
  const [newRoom, setNewRoom] = useState(defaultRoomState);
  const [editRoom, setEditRoom] = useState(null);
  
  // Admit Form State
  const [admissionData, setAdmissionData] = useState({ 
    name: '', id: '', date: new Date().toISOString().split('T')[0], time: '', profileImage: null 
  });

  // Discharge Form State
  const [dischargeData, setDischargeData] = useState({
    dischargeDate: new Date().toISOString().split('T')[0],
    dischargeTime: ''
  });

  // Fetch Rooms
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_BASE_URL}/rooms`, config);
      setRooms(res.data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Derived state
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const matchSearch = r.roomNo.includes(searchTerm) || (r.patient && r.patient.name && r.patient.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchFloor = floorFilter === 'All' || r.floor === floorFilter;
      return matchSearch && matchStatus && matchFloor;
    });
  }, [rooms, searchTerm, statusFilter, floorFilter]);

  const stats = useMemo(() => {
    return {
      total: rooms.length,
      available: rooms.filter(r => r.status === 'Available').length,
      occupied: rooms.filter(r => r.status === 'Occupied').length,
      maintenance: rooms.filter(r => r.status === 'Maintenance').length,
      cleaning: rooms.filter(r => r.status === 'Cleaning').length,
      working: rooms.filter(r => r.status === 'Working').length
    };
  }, [rooms]);

  // Handlers for images
  const handleImageUpload = (e, targetState, setTargetState) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTargetState({ ...targetState, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePatientImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdmissionData({ ...admissionData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // CRUD Handlers
  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.roomNo || !newRoom.price || !newRoom.capacity) return;
    
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE_URL}/rooms`, newRoom, config);
      setIsAddRoomOpen(false);
      setNewRoom(defaultRoomState);
      fetchRooms(); // refresh
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room");
    }
  };

  const handleEditRoomSubmit = async (e) => {
    e.preventDefault();
    if (!editRoom.roomNo || !editRoom.price || !editRoom.capacity) return;

    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE_URL}/rooms/${editRoom.id}`, editRoom, config);
      setIsEditRoomOpen(false);
      setEditRoom(null);
      fetchRooms(); // refresh
    } catch (error) {
      console.error("Error updating room:", error);
      alert("Failed to update room");
    }
  };

  const handleDeleteRoom = async (id) => {
    if(!window.confirm("Are you sure you want to permanently delete this room?")) return;
    
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE_URL}/rooms/${id}`, config);
      setIsEditRoomOpen(false);
      fetchRooms();
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Failed to delete room");
    }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    if (!admissionData.name || !admissionData.id) return;

    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE_URL}/rooms/${admitRoom.id}/admit`, admissionData, config);
      
      setAdmitRoom(null);
      setAdmissionData({ name: '', id: '', date: new Date().toISOString().split('T')[0], time: '', profileImage: null });
      fetchRooms();
    } catch (error) {
      console.error("Error admitting patient:", error);
      alert("Failed to admit patient");
    }
  };

  const handleDischarge = async (e) => {
    e.preventDefault();
    if (!dischargeRoom) return;
    
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = {
        ...dischargeData,
        patientId: dischargeRoom.patient?.id,
        patientName: dischargeRoom.patient?.name
      };

      await axios.post(`${API_BASE_URL}/rooms/${dischargeRoom.id}/discharge`, payload, config);
      setDischargeRoom(null);
      fetchRooms();
    } catch (error) {
      console.error("Error discharging patient:", error);
      alert("Failed to discharge patient");
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Available': return <FaDoorOpen />;
      case 'Occupied': return <FaUserInjured />;
      case 'Maintenance': return <FaTools />;
      case 'Cleaning': return <FaBroom />;
      case 'Working': return <FaCheck />;
      default: return <FaDoorClosed />;
    }
  };

  const getStatusBadgeClass = (status) => {
    if(!status) return 'default';
    const s = status.toLowerCase();
    if (s === 'available') return 'available';
    if (s === 'occupied') return 'occupied';
    if (s === 'maintenance') return 'maintenance';
    if (s === 'cleaning') return 'cleaning';
    if (s === 'working') return 'working';
    return 'default';
  };

  if (loading) {
    return <div className="rm-wrapper" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'80vh'}}>Loading Rooms...</div>;
  }

  return (
    <div className="room-management-container">
      <div className="rm-header">
        <h2>Room & Bed Management</h2>
        <button className="rm-add-btn" onClick={() => setIsAddRoomOpen(true)}>
          <FaPlus /> Add New Room
        </button>
      </div>

      <div className="rm-stats-grid">
        <div className="rm-stat-card">
          <div className="rm-stat-icon total"><FaBed /></div>
          <div className="rm-stat-info">
            <h4>Total Rooms</h4>
            <p>{stats.total}</p>
          </div>
        </div>
        <div className="rm-stat-card">
          <div className="rm-stat-icon available"><FaDoorOpen /></div>
          <div className="rm-stat-info">
            <h4>Available</h4>
            <p>{stats.available}</p>
          </div>
        </div>
        <div className="rm-stat-card">
          <div className="rm-stat-icon occupied"><FaUserInjured /></div>
          <div className="rm-stat-info">
            <h4>Occupied</h4>
            <p>{stats.occupied}</p>
          </div>
        </div>
        <div className="rm-stat-card">
          <div className="rm-stat-icon cleaning" style={{background: '#e0f2fe', color: '#0284c7'}}><FaBroom /></div>
          <div className="rm-stat-info">
            <h4>Cleaning</h4>
            <p>{stats.cleaning}</p>
          </div>
        </div>
        <div className="rm-stat-card">
          <div className="rm-stat-icon maintenance"><FaTools /></div>
          <div className="rm-stat-info">
            <h4>Maintenance</h4>
            <p>{stats.maintenance}</p>
          </div>
        </div>
      </div>

      <div className="rm-controls">
        <div className="rm-tabs">
          {['All', 'Available', 'Occupied', 'Maintenance', 'Cleaning', 'Working'].map(tab => (
            <div 
              key={tab} 
              className={`rm-tab ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
        <div className="rm-search-filter">
          <div className="rm-search">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search Room or Patient..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="rm-filter-select"
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
          >
            <option value="All">All Floors</option>
            <option value="1st Floor">1st Floor</option>
            <option value="2nd Floor">2nd Floor</option>
            <option value="3rd Floor">3rd Floor</option>
          </select>
        </div>
      </div>

      <div className="rm-grid">
        {filteredRooms.length === 0 ? (
          <div className="rm-empty-state">
            <FaBed className="rm-empty-icon" />
            <h3>No Rooms Found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredRooms.map(room => (
            <div className="rm-card" key={room.id}>
              {room.image && (
                <div className="rm-card-image" style={{backgroundImage: `url(${room.image})`}}></div>
              )}
              <div className="rm-card-header">
                <div className="rm-room-no">
                  <div className="rm-room-icon">
                    {getStatusIcon(room.status)}
                  </div>
                  <div>
                    <h3 style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      {room.roomNo} 
                      <button className="rm-edit-icon-btn" onClick={() => { setEditRoom({...room}); setIsEditRoomOpen(true); }} title="Edit Room">
                        <FaEdit size={12} />
                      </button>
                    </h3>
                    <p className="rm-room-type">{room.type} • {room.floor}</p>
                  </div>
                </div>
                <span className={`rm-status-badge ${getStatusBadgeClass(room.status)}`}>
                  {room.status}
                </span>
              </div>
              
              <div className="rm-card-body">
                <div className="rm-details">
                  <div className="rm-detail-row" style={{justifyContent: 'space-between'}}>
                    <div>
                      <span className="rm-detail-icon">₹</span>
                      <span><strong>{room.price}</strong> / Day</span>
                    </div>
                    <div style={{fontSize: '13px', color: '#64748b', fontWeight: '500'}}>
                      Capacity: {room.capacity}
                    </div>
                  </div>
                  
                  {room.amenities && (
                    <div className="rm-amenities-tags">
                      {room.amenities.ac && <span>AC</span>}
                      {room.amenities.tv && <span>TV</span>}
                      {room.amenities.wifi && <span>Wi-Fi</span>}
                      {room.amenities.bathroom && <span>Attached Bath</span>}
                      {room.amenities.fridge && <span>Fridge</span>}
                    </div>
                  )}
                </div>

                {room.status === 'Occupied' && room.patient && (
                  <div className="rm-patient-info" style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                    {room.patient.profileImage ? (
                       <img src={room.patient.profileImage} alt="Patient" style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
                    ) : (
                       <div style={{width: '40px', height: '40px', borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5'}}><FaUserInjured /></div>
                    )}
                    <div>
                      <div className="rm-patient-name" style={{marginBottom: '2px'}}>
                        {room.patient.name}
                      </div>
                      <div className="rm-patient-meta">
                        <span>ID: {room.patient.id}</span>
                        <span>Admitted: {room.patient.date} {room.patient.time && `at ${room.patient.time}`}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rm-card-footer">
                {room.status === 'Available' && (
                  <button className="rm-btn rm-btn-primary" onClick={() => setAdmitRoom(room)}>
                    Admit Patient
                  </button>
                )}
                
                {room.status === 'Occupied' && (
                  <button className="rm-btn rm-btn-danger" onClick={() => setDischargeRoom(room)}>
                    Discharge / Vacate
                  </button>
                )}

                {['Cleaning', 'Maintenance', 'Working'].includes(room.status) && (
                  <button className="rm-btn rm-btn-outline" onClick={() => { setEditRoom({...room}); setIsEditRoomOpen(true); }}>
                    Update Status
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Room Modal */}
      {isAddRoomOpen && (
        <div className="rm-modal-overlay">
          <div className="rm-modal">
            <div className="rm-modal-header">
              <h3>Create New Room</h3>
              <button className="rm-close-btn" type="button" onClick={() => setIsAddRoomOpen(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleAddRoom}>
              <div className="rm-modal-body">
                {/* Image Upload Section */}
                <div className="rm-image-upload-container">
                  <label>Room Image</label>
                  {newRoom.image ? (
                    <div className="rm-image-preview">
                      <img src={newRoom.image} alt="Room Preview" />
                      <button type="button" className="rm-remove-img-btn" onClick={() => setNewRoom({...newRoom, image: null})}><FaTimes /></button>
                    </div>
                  ) : (
                    <div className="rm-image-dropzone">
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, newRoom, setNewRoom)} id="room-img-upload" hidden />
                      <label htmlFor="room-img-upload" className="rm-upload-label">
                        <FaUpload className="upload-icon" />
                        <span>Click to upload room image</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="rm-form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                  <div className="rm-form-group" style={{marginBottom: 0}}>
                    <label>Room Number *</label>
                    <input type="text" className="rm-form-control" required placeholder="e.g. 104" value={newRoom.roomNo} onChange={e => setNewRoom({...newRoom, roomNo: e.target.value})} />
                  </div>
                  <div className="rm-form-group" style={{marginBottom: 0}}>
                    <label>Room Type *</label>
                    <select className="rm-form-control" value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})}>
                      <option>General Ward</option>
                      <option>Private</option>
                      <option>Semi-Private</option>
                      <option>ICU</option>
                    </select>
                  </div>
                  <div className="rm-form-group" style={{marginBottom: 0}}>
                    <label>Floor *</label>
                    <select className="rm-form-control" value={newRoom.floor} onChange={e => setNewRoom({...newRoom, floor: e.target.value})}>
                      <option>Ground Floor</option>
                      <option>1st Floor</option>
                      <option>2nd Floor</option>
                      <option>3rd Floor</option>
                    </select>
                  </div>
                  <div className="rm-form-group" style={{marginBottom: 0}}>
                    <label>Bed Capacity *</label>
                    <input type="number" className="rm-form-control" required min="1" placeholder="1" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} />
                  </div>
                  <div className="rm-form-group" style={{gridColumn: '1 / -1', marginBottom: 0}}>
                    <label>Room Charges (Per Day) *</label>
                    <input type="number" className="rm-form-control" required placeholder="1500" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} />
                  </div>
                  <div className="rm-form-group" style={{gridColumn: '1 / -1', marginBottom: 0}}>
                    <label>Description</label>
                    <textarea className="rm-form-control" rows="2" placeholder="AC Room with attached bathroom" value={newRoom.description} onChange={e => setNewRoom({...newRoom, description: e.target.value})}></textarea>
                  </div>
                  <div className="rm-form-group" style={{gridColumn: '1 / -1', marginBottom: 0}}>
                    <label>Amenities</label>
                    <div className="rm-checkbox-group" style={{display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '5px'}}>
                      <label style={{display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', fontSize: '13px', cursor: 'pointer'}}>
                        <input type="checkbox" checked={newRoom.amenities.ac} onChange={e => setNewRoom({...newRoom, amenities: {...newRoom.amenities, ac: e.target.checked}})} /> AC
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', fontSize: '13px', cursor: 'pointer'}}>
                        <input type="checkbox" checked={newRoom.amenities.tv} onChange={e => setNewRoom({...newRoom, amenities: {...newRoom.amenities, tv: e.target.checked}})} /> TV
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', fontSize: '13px', cursor: 'pointer'}}>
                        <input type="checkbox" checked={newRoom.amenities.wifi} onChange={e => setNewRoom({...newRoom, amenities: {...newRoom.amenities, wifi: e.target.checked}})} /> Wi-Fi
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', fontSize: '13px', cursor: 'pointer'}}>
                        <input type="checkbox" checked={newRoom.amenities.bathroom} onChange={e => setNewRoom({...newRoom, amenities: {...newRoom.amenities, bathroom: e.target.checked}})} /> Attached Bathroom
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', fontSize: '13px', cursor: 'pointer'}}>
                        <input type="checkbox" checked={newRoom.amenities.fridge} onChange={e => setNewRoom({...newRoom, amenities: {...newRoom.amenities, fridge: e.target.checked}})} /> Refrigerator
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rm-modal-footer">
                <button type="button" className="rm-btn-cancel" onClick={() => setIsAddRoomOpen(false)}>Cancel</button>
                <button type="submit" className="rm-btn-save">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {isEditRoomOpen && editRoom && (
        <div className="rm-modal-overlay">
          <div className="rm-modal">
            <div className="rm-modal-header">
              <h3>Edit Room Details</h3>
              <div style={{display:'flex', gap:'10px'}}>
                <button type="button" className="rm-btn-danger" style={{padding: '6px 12px', border: 'none', borderRadius: '6px'}} onClick={() => handleDeleteRoom(editRoom.id)}>
                  <FaTrash /> Delete
                </button>
                <button className="rm-close-btn" type="button" onClick={() => setIsEditRoomOpen(false)}><FaTimes /></button>
              </div>
            </div>
            <form onSubmit={handleEditRoomSubmit}>
              <div className="rm-modal-body">
                {/* Image Upload Section for Edit */}
                <div className="rm-image-upload-container">
                  <label>Room Image</label>
                  {editRoom.image ? (
                    <div className="rm-image-preview">
                      <img src={editRoom.image} alt="Room Preview" />
                      <button type="button" className="rm-remove-img-btn" onClick={() => setEditRoom({...editRoom, image: null})}><FaTimes /></button>
                    </div>
                  ) : (
                    <div className="rm-image-dropzone">
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, editRoom, setEditRoom)} id="edit-room-img-upload" hidden />
                      <label htmlFor="edit-room-img-upload" className="rm-upload-label">
                        <FaUpload className="upload-icon" />
                        <span>Click to upload room image</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="rm-form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                  
                  {/* Status update is a prominent feature in edit */}
                  <div className="rm-form-group" style={{gridColumn: '1 / -1', marginBottom: 0, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                    <label style={{color: '#4f46e5'}}>Update Room Status</label>
                    <select className="rm-form-control" value={editRoom.status} onChange={e => setEditRoom({...editRoom, status: e.target.value})} style={{fontWeight: '600', color: '#1e293b'}}>
                      <option value="Available">🟢 Available</option>
                      <option value="Occupied" disabled={!editRoom.patient}>🔴 Occupied</option>
                      <option value="Maintenance">🟠 Maintenance</option>
                      <option value="Cleaning">🔵 Cleaning</option>
                      <option value="Working">🟣 Working</option>
                    </select>
                    {editRoom.status === 'Occupied' && !editRoom.patient && (
                      <p style={{fontSize: '11px', color: '#dc2626', marginTop: '4px', marginBottom: 0}}>You can only set to Occupied by admitting a patient.</p>
                    )}
                  </div>

                  <div className="rm-form-group" style={{marginBottom: 0}}>
                    <label>Room Number *</label>
                    <input type="text" className="rm-form-control" required value={editRoom.roomNo} onChange={e => setEditRoom({...editRoom, roomNo: e.target.value})} />
                  </div>
                  <div className="rm-form-group" style={{marginBottom: 0}}>
                    <label>Room Type *</label>
                    <select className="rm-form-control" value={editRoom.type} onChange={e => setEditRoom({...editRoom, type: e.target.value})}>
                      <option>General Ward</option>
                      <option>Private</option>
                      <option>Semi-Private</option>
                      <option>ICU</option>
                    </select>
                  </div>
                  <div className="rm-form-group" style={{marginBottom: 0}}>
                    <label>Floor *</label>
                    <select className="rm-form-control" value={editRoom.floor} onChange={e => setEditRoom({...editRoom, floor: e.target.value})}>
                      <option>Ground Floor</option>
                      <option>1st Floor</option>
                      <option>2nd Floor</option>
                      <option>3rd Floor</option>
                    </select>
                  </div>
                  <div className="rm-form-group" style={{marginBottom: 0}}>
                    <label>Bed Capacity *</label>
                    <input type="number" className="rm-form-control" required min="1" value={editRoom.capacity} onChange={e => setEditRoom({...editRoom, capacity: e.target.value})} />
                  </div>
                  <div className="rm-form-group" style={{gridColumn: '1 / -1', marginBottom: 0}}>
                    <label>Room Charges (Per Day) *</label>
                    <input type="number" className="rm-form-control" required value={editRoom.price} onChange={e => setEditRoom({...editRoom, price: e.target.value})} />
                  </div>
                  <div className="rm-form-group" style={{gridColumn: '1 / -1', marginBottom: 0}}>
                    <label>Description</label>
                    <textarea className="rm-form-control" rows="2" value={editRoom.description} onChange={e => setEditRoom({...editRoom, description: e.target.value})}></textarea>
                  </div>
                  <div className="rm-form-group" style={{gridColumn: '1 / -1', marginBottom: 0}}>
                    <label>Amenities</label>
                    <div className="rm-checkbox-group" style={{display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '5px'}}>
                      <label style={{display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', fontSize: '13px', cursor: 'pointer'}}>
                        <input type="checkbox" checked={editRoom.amenities.ac} onChange={e => setEditRoom({...editRoom, amenities: {...editRoom.amenities, ac: e.target.checked}})} /> AC
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', fontSize: '13px', cursor: 'pointer'}}>
                        <input type="checkbox" checked={editRoom.amenities.tv} onChange={e => setEditRoom({...editRoom, amenities: {...editRoom.amenities, tv: e.target.checked}})} /> TV
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', fontSize: '13px', cursor: 'pointer'}}>
                        <input type="checkbox" checked={editRoom.amenities.wifi} onChange={e => setEditRoom({...editRoom, amenities: {...editRoom.amenities, wifi: e.target.checked}})} /> Wi-Fi
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', fontSize: '13px', cursor: 'pointer'}}>
                        <input type="checkbox" checked={editRoom.amenities.bathroom} onChange={e => setEditRoom({...editRoom, amenities: {...editRoom.amenities, bathroom: e.target.checked}})} /> Attached Bathroom
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', fontSize: '13px', cursor: 'pointer'}}>
                        <input type="checkbox" checked={editRoom.amenities.fridge} onChange={e => setEditRoom({...editRoom, amenities: {...editRoom.amenities, fridge: e.target.checked}})} /> Refrigerator
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rm-modal-footer">
                <button type="button" className="rm-btn-cancel" onClick={() => setIsEditRoomOpen(false)}>Cancel</button>
                <button type="submit" className="rm-btn-save">Update Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admit Patient Modal */}
      {admitRoom && (
        <div className="rm-modal-overlay">
          <div className="rm-modal">
            <div className="rm-modal-header">
              <h3>Admit Patient (Room {admitRoom.roomNo})</h3>
              <button className="rm-close-btn" type="button" onClick={() => setAdmitRoom(null)}><FaTimes /></button>
            </div>
            <form onSubmit={handleAdmit}>
              <div className="rm-modal-body">
                
                {/* Profile Image Upload */}
                <div style={{display: 'flex', justifyContent: 'center', marginBottom: '20px'}}>
                  <div style={{position: 'relative', width: '80px', height: '80px'}}>
                    {admissionData.profileImage ? (
                      <img src={admissionData.profileImage} alt="Profile" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                    ) : (
                      <div style={{width: '100%', height: '100%', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1'}}>
                        <FaUserInjured size={24} color="#94a3b8" />
                      </div>
                    )}
                    <label style={{position: 'absolute', bottom: '-5px', right: '-5px', background: '#4f46e5', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white'}}>
                      <FaUpload size={10} />
                      <input type="file" accept="image/*" onChange={handlePatientImageUpload} hidden />
                    </label>
                  </div>
                </div>

                <div className="rm-form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                  <div className="rm-form-group" style={{gridColumn: '1 / -1', marginBottom: 0}}>
                    <label>Patient Name *</label>
                    <input type="text" className="rm-form-control" required placeholder="Enter Name" value={admissionData.name} onChange={e => setAdmissionData({...admissionData, name: e.target.value})} />
                  </div>
                  <div className="rm-form-group" style={{gridColumn: '1 / -1', marginBottom: 0}}>
                    <label>Patient ID *</label>
                    <input type="text" className="rm-form-control" required placeholder="e.g. P100X" value={admissionData.id} onChange={e => setAdmissionData({...admissionData, id: e.target.value})} />
                  </div>
                  <div className="rm-form-group" style={{marginBottom: 0}}>
                    <label>Admission Date *</label>
                    <input type="date" className="rm-form-control" required value={admissionData.date} onChange={e => setAdmissionData({...admissionData, date: e.target.value})} />
                  </div>
                  <div className="rm-form-group" style={{marginBottom: 0}}>
                    <label>Admission Time</label>
                    <input type="time" className="rm-form-control" value={admissionData.time} onChange={e => setAdmissionData({...admissionData, time: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="rm-modal-footer">
                <button type="button" className="rm-btn-cancel" onClick={() => setAdmitRoom(null)}>Cancel</button>
                <button type="submit" className="rm-btn-save">Admit Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Form Modal */}
      {dischargeRoom && (
        <div className="rm-modal-overlay">
          <div className="rm-modal" style={{maxWidth: '500px'}}>
            <div className="rm-modal-header">
              <h3>Discharge Patient</h3>
              <button className="rm-close-btn" type="button" onClick={() => setDischargeRoom(null)}><FaTimes /></button>
            </div>
            <form onSubmit={handleDischarge}>
              <div className="rm-modal-body">
                <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px'}}>
                  <p style={{margin: '0 0 10px 0', fontSize: '14px', color: '#475569'}}>You are about to discharge:</p>
                  <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    {dischargeRoom.patient?.profileImage ? (
                       <img src={dischargeRoom.patient.profileImage} alt="Patient" style={{width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover'}} />
                    ) : (
                       <div style={{width: '48px', height: '48px', borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5'}}><FaUserInjured size={20} /></div>
                    )}
                    <div>
                      <h4 style={{margin: '0 0 4px 0', color: '#1e293b'}}>{dischargeRoom.patient?.name}</h4>
                      <p style={{margin: 0, fontSize: '12px', color: '#64748b'}}>ID: {dischargeRoom.patient?.id} | Admitted: {dischargeRoom.patient?.date}</p>
                    </div>
                  </div>
                </div>

                <div className="rm-form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                  <div className="rm-form-group" style={{marginBottom: 0}}>
                    <label>Discharge Date *</label>
                    <input type="date" className="rm-form-control" required value={dischargeData.dischargeDate} onChange={e => setDischargeData({...dischargeData, dischargeDate: e.target.value})} />
                  </div>
                  <div className="rm-form-group" style={{marginBottom: 0}}>
                    <label>Discharge Time *</label>
                    <input type="time" className="rm-form-control" required value={dischargeData.dischargeTime} onChange={e => setDischargeData({...dischargeData, dischargeTime: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="rm-modal-footer">
                <button type="button" className="rm-btn-cancel" onClick={() => setDischargeRoom(null)}>Cancel</button>
                <button type="submit" className="rm-btn-save" style={{background: '#dc2626'}}>Confirm Discharge</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoomManagement;
