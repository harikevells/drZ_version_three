import React, { useState, useEffect, useRef } from 'react';
import './MedicalCamp.css';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse } from 'date-fns';
import Pagination from '../components/Pagination';

const CustomDateInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
    <div className="custom-date-input-wrapper" onClick={onClick}>
        <input
            className="date-input"
            value={value}
            onClick={onClick}
            onChange={() => { }}
            placeholder={placeholder}
            ref={ref}
            required
        />
        <svg className="calendar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    </div>
));

const MedicalCamp = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [activeStatus, setActiveStatus] = useState(false);
    const [image, setImage] = useState('');
    const [fileName, setFileName] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/push-notifications`);
            setNotifications(res.data);
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                // Compress image to avoid 413 Payload Too Large
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to 0.7 quality JPEG
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setImage(compressedDataUrl);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChooseFileClick = () => {
        fileInputRef.current.click();
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setFromDate(null);
        setToDate(null);
        setActiveStatus(false);
        setImage('');
        setFileName('');
        setEditingId(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formattedFromDate = fromDate ? format(fromDate, 'dd/MM/yyyy') : '';
        const formattedToDate = toDate ? format(toDate, 'dd/MM/yyyy') : '';

        const payload = {
            title,
            description,
            fromDate: formattedFromDate,
            toDate: formattedToDate,
            image,
            activeStatus,
            role: 'admin'
        };

        try {
            if (editingId) {
                await axios.put(`${API_BASE_URL}/push-notifications/${editingId}`, payload);
                alert("Notification updated successfully");
            } else {
                await axios.post(`${API_BASE_URL}/push-notifications`, payload);
                alert("Notification created successfully");
            }
            resetForm();
            fetchNotifications();
        } catch (error) {
            console.error("Error submitting notification", error);
            alert("Failed to save notification");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item._id || item.id);
        setTitle(item.title);
        setDescription(item.description);

        let parsedFrom = null;
        if (item.fromDate) {
            parsedFrom = item.fromDate.includes('-')
                ? parse(item.fromDate, 'yyyy-MM-dd', new Date())
                : parse(item.fromDate, 'dd/MM/yyyy', new Date());
        }
        setFromDate(parsedFrom && !isNaN(parsedFrom) ? parsedFrom : null);

        let parsedTo = null;
        if (item.toDate) {
            parsedTo = item.toDate.includes('-')
                ? parse(item.toDate, 'yyyy-MM-dd', new Date())
                : parse(item.toDate, 'dd/MM/yyyy', new Date());
        }
        setToDate(parsedTo && !isNaN(parsedTo) ? parsedTo : null);

        setActiveStatus(item.activeStatus);
        setImage(item.image);
        setFileName(item.image ? "image_uploaded" : "");
        
        // Scroll to top of the content container
        const wrapper = document.querySelector('.content-wrapper');
        if (wrapper) {
            wrapper.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this notification?")) {
            try {
                await axios.delete(`${API_BASE_URL}/push-notifications/${id}`);
                fetchNotifications();
            } catch (error) {
                console.error("Error deleting notification", error);
                alert("Failed to delete notification");
            }
        }
    };

    // Filter Logic
    const filteredNotifications = notifications.filter(item => {
        const search = searchTerm.toLowerCase().trim();
        if (!search) return true;

        const itemTitle = String(item.title || '').toLowerCase();
        const itemDesc = String(item.description || '').toLowerCase();
        const itemStatus = item.activeStatus ? 'active' : 'inactive';
        const dateRange = `${item.fromDate || ''} - ${item.toDate || ''}`.toLowerCase();

        return (
            itemTitle.includes(search) ||
            itemDesc.includes(search) ||
            itemStatus.includes(search) ||
            dateRange.includes(search)
        );
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const currentNotifications = filteredNotifications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="medical-camp-container">
            <div className="header-container">
                <h1 className="page-title">Push Notification</h1>
                {/* <div className="icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="20" height="16" rx="4" fill="#6B7AFF" />
                        <circle cx="12" cy="12" r="3" fill="#FFF" />
                        <path d="M6 8H8M18 8H16" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div> */}
            </div>

            <form className="form-container" onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="input-group">
                        <label>Title</label>
                        <input
                            type="text"
                            className="text-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Description</label>
                        <input
                            type="text"
                            className="text-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="input-group">
                        <label>Date</label>
                        <div className="date-group">
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                dateFormat="dd/MM/yyyy"
                                customInput={<CustomDateInput placeholder="From Date" />}
                                required
                            />
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                dateFormat="dd/MM/yyyy"
                                customInput={<CustomDateInput placeholder="To Date" />}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group upload-group">
                        <label>Image Upload</label>
                        <div className="upload-box">
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <div className="upload-icon-container">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#6B7AFF" />
                                    <path d="M14 2V8H20" stroke="#FFF" strokeWidth="2" strokeLinejoin="round" />
                                    <path d="M10 13L12 11M12 11L14 13M12 11V17" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p className="upload-text">Click the button below to<br />upload your files.</p>
                            <button type="button" className="choose-file-btn" onClick={handleChooseFileClick}>
                                {fileName ? "Change File" : "Choose File"}
                            </button>
                            {fileName && <p className="file-name">{fileName}</p>}
                        </div>
                    </div>
                </div>

                <div className="form-row status-row">
                    <div className="input-group toggle-group">
                        <label>Active Status</label>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={activeStatus}
                                onChange={(e) => setActiveStatus(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                <div className="submit-container">
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? (editingId ? 'Updating...' : 'Submitting...') : (editingId ? 'Update' : 'Submit')}
                    </button>
                    {editingId && (
                        <button type="button" className="cancel-btn" onClick={resetForm}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="list-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '15px', flexWrap: 'wrap' }}>
                <h2 className="list-title">List</h2>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', width: '250px', outline: 'none' }}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentNotifications.length > 0 ? currentNotifications.map((item) => (
                            <tr key={item._id || item.id}>
                                <td>{item.title}</td>
                                <td>{item.description}</td>
                                <td>{item.fromDate} - {item.toDate}</td>
                                <td className={item.activeStatus ? 'status-active' : 'status-inactive'}>
                                    {item.activeStatus ? 'Active' : 'Inactive'}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="edit-btn" onClick={() => handleEdit(item)}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button className="delete-btn" onClick={() => handleDelete(item._id || item.id)}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="empty-message">No push notifications found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {filteredNotifications.length > itemsPerPage && (
                <div style={{ marginTop: '20px' }}>
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={filteredNotifications.length}
                        itemsPerPage={itemsPerPage}
                    />
                </div>
            )}
        </div>
    );
};

export default MedicalCamp;
