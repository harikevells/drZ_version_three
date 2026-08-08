import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
  FaDownload, 
  FaSearch, 
  FaCalendarAlt, 
  FaUser, 
  FaPhoneAlt, 
  FaVenusMars, 
  FaFolderOpen, 
  FaUserMd, 
  FaCreditCard, 
  FaStethoscope, 
  FaCheck, 
  FaQrcode, 
  FaFileInvoiceDollar,
  FaSpinner,
  FaEye,
  FaTimes
} from 'react-icons/fa';
import logoImage from '../assets/DoctorlogoApp1.png';
import './PurchaseMedicine.css'; // Reuse our perfected A4 layout styles!

const BillingMedicine = () => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for generating PDF off-screen
  const [selectedBill, setSelectedBill] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // States for viewing billing details in popup
  const [selectedBillForView, setSelectedBillForView] = useState(null);
  const [showBillPopup, setShowBillPopup] = useState(false);

  useEffect(() => {
    fetchBillings();
  }, []);

  const fetchBillings = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_BASE_URL}/billings`, authHeader);
      // Sort billings to show the latest first
      const sorted = (res.data || []).sort((a, b) => {
        return new Date(b.createdAt || b.billDate) - new Date(a.createdAt || a.billDate);
      });
      setBillings(sorted);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching billing records:', error);
      setLoading(false);
    }
  };

  const handleDownloadPDF = (bill) => {
    if (downloadingId) return; // Prevent multiple simultaneous downloads
    setDownloadingId(bill._id || bill.id);
    setSelectedBill(bill);

    // Wait a brief moment for the hidden printable canvas to render the selected bill's data,
    // then capture and download it.
    setTimeout(() => {
      const element = document.getElementById('printable-bill-sheet');
      if (!element) {
        setDownloadingId(null);
        setSelectedBill(null);
        return;
      }

      document.body.classList.add('is-generating-pdf');

      const opt = {
        margin: 0.2,
        filename: `${bill.billNo || 'Invoice'}_Invoice.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      const triggerPdf = () => {
        if (window.html2pdf) {
          window.html2pdf().from(element).set(opt).save().then(() => {
            document.body.classList.remove('is-generating-pdf');
            setDownloadingId(null);
            setSelectedBill(null);
          }).catch(err => {
            console.error('PDF generation error:', err);
            document.body.classList.remove('is-generating-pdf');
            setDownloadingId(null);
            setSelectedBill(null);
          });
        } else {
          // Fallback if script is missing
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = () => {
            window.html2pdf().from(element).set(opt).save().then(() => {
              document.body.classList.remove('is-generating-pdf');
              setDownloadingId(null);
              setSelectedBill(null);
            }).catch(err => {
              console.error('PDF generation error:', err);
              document.body.classList.remove('is-generating-pdf');
              setDownloadingId(null);
              setSelectedBill(null);
            });
          };
          script.onerror = () => {
            alert('Could not load pdf library.');
            document.body.classList.remove('is-generating-pdf');
            setDownloadingId(null);
            setSelectedBill(null);
          };
          document.body.appendChild(script);
        }
      };

      // 150ms delay to allow full CSS calculation
      setTimeout(triggerPdf, 150);
    }, 100);
  };

  const numberToWords = (num) => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    let n = Math.round(num);
    if (n === 0) return 'Zero Rupees Only';

    const inWords = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
      return n.toString();
    };

    return inWords(n) + ' Rupees Only';
  };

  const filteredBillings = billings.filter(bill => {
    const q = searchQuery.toLowerCase();
    return (
      (bill.billNo || '').toLowerCase().includes(q) ||
      (bill.patientName || '').toLowerCase().includes(q) ||
      (bill.appointmentNo || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bill-page-wrapper">
      <div className="bill-top-action-bar no-print">
        <div className="action-bar-title">
          <FaFileInvoiceDollar size={24} color="#2563eb" />
          <div>
            <h2>Billing History & Invoices</h2>
            <p className="sub-header-appt-status">View and download completed patient medicine billing records</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bill-input-form-card no-print" style={{ marginBottom: '20px', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '8px 16px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
          <FaSearch color="#64748b" />
          <input
            type="text"
            placeholder="Search by Bill No, Patient Name, or Appointment No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#1e293b' }}
          />
        </div>
      </div>

      {/* Billings Table */}
      <div className="bill-input-form-card no-print" style={{ padding: '0px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', color: '#64748b' }}>
            <FaSpinner className="icon-spin" size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <span>Loading billing history...</span>
          </div>
        ) : filteredBillings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>
            No billing records found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Bill No</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Bill Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Appointment No</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Patient Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Age/Gender</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Doctor Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Payment Method</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Total Payable</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ color: '#334155' }}>
                {filteredBillings.map((bill, idx) => (
                  <tr key={bill._id || bill.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#0f172a' }}>{bill.billNo}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{bill.billDate}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '500' }}>{bill.appointmentNo || '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#2563eb' }}>{bill.patientName}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{bill.age || '-'} / {bill.gender || '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{bill.consultingDoctor}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span className={`payment-method-badge ${String(bill.paymentMethod || '').toLowerCase()}`}>
                        {bill.paymentMethod || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>₹ {parseFloat(bill.totalPayable || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          onClick={() => { setSelectedBillForView(bill); setShowBillPopup(true); }}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          <FaEye size={12} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(bill)}
                          disabled={downloadingId === (bill._id || bill.id)}
                          style={{
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            opacity: downloadingId === (bill._id || bill.id) ? 0.7 : 1
                          }}
                        >
                          <FaDownload size={11} />
                          <span>{downloadingId === (bill._id || bill.id) ? 'Downloading...' : 'PDF'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* HIDDEN PRINTABLE BILL CANVAS SHEET (Used for generating PDF on-demand)    */}
      {/* ========================================================================= */}
      {selectedBill && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div className="bill-sheet-container" id="printable-bill-sheet" style={{ margin: '0 !important' }}>
            {/* Sheet Top Header */}
            <div className="sheet-top-header">
              <div className="header-logo-area">
                <img src={logoImage} alt="DRZ Logo" className="drz-logo-img" />
              </div>

              <div className="header-clinic-info">
                <h1 className="clinic-main-title">DRZ HEALTHCARE</h1>
                <p className="clinic-tagline">Better Care, Better Life</p>
                <p className="clinic-address">123, Green Avenue, Anna Nagar, Chennai - 600040</p>
                <p className="clinic-contact">+91 98765 43210 | info@drzhealthcare.com | www.drzhealthcare.com</p>
              </div>

              <div className="header-bill-badge-box">
                <div className="bill-badge-header">
                  <FaFileInvoiceDollar size={18} />
                  <span>MEDICINE BILL</span>
                </div>
                <div className="bill-badge-body">
                  <div className="bill-row">
                    <span className="b-label">Bill No. :</span>
                    <span className="b-val">{selectedBill.billNo}</span>
                  </div>
                  <div className="bill-row">
                    <span className="b-label">Bill Date :</span>
                    <span className="b-val">{selectedBill.billDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient & Doctor Information Box */}
            <div className="patient-info-card-grid">
              <div className="info-left-section">
                <div className="info-item">
                  <FaCalendarAlt className="info-icon" />
                  <div className="info-text">
                    <span className="lbl">Appointment No</span>
                    <span className="val highlight-blue">{selectedBill.appointmentNo || '-'}</span>
                  </div>
                </div>

                <div className="info-item">
                  <FaPhoneAlt className="info-icon" />
                  <div className="info-text">
                    <span className="lbl">Mobile No</span>
                    <span className="val">{selectedBill.mobileNo || '-'}</span>
                  </div>
                </div>

                <div className="info-item">
                  <FaUser className="info-icon" />
                  <div className="info-text">
                    <span className="lbl">Patient Name</span>
                    <span className="val highlight-blue">{selectedBill.patientName || '-'}</span>
                  </div>
                </div>

                <div className="info-item">
                  <FaFolderOpen className="info-icon" />
                  <div className="info-text">
                    <span className="lbl">Treatment Category</span>
                    <span className="val highlight-blue">{selectedBill.treatmentCategory || 'General Medicine'}</span>
                  </div>
                </div>

                <div className="info-item">
                  <FaVenusMars className="info-icon" />
                  <div className="info-text">
                    <span className="lbl">Age / Gender</span>
                    <span className="val">{selectedBill.age || '-'} {selectedBill.age && selectedBill.gender ? '/' : ''} {selectedBill.gender || ''}</span>
                  </div>
                </div>

                <div className="info-item">
                  <FaUserMd className="info-icon" />
                  <div className="info-text">
                    <span className="lbl">Consulting Doctor</span>
                    <span className="val highlight-blue">{selectedBill.consultingDoctor || 'Dr. Vijay Kumar MD'}</span>
                  </div>
                </div>

                <div className="info-item">
                  <FaCreditCard className="info-icon" />
                  <div className="info-text">
                    <span className="lbl">Payment Method</span>
                    <span className="val highlight-blue">{selectedBill.paymentMethod || 'Cash'}</span>
                  </div>
                </div>

                <div className="info-item">
                  <FaStethoscope className="info-icon" />
                  <div className="info-text">
                    <span className="lbl">Doctor Consult Fee</span>
                    <span className="val highlight-blue">₹ {parseFloat(selectedBill.consultFee || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="info-right-instructions">
                <div className="rx-circle">
                  <span>R</span>
                  <span className="rx-x">x</span>
                </div>
                <div className="instructions-content">
                  <h4>Instructions :</h4>
                  <ul>
                    <li>Take medicines as advised by the doctor</li>
                    <li>Do not skip or stop the medicines without consulting your doctor</li>
                    <li>In case of any side effects, contact immediately</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Medicine Items Table */}
            <div className="medicine-table-wrapper">
              <table className="bill-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Medicine Name</th>
                    <th>Strength</th>
                    <th className="timing-th-group">
                      <div className="timing-main-title">Timing</div>
                      <div className="timing-sub-headers">
                        <span>Morning</span>
                        <span>Afternoon</span>
                        <span>Evening</span>
                        <span>Night</span>
                      </div>
                    </th>
                    <th>Intake<br />(Before / After)</th>
                    <th>Duration<br />(Days)</th>
                    <th>Qty</th>
                    <th>Rate<br />(₹)</th>
                    <th>Amount<br />(₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedBill.medicineItems || []).map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                      <td style={{ fontWeight: '600' }}>{item.medicineName}</td>
                      <td>{item.strength}</td>
                      <td>
                        <div className="timing-cells-flex">
                          <span className="timing-col">
                            {item.timing?.morning ? <><span className="icon-sun">☀️</span> <FaCheck className="check-green" /></> : <span className="dash-gray">-</span>}
                          </span>
                          <span className="timing-col">
                            {item.timing?.afternoon ? <><span className="icon-sun">🌤️</span> <FaCheck className="check-green" /></> : <span className="dash-gray">-</span>}
                          </span>
                          <span className="timing-col">
                            {item.timing?.evening ? <><span className="icon-sun">🌅</span> <FaCheck className="check-green" /></> : <span className="dash-gray">-</span>}
                          </span>
                          <span className="timing-col">
                            {item.timing?.night ? <><span className="icon-moon">🌙</span> <FaCheck className="check-green" /></> : <span className="dash-gray">-</span>}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`intake-badge ${item.intake === 'Before Food' ? 'intake-before' : 'intake-after'}`}>
                          {item.intake}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.duration}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</td>
                      <td style={{ textAlign: 'right' }}>{parseFloat(item.rate).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(item.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Section */}
            <div className="bottom-summary-grid">
              {/* Box 1: Amount Summary */}
              <div className="summary-box amount-summary-box">
                <div className="box-title">
                  <FaFileInvoiceDollar className="box-title-icon" />
                  <span>AMOUNT SUMMARY</span>
                </div>
                <div className="summary-rows-list">
                  <div className="sum-row">
                    <span>Total Medicine Amount</span>
                    <span className="val">₹ {(selectedBill.totalMedicineAmount !== undefined ? selectedBill.totalMedicineAmount : (parseFloat(selectedBill.totalPayable || 0) - parseFloat(selectedBill.consultFee || 0) + parseFloat(selectedBill.discount || 0) - (selectedBill.taxAmount !== undefined ? selectedBill.taxAmount : 0))).toFixed(2)}</span>
                  </div>
                  <div className="sum-row">
                    <span>Doctor Consultation Fee</span>
                    <span className="val">₹ {parseFloat(selectedBill.consultFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="sum-row">
                    <span>Discount</span>
                    <span className="val">₹ {parseFloat(selectedBill.discount || 0).toFixed(2)}</span>
                  </div>
                  <div className="sum-row">
                    <span>Tax (GST {selectedBill.taxPercent}%)</span>
                    <span className="val">₹ {(selectedBill.taxAmount !== undefined ? selectedBill.taxAmount : ((parseFloat(selectedBill.totalPayable || 0) - parseFloat(selectedBill.discount || 0)) * (parseFloat(selectedBill.taxPercent || 0) / 100))).toFixed(2)}</span>
                  </div>
                </div>
                <div className="total-payable-blue-bar">
                  <span>Total Payable</span>
                  <span className="total-num">₹ {parseFloat(selectedBill.totalPayable || 0).toFixed(2)}</span>
                </div>
                <div className="amount-in-words">
                  <span>Amount in Words :</span> <strong>{numberToWords(parseFloat(selectedBill.totalPayable || 0))}</strong>
                </div>
              </div>

              {/* Box 2: Note */}
              <div className="summary-box note-box">
                <div className="box-title">
                  <FaFolderOpen className="box-title-icon" />
                  <span>NOTE</span>
                </div>
                <ul className="note-bullets">
                  <li>Store medicines in a cool & dry place.</li>
                  <li>Keep medicines out of reach of children.</li>
                  <li>Complete the full course of medication for better results.</li>
                  <li>Follow up on : <strong>14-08-2026</strong></li>
                </ul>
              </div>

              {/* Box 3: Signature & QR Code */}
              <div className="summary-box signature-qr-box">
                <div className="signature-area">
                  <div className="signature-line">
                    <span className="sig-handwriting">{selectedBill.consultingDoctor ? (selectedBill.consultingDoctor.toLowerCase().startsWith('dr') ? selectedBill.consultingDoctor : `Dr. ${selectedBill.consultingDoctor}`) : 'Dr. Vijay Kumar'}</span>
                  </div>
                  <p className="dr-sig-name">{selectedBill.consultingDoctor || 'Dr. Vijay Kumar MD'}</p>
                  <p className="dr-reg-no">Reg No : 12345</p>
                </div>

                <div className="qr-code-area">
                  <div className="qr-placeholder">
                    <FaQrcode size={54} color="#0f172a" />
                  </div>
                  <span className="qr-caption">Scan for<br />Feedback</span>
                </div>
              </div>
            </div>

            {/* Bottom Full-Width Footer Bar */}
            <div className="sheet-footer-blue-bar">
              <span>📞 +91 98765 43210</span>
              <span>✉️ info@drzhealthcare.com</span>
              <span>🌐 www.drzhealthcare.com</span>
              <span>📍 123, Green Avenue, Anna Nagar, Chennai - 600040</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BILL DETAILS POPUP MODAL (Requested by User)                             */}
      {/* ========================================================================= */}
      {showBillPopup && selectedBillForView && (
        <div className="bill-popup-overlay no-print" onClick={() => { setShowBillPopup(false); setSelectedBillForView(null); }}>
          <div className="bill-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Invoice Details - {selectedBillForView.billNo}</h3>
              <button className="popup-close-btn" onClick={() => { setShowBillPopup(false); setSelectedBillForView(null); }}>
                <FaTimes />
              </button>
            </div>
            
            <div className="popup-body">
              {/* Header Info */}
              <div className="popup-info-grid">
                <div>
                  <p><strong>Bill Date:</strong> {selectedBillForView.billDate}</p>
                  <p><strong>Appointment No:</strong> {selectedBillForView.appointmentNo || 'N/A'}</p>
                  <p><strong>Patient Name:</strong> {selectedBillForView.patientName}</p>
                  <p><strong>Age / Gender:</strong> {selectedBillForView.age} / {selectedBillForView.gender}</p>
                </div>
                <div>
                  <p><strong>Mobile No:</strong> {selectedBillForView.mobileNo}</p>
                  <p><strong>Consulting Doctor:</strong> {selectedBillForView.consultingDoctor}</p>
                  <p><strong>Treatment Category:</strong> {selectedBillForView.treatmentCategory || 'General Medicine'}</p>
                  <p><strong>Payment Method:</strong> {selectedBillForView.paymentMethod}</p>
                </div>
              </div>

              {/* Medicines Table */}
              <h4 className="popup-section-title">Prescribed Medicines</h4>
              <div className="popup-table-container">
                <table className="popup-meds-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Medicine Name</th>
                      <th>Strength</th>
                      <th>(M-A-E-N)</th>
                      <th>Intake</th>
                      <th>Duration</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBillForView.medicineItems && selectedBillForView.medicineItems.length > 0 ? (
                      selectedBillForView.medicineItems.map((item, mIdx) => (
                        <tr key={item.id || mIdx}>
                          <td>{mIdx + 1}</td>
                          <td style={{ fontWeight: '600' }}>{item.medicineName}</td>
                          <td>{item.strength}</td>
                          <td>
                            {(item.timing?.morning ? '1' : '0')} - {(item.timing?.afternoon ? '1' : '0')} - {(item.timing?.evening ? '1' : '0')} - {(item.timing?.night ? '1' : '0')}
                          </td>
                          <td>{item.intake}</td>
                          <td>{item.duration} Days</td>
                          <td style={{ fontWeight: 'bold' }}>{item.qty}</td>
                          <td>₹ {parseFloat(item.rate || 0).toFixed(2)}</td>
                          <td style={{ fontWeight: 'bold' }}>₹ {parseFloat(item.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '10px' }}>No medicines billed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cost Summary */}
              <div className="popup-summary-area">
                <div className="popup-summary-row">
                  <span>Total Medicine Amount:</span>
                  <strong>₹ {parseFloat(selectedBillForView.totalMedicineAmount !== undefined ? selectedBillForView.totalMedicineAmount : (parseFloat(selectedBillForView.totalPayable || 0) - parseFloat(selectedBillForView.consultFee || 0) + parseFloat(selectedBillForView.discount || 0) - (selectedBillForView.taxAmount || 0))).toFixed(2)}</strong>
                </div>
                <div className="popup-summary-row">
                  <span>Consultation Fee:</span>
                  <strong>₹ {parseFloat(selectedBillForView.consultFee || 0).toFixed(2)}</strong>
                </div>
                <div className="popup-summary-row">
                  <span>Discount:</span>
                  <strong>₹ {parseFloat(selectedBillForView.discount || 0).toFixed(2)}</strong>
                </div>
                <div className="popup-summary-row">
                  <span>Tax (GST {selectedBillForView.taxPercent || 0}%):</span>
                  <strong>₹ {parseFloat(selectedBillForView.taxAmount !== undefined ? selectedBillForView.taxAmount : ((parseFloat(selectedBillForView.totalPayable || 0) - parseFloat(selectedBillForView.discount || 0)) * (parseFloat(selectedBillForView.taxPercent || 0) / 100))).toFixed(2)}</strong>
                </div>
                <div className="popup-summary-row total-payable-row">
                  <span>Total Payable:</span>
                  <span className="payable-num">₹ {parseFloat(selectedBillForView.totalPayable || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="popup-footer">
              <button className="popup-btn-close" onClick={() => { setShowBillPopup(false); setSelectedBillForView(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BillingMedicine;
