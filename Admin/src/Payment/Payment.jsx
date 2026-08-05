import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { FaEye, FaTimes } from 'react-icons/fa';
import Pagination from '../components/Pagination';
import './Payment.css';

const Payment = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  const matchDate = (itemDate, selectedDate) => {
    if (!selectedDate) return true;
    if (!itemDate) return false;

    const [y, m, d] = selectedDate.split('-');
    const selectedDDMMYYYY = `${d}/${m}/${y}`;
    const selectedDDMMDotYYYY = `${d}/${m}.${y}`;
    const selectedDDMMDotYYYYAlt = `${parseInt(d, 10)}/${parseInt(m, 10)}.${y}`;
    const selectedDDMMYYYYAlt = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;

    const cleanItemDate = String(itemDate).replace(/\s+/g, '');

    return (
      cleanItemDate === selectedDate ||
      cleanItemDate === selectedDDMMYYYY ||
      cleanItemDate === selectedDDMMDotYYYY ||
      cleanItemDate === selectedDDMMDotYYYYAlt ||
      cleanItemDate === selectedDDMMYYYYAlt ||
      cleanItemDate.includes(selectedDDMMYYYY) ||
      cleanItemDate.includes(selectedDDMMDotYYYY)
    );
  };

  const filteredAppointments = appointments.filter(appt => {
    if (!matchDate(appt.appointment_date, dateFilter)) {
      return false;
    }

    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    const patientName = String(appt.patient_name || '').toLowerCase();
    const bookingId = String(appt.booking_id || appt.id || appt._id || '').toLowerCase();
    const paymentId = String(appt.payment_id || '').toLowerCase();

    return (
      patientName.includes(search) ||
      bookingId.includes(search) ||
      paymentId.includes(search)
    );
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await fetch(`${API_BASE_URL}/emails/all-appointments`, config);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { 
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ payment_status: newStatus })
      };

      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/payment-status`, config);
      
      if (response.ok) {
        setAppointments(prev => prev.map(appt => {
          if (appt._id === appointmentId || appt.id === appointmentId) {
            return { ...appt, payment_status: newStatus };
          }
          return appt;
        }));
      } else {
        console.error('Failed to update payment status');
        alert("Failed to update payment status.");
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert("Error updating payment status.");
    }
  };

  const handleMethodChange = async (appointmentId, newMethod) => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { 
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ payment_method: newMethod })
      };

      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/payment-method`, config);
      
      if (response.ok) {
        setAppointments(prev => prev.map(appt => {
          if (appt._id === appointmentId || appt.id === appointmentId) {
            return { ...appt, payment_method: newMethod };
          }
          return appt;
        }));
      } else {
        console.error('Failed to update payment method');
        alert("Failed to update payment method.");
      }
    } catch (error) {
      console.error('Error updating method:', error);
      alert("Error updating payment method.");
    }
  };

  const handleView = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const getDisplayMethod = (method) => {
      if (!method) return 'Cash';
      const m = method.toLowerCase();
      if (m === 'razorpay' || m === 'online') return 'Online';
      if (m === 'card') return 'Card';
      return 'Cash';
  };

  return (
    <div className="payment-details-container">
      <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '15px', flexWrap: 'wrap' }}>
        <h2>Payment Details</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none', color: '#4b5563' }}
          />
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
        {loading ? (
          <p className="loading-text">Loading payments...</p>
        ) : (
          <>
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Patient Name</th>
                  <th>Date</th>
                  <th>Payment ID</th>
                  <th>Consult Fee</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAppointments.length > 0 ? paginatedAppointments.map((appt) => {
                  const methodDisplay = getDisplayMethod(appt.payment_method);
                  const currentStatus = (appt.payment_status || 'Pending').toLowerCase();
                  return (
                  <tr key={appt.id || appt._id}>
                    <td>{appt.booking_id || '0000'}</td>
                    <td>{appt.patient_name}</td>
                    <td>{appt.appointment_date ? appt.appointment_date.replace(/\s+/g, '') : ''}</td>
                    <td>{appt.payment_id || 'N/A'}</td>
                    <td style={{ fontWeight: 'bold' }}>₹{appt.consultation_fee || 0}</td>
                    <td>
                      <select 
                        className={`payment-dropdown ${methodDisplay.toLowerCase() === 'online' ? 'online' : methodDisplay.toLowerCase() === 'card' ? 'card' : 'cash'}`}
                        style={{ width: '100px' }}
                        value={methodDisplay}
                        onChange={(e) => handleMethodChange(appt._id || appt.id, e.target.value === 'Online' ? 'Razorpay' : e.target.value)}
                      >
                        <option value="Online">Online</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        className={`payment-dropdown ${currentStatus}`}
                        value={currentStatus === 'paid' ? 'Paid' : currentStatus === 'refunds' ? 'Refunds' : 'Pending'}
                        onChange={(e) => handleStatusChange(appt._id || appt.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Refunds">Refunds</option>
                      </select>
                    </td>
                    <td>
                      <button className="view-btn" onClick={() => handleView(appt)}>
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                )}) : (
                  <tr>
                    <td colSpan="8" className="text-center">No payments found</td>
                  </tr>
                )}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredAppointments.length}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </div>

      {isModalOpen && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Payment & Booking Details</h3>
              <button className="close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body-grid">
              <div className="detail-column">
                <div className="detail-row">
                  <span className="detail-label">Booking ID:</span>
                  <span className="detail-value">{selectedAppointment.booking_id || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Patient Name:</span>
                  <span className="detail-value">{selectedAppointment.patient_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedAppointment.whatsapp_number || selectedAppointment.login_mobile}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date & Time:</span>
                  <span className="detail-value">{selectedAppointment.appointment_date} | {selectedAppointment.appointment_time}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Doctor Name:</span>
                  <span className="detail-value">{selectedAppointment.doctor_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment ID:</span>
                  <span className="detail-value" style={{ wordBreak: 'break-all' }}>{selectedAppointment.payment_id || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Method:</span>
                  <span className="detail-value">{getDisplayMethod(selectedAppointment.payment_method)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Fee:</span>
                  <span className="detail-value" style={{ fontWeight: 'bold', color: '#2563eb' }}>
                    ₹{selectedAppointment.consultation_fee || 0}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value" style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {selectedAppointment.payment_status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
