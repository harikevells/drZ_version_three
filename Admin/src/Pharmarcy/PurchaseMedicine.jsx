import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
  FaPlus, FaTrash, FaPrint, FaDownload, FaUndo, FaCheck, FaTimes,
  FaCalendarAlt, FaUser, FaVenusMars, FaPhoneAlt, FaFolderOpen,
  FaUserMd, FaPrescription, FaSun, FaCloudSun, FaMoon,
  FaFileInvoiceDollar, FaQrcode, FaCheckCircle, FaClock, FaCreditCard, FaStethoscope
} from 'react-icons/fa';
import logoImage from '../assets/DoctorlogoApp1.png';
import './PurchaseMedicine.css';

const PurchaseMedicine = () => {
  // Available medicines from inventory & appointments
  const [inventoryMedicines, setInventoryMedicines] = useState([]);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

  const [draftBills, setDraftBills] = useState({});
  const [selectedApptId, setSelectedApptId] = useState('');
  // billedApptIds: loaded dynamically from /billings API (no localStorage)
  const [billedApptIds, setBilledApptIds] = useState([]);
  // completedApptIds: tracks print/download-marked completions within the session
  const [completedApptIds, setCompletedApptIds] = useState([]);

  const [cancelledApptIds, setCancelledApptIds] = useState([]);

  // Active Bill State (Displayed on UI & Sheet)
  const [billNo, setBillNo] = useState(`MB-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(10000 + Math.random() * 90000)}`);
  const [billDate, setBillDate] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const [appointmentNo, setAppointmentNo] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [mobileNo, setMobileNo] = useState('');
  const [treatmentCategory, setTreatmentCategory] = useState('General Medicine');
  const [consultingDoctor, setConsultingDoctor] = useState('Dr. Vijay Kumar MD');
  const [consultFee, setConsultFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Active Medicine Items List & Totals State
  const [medicineItems, setMedicineItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);

  // New item draft state
  const [selectedMedId, setSelectedMedId] = useState('');
  const [newMedName, setNewMedName] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [newMorning, setNewMorning] = useState(true);
  const [newAfternoon, setNewAfternoon] = useState(false);
  const [newEvening, setNewEvening] = useState(true);
  const [newNight, setNewNight] = useState(false);
  const [newIntake, setNewIntake] = useState('After Food');
  const [newDuration, setNewDuration] = useState(5);
  const [newQty, setNewQty] = useState(10);
  const [newRate, setNewRate] = useState(0);

  const [downloading, setDownloading] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchAppointmentsAndDoctors();
    fetchBilledAppointmentIds();
  }, []);

  // Fetch all billings to know which appointmentIds are already billed
  const fetchBilledAppointmentIds = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_BASE_URL}/billings`, authHeader);
      if (res.data && Array.isArray(res.data)) {
        const ids = res.data
          .map(b => b.appointmentId)
          .filter(id => id && id !== '');
        setBilledApptIds(ids);
      }
    } catch (e) {
      console.log('Error loading billings:', e);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/medicines`);
      if (res.data && Array.isArray(res.data)) {
        setInventoryMedicines(res.data);
      }
    } catch (e) {
      console.log('Error loading medicines inventory:', e);
    }
  };



  const fetchAppointmentsAndDoctors = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const [apptRes, docRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/emails/all-appointments`, authHeader),
        axios.get(`${API_BASE_URL}/doctors`, authHeader).catch(() => ({ data: [] }))
      ]);

      const doctors = docRes.data || [];
      if (docRes.data && Array.isArray(docRes.data)) {
        setDoctorsList(docRes.data);
      }

      if (apptRes.data && Array.isArray(apptRes.data)) {
        const appts = apptRes.data;

        // DEBUG: log all statuses to diagnose filter issues
        console.log('[PurchaseMedicine] All appointments from API:', appts.map(a => ({ id: a._id || a.id, booking_id: a.booking_id, status: a.status })));
        const completedOnes = appts.filter(a => String(a.status || '').trim().toLowerCase() === 'completed');
        console.log('[PurchaseMedicine] Completed appointments:', completedOnes.map(a => a.booking_id));

        setAppointmentsList(appts);

        // Build initial draft state for all appointments
        const initialDrafts = {};
        appts.forEach((appt, idx) => {
          const apptId = appt._id || appt.id || `appt_${idx}`;
          const doctorNameFromAppt = appt.doctor_name || '';
          const docObj = doctors.find(d => String(d.doctorName || '').toLowerCase() === String(doctorNameFromAppt).toLowerCase());
          const consultFeeFromRegister = docObj ? (parseFloat(docObj.fees) || 300) : (parseFloat(appt.consultation_fee || appt.consultFee || 300));

          // Prescriptions mapping if exists
          let initialMeds = [];
          if (Array.isArray(appt.prescription) && appt.prescription.length > 0) {
            initialMeds = appt.prescription.map((med, mIdx) => {
              const timeStr = String(med.timing || '').toLowerCase();
              const matchedInv = (inventoryMedicines || []).find(i => (i.medicineName || i.brandName || '').toLowerCase().includes(String(med.name || '').toLowerCase()));
              const rate = matchedInv ? (parseFloat(matchedInv.sellingPrice) || 15) : 15;

              const hasMorning = timeStr.includes('morn') || timeStr.includes('1-') || timeStr.includes('morning');
              const hasAfternoon = timeStr.includes('after') || timeStr.includes('noon') || timeStr.includes('-1-');
              const hasEvening = timeStr.includes('even') || timeStr.includes('1') || timeStr.includes('evening');
              const hasNight = timeStr.includes('night') || timeStr.includes('-1');
              const timesPerDay = (hasMorning ? 1 : 0) + (hasAfternoon ? 1 : 0) + (hasEvening ? 1 : 0) + (hasNight ? 1 : 0) || 1;
              const durationNum = parseInt(med.days || med.duration, 10) || 5;
              const qty = parseInt(med.qty, 10) || (durationNum * timesPerDay);

              return {
                id: Date.now() + mIdx,
                inventoryMedId: matchedInv ? (matchedInv._id || matchedInv.id) : null,
                medicineName: med.name || med.medicineName || `Medicine #${mIdx + 1}`,
                strength: med.strength || (matchedInv?.category || '500 mg'),
                timing: {
                  morning: hasMorning,
                  afternoon: hasAfternoon,
                  evening: hasEvening,
                  night: hasNight
                },
                intake: med.intake || 'After Food',
                duration: durationNum,
                qty: qty,
                rate: rate,
                amount: qty * rate
              };
            });
          }

          initialDrafts[apptId] = {
            appointmentNo: appt.booking_id ? `APT-${appt.booking_id}` : `APT-00${idx + 1}`,
            patientName: appt.patient_name || '',
            age: appt.patient_age ? `${appt.patient_age} Years` : '45 Years',
            gender: appt.patient_gender || 'Male',
            mobileNo: appt.whatsapp_number || appt.login_mobile || '',
            treatmentCategory: appt.treatment_category || appt.department || appt.treatmentCategory || 'General Medicine',
            consultingDoctor: appt.doctor_name || 'Dr. Vijay Kumar MD',
            consultFee: consultFeeFromRegister,
            paymentMethod: appt.payment_method || appt.paymentMethod || 'UPI / Cash',
            medicineItems: initialMeds,
            discount: 0,
            taxPercent: 0
          };
        });

        setDraftBills(initialDrafts);

        // Load first appointment if available - ONLY show completed appointments
        const activeAppts = appts.filter(appt => {
          const apptId = appt._id || appt.id || '';
          const savedCancelled = localStorage.getItem('cancelledBillingApptIds');
          const cancelledIds = savedCancelled ? JSON.parse(savedCancelled) : [];
          const statusLower = String(appt.status || '').trim().toLowerCase();
          const isCompleted = statusLower === 'completed' || statusLower === 'complete';
          return isCompleted && !cancelledIds.includes(apptId);
        });

        if (activeAppts.length > 0) {
          const firstId = activeAppts[0]._id || activeAppts[0].id || 'appt_0';
          switchAppointment(firstId, initialDrafts[firstId], appts);
        }
      }
    } catch (e) {
      console.log('Error loading appointments:', e);
    }
  };

  // Switch Active Appointment while preserving previous appointment's draft state
  const switchAppointment = (newApptId, preloadedDraft = null, listToUse = null) => {
    if (!newApptId) {
      handleResetBill();
      return;
    }

    // 1. Save current active fields into draftBills[selectedApptId]
    if (selectedApptId) {
      setDraftBills(prev => ({
        ...prev,
        [selectedApptId]: {
          appointmentNo,
          patientName,
          age,
          gender,
          mobileNo,
          treatmentCategory,
          consultingDoctor,
          consultFee,
          paymentMethod,
          medicineItems,
          discount,
          taxPercent
        }
      }));
    }

    // 2. Load target appointment's saved draft state
    const targetDraft = preloadedDraft || draftBills[newApptId];
    setSelectedApptId(newApptId);

    const currentList = listToUse || appointmentsList;
    const apptObj = currentList.find(a => (a._id || a.id) === newApptId);

    // Map prescriptions dynamically if apptObj exists
    let initialMeds = [];
    if (apptObj && Array.isArray(apptObj.prescription) && apptObj.prescription.length > 0) {
      initialMeds = apptObj.prescription.map((med, mIdx) => {
        const timeStr = String(med.timing || '').toLowerCase();
        const matchedInv = (inventoryMedicines || []).find(i => (i.medicineName || i.brandName || '').toLowerCase().includes(String(med.name || '').toLowerCase()));
        const rate = matchedInv ? (parseFloat(matchedInv.sellingPrice) || 15) : 15;

        const hasMorning = timeStr.includes('morn') || timeStr.includes('1-') || timeStr.includes('morning');
        const hasAfternoon = timeStr.includes('after') || timeStr.includes('noon') || timeStr.includes('-1-');
        const hasEvening = timeStr.includes('even') || timeStr.includes('1') || timeStr.includes('evening');
        const hasNight = timeStr.includes('night') || timeStr.includes('-1');
        const timesPerDay = (hasMorning ? 1 : 0) + (hasAfternoon ? 1 : 0) + (hasEvening ? 1 : 0) + (hasNight ? 1 : 0) || 1;
        const durationNum = parseInt(med.days || med.duration, 10) || 5;
        const qty = parseInt(med.qty, 10) || (durationNum * timesPerDay);

        return {
          id: Date.now() + mIdx,
          inventoryMedId: matchedInv ? (matchedInv._id || matchedInv.id) : null,
          medicineName: med.name || med.medicineName || `Medicine #${mIdx + 1}`,
          strength: med.strength || (matchedInv?.category || '500 mg'),
          timing: {
            morning: hasMorning,
            afternoon: hasAfternoon,
            evening: hasEvening,
            night: hasNight
          },
          intake: med.intake || 'After Food',
          duration: durationNum,
          qty: qty,
          rate: rate,
          amount: qty * rate
        };
      });
    }

    if (apptObj) {
      setAppointmentNo(apptObj.booking_id ? `APT-${apptObj.booking_id}` : (targetDraft?.appointmentNo || ''));
      setPatientName(apptObj.patient_name || targetDraft?.patientName || '');
      setAge(apptObj.patient_age ? `${apptObj.patient_age} Years` : (targetDraft?.age || '45 Years'));
      setGender(apptObj.patient_gender || targetDraft?.gender || 'Male');
      setMobileNo(apptObj.whatsapp_number || apptObj.login_mobile || targetDraft?.mobileNo || '');
      setTreatmentCategory(apptObj.treatment_category || apptObj.department || targetDraft?.treatmentCategory || 'General Medicine');
      setConsultingDoctor(apptObj.doctor_name || targetDraft?.consultingDoctor || 'Dr. Vijay Kumar MD');

      const doctorNameFromAppt = apptObj.doctor_name || '';
      const docObj = doctorsList.find(d => String(d.doctorName || '').toLowerCase() === String(doctorNameFromAppt).toLowerCase());
      const consultFeeFromRegister = docObj ? (parseFloat(docObj.fees) || 300) : (parseFloat(apptObj.consultation_fee || apptObj.consultFee || 300));

      setConsultFee(consultFeeFromRegister);
      setPaymentMethod(targetDraft?.paymentMethod || 'Cash');

      const targetMeds = (initialMeds && initialMeds.length > 0)
        ? initialMeds
        : ((targetDraft && targetDraft.medicineItems) ? targetDraft.medicineItems : []);
      setMedicineItems(targetMeds);
      setDiscount(targetDraft?.discount || 0);
      setTaxPercent(targetDraft?.taxPercent || 0);
    } else if (targetDraft) {
      setAppointmentNo(targetDraft.appointmentNo);
      setPatientName(targetDraft.patientName);
      setAge(targetDraft.age);
      setGender(targetDraft.gender);
      setMobileNo(targetDraft.mobileNo);
      setTreatmentCategory(targetDraft.treatmentCategory);
      setConsultingDoctor(targetDraft.consultingDoctor);
      setConsultFee(targetDraft.consultFee || 300);
      setPaymentMethod(targetDraft.paymentMethod || 'Cash');
      setMedicineItems(targetDraft.medicineItems || []);
      setDiscount(targetDraft.discount || 0);
      setTaxPercent(targetDraft.taxPercent || 0);
    }
  };

  // Sync active inputs back to draft state whenever they change
  useEffect(() => {
    if (!selectedApptId) return;
    setDraftBills(prev => ({
      ...prev,
      [selectedApptId]: {
        appointmentNo,
        patientName,
        age,
        gender,
        mobileNo,
        treatmentCategory,
        consultingDoctor,
        consultFee,
        paymentMethod,
        medicineItems,
        discount,
        taxPercent
      }
    }));
  }, [
    appointmentNo, patientName, age, gender, mobileNo, treatmentCategory,
    consultingDoctor, consultFee, paymentMethod, medicineItems, discount, taxPercent
  ]);

  // Handle Inventory Medicine Selection
  const handleSelectMedicineFromInventory = (medId) => {
    setSelectedMedId(medId);
    const med = inventoryMedicines.find(m => (m._id || m.id) === medId);
    if (med) {
      setNewMedName(med.medicineName || med.brandName);
      setNewStrength(med.category || '500 mg');
      setNewRate(parseFloat(med.sellingPrice) || 0);
    }
  };

  // Add Item to Active Bill
  const handleAddMedicineItem = (e) => {
    e.preventDefault();
    if (!newMedName) {
      alert('Please enter or select a medicine name');
      return;
    }

    const qty = parseInt(newQty, 10) || 1;
    const rate = parseFloat(newRate) || 0;
    const amount = qty * rate;

    const newItem = {
      id: Date.now(),
      inventoryMedId: selectedMedId || null,
      medicineName: newMedName,
      strength: newStrength || '500 mg',
      timing: {
        morning: newMorning,
        afternoon: newAfternoon,
        evening: newEvening,
        night: newNight
      },
      intake: newIntake,
      duration: parseInt(newDuration, 10) || 1,
      qty: qty,
      rate: rate,
      amount: amount
    };

    setMedicineItems([...medicineItems, newItem]);

    // Reset draft form
    setSelectedMedId('');
    setNewMedName('');
    setNewStrength('');
    setNewMorning(true);
    setNewAfternoon(false);
    setNewEvening(true);
    setNewNight(false);
    setNewIntake('After Food');
    setNewDuration(5);
    setNewQty(10);
    setNewRate(0);
  };

  // Remove Item
  const handleRemoveItem = (id) => {
    setMedicineItems(medicineItems.filter(item => item.id !== id));
  };

  // Mark current appointment as print/download completed (session only)
  const handleMarkCompleted = () => {
    if (selectedApptId && !completedApptIds.includes(selectedApptId)) {
      setCompletedApptIds(prev => [...prev, selectedApptId]);
    }
  };

  // Complete billing & deduct dynamic medicine quantities from inventory
  const handleCompleteBilling = async () => {
    if (!medicineItems || medicineItems.length === 0) {
      alert('No medicine items added to complete billing.');
      return;
    }

    setCompleting(true);
    try {
      let updatedInventory = [...inventoryMedicines];
      const updatePromises = [];

      for (const item of medicineItems) {
        const medIndex = updatedInventory.findIndex(inv =>
          (item.inventoryMedId && (inv._id === item.inventoryMedId || inv.id === item.inventoryMedId)) ||
          (inv.medicineName || inv.brandName || '').toLowerCase().trim() === String(item.medicineName || '').toLowerCase().trim() ||
          (inv.medicineName || inv.brandName || '').toLowerCase().includes(String(item.medicineName || '').toLowerCase())
        );

        if (medIndex !== -1) {
          const invMed = updatedInventory[medIndex];
          const currentStockNum = parseInt(invMed.currentStock, 10) || 0;
          const deductQty = parseInt(item.qty, 10) || 0;
          const newStock = Math.max(0, currentStockNum - deductQty);

          updatedInventory[medIndex] = {
            ...invMed,
            currentStock: newStock
          };

          const medId = invMed._id || invMed.id;
          if (medId) {
            updatePromises.push(
              axios.put(`${API_BASE_URL}/medicines/${medId}`, {
                ...invMed,
                currentStock: newStock
              }).catch(err => console.error(`Failed to update stock for ${invMed.medicineName}:`, err))
            );
          }
        }
      }

      await Promise.all(updatePromises);

      // Dynamically update UI inventory stock
      setInventoryMedicines(updatedInventory);

      // Save billing invoice data to backend
      const totalMedicineAmt = medicineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const subTotalWithConsult = totalMedicineAmt + parseFloat(consultFee || 0);
      const taxAmt = ((subTotalWithConsult - discount) * (taxPercent / 100));
      const totalPayableCalc = Math.max(0, subTotalWithConsult - discount + taxAmt);

      const billData = {
        billNo,
        billDate,
        appointmentId: selectedApptId || '',
        appointmentNo,
        patientName,
        age,
        gender,
        mobileNo,
        treatmentCategory,
        consultingDoctor,
        consultFee: parseFloat(consultFee || 0),
        paymentMethod,
        medicineItems,
        discount: parseFloat(discount || 0),
        taxPercent: parseFloat(taxPercent || 0),
        totalMedicineAmount: totalMedicineAmt,
        taxAmount: taxAmt,
        totalPayable: totalPayableCalc,
        status: 'Completed'
      };

      const token = sessionStorage.getItem('token');
      const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.post(`${API_BASE_URL}/billings`, billData, authHeader);

      // Dynamically mark this appointment as billed (no localStorage)
      if (selectedApptId && !billedApptIds.includes(selectedApptId)) {
        setBilledApptIds(prev => [...prev, selectedApptId]);
      }

      alert('Billing completed and saved successfully! Medicine inventory stock has been reduced dynamically.');

      // Reset form so billed appointment deselects immediately
      handleResetBill();
    } catch (error) {
      console.error('Error completing billing:', error);
      alert('An error occurred while updating medicine stock.');
    } finally {
      setCompleting(false);
    }
  };

  // Calculate Totals including Doctor Consult Fee
  const totalMedicineAmount = medicineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const subTotalWithConsultFee = totalMedicineAmount + parseFloat(consultFee || 0);
  const taxAmount = ((subTotalWithConsultFee - discount) * (taxPercent / 100));
  const totalPayable = Math.max(0, subTotalWithConsultFee - discount + taxAmount);

  // Convert amount to words
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

  // Reset / Clear Items for current appointment (Fresh Page)
  const handleResetBill = () => {
    setSelectedApptId('');
    setAppointmentNo('');
    setPatientName('');
    setAge('');
    setGender('Male');
    setMobileNo('');
    setTreatmentCategory('General Medicine');
    setConsultingDoctor('Dr. Vijay Kumar MD');
    setConsultFee(0);
    setBillNo(`MB-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(10000 + Math.random() * 90000)}`);
    setMedicineItems([]);
    setDiscount(0);
    setTaxPercent(0);
  };

  // Remove an appointment draft from the pending queue and persist cancellation
  const handleRemoveFromQueue = (e, apptId) => {
    e.stopPropagation();
    setCancelledApptIds(prev => {
      const next = [...prev, apptId];
      localStorage.setItem('cancelledBillingApptIds', JSON.stringify(next));
      return next;
    });
    setDraftBills(prev => {
      const next = { ...prev };
      delete next[apptId];
      return next;
    });
    if (selectedApptId === apptId) {
      handleResetBill();
    }
  };

  // Print Bill (Prints ONLY printable-bill-sheet)
  const handlePrintBill = () => {
    handleMarkCompleted();
    const origTitle = document.title;
    document.title = `${billNo}_Invoice`;
    window.print();
    document.title = origTitle;
  };

  // Download PDF (Downloads ONLY printable-bill-sheet)
  const handleDownloadPDF = () => {
    handleMarkCompleted();
    setDownloading(true);
    const element = document.getElementById('printable-bill-sheet');
    if (!element) {
      setDownloading(false);
      return;
    }

    document.body.classList.add('is-generating-pdf');

    const opt = {
      margin: 0.2,
      filename: `${billNo}_Invoice.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const triggerPdf = () => {
      if (window.html2pdf) {
        window.html2pdf().set(opt).from(element).save().then(() => {
          document.body.classList.remove('is-generating-pdf');
          setDownloading(false);
        }).catch(() => {
          document.body.classList.remove('is-generating-pdf');
          setDownloading(false);
          handlePrintBill();
        });
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
          window.html2pdf().set(opt).from(element).save().then(() => {
            document.body.classList.remove('is-generating-pdf');
            setDownloading(false);
          }).catch(() => {
            document.body.classList.remove('is-generating-pdf');
            setDownloading(false);
            handlePrintBill();
          });
        };
        script.onerror = () => {
          document.body.classList.remove('is-generating-pdf');
          setDownloading(false);
          handlePrintBill();
        };
        document.body.appendChild(script);
      }
    };

    // Small delay to ensure CSS styles are fully calculated/applied before html2pdf captures it
    setTimeout(triggerPdf, 150);
  };

  // Filter queue: ONLY show 'completed' status appointments NOT yet billed (dynamic from API)
  const activeQueueAppointments = appointmentsList.filter(appt => {
    const apptId = appt._id || appt.id;
    if (billedApptIds.includes(apptId)) return false;  // Already billed — hide
    if (cancelledApptIds.includes(apptId)) return false;
    const statusLower = String(appt.status || '').trim().toLowerCase();
    return statusLower === 'completed' || statusLower === 'complete';
  });

  return (
    <div className="bill-page-wrapper">
      {/* Top Action Header Bar */}
      <div className="bill-top-action-bar no-print">
        <div className="action-bar-title">
          <FaFileInvoiceDollar size={24} color="#2563eb" />
          <div>
            <h2>Medicine Billing & Prescription Invoice</h2>
            <p className="sub-header-appt-status">
              {appointmentNo ? (
                <>Active Billing: <strong>{appointmentNo}</strong> ({patientName}) {completedApptIds.includes(selectedApptId) ? <span className="status-tag-done">✓ Billed & Completed</span> : <span className="status-tag-pending">⏳ Pending</span>}</>
              ) : 'Select an appointment to bill medicines'}
            </p>
          </div>
        </div>

        <div className="action-buttons-group">
          <button className="btn-action btn-reset" onClick={handleResetBill} title="New Bill">
            <FaPlus /> <span>New</span>
          </button>
          <button className="btn-action btn-complete" onClick={handleCompleteBilling} disabled={completing} title="Complete Billing & Deduct Stock">
            <FaCheckCircle /> <span>{completing ? 'Completing...' : 'Complete Billing'}</span>
          </button>
          <button className="btn-action btn-print" onClick={handlePrintBill} title="Print Invoice">
            <FaPrint /> <span>Print Bill</span>
          </button>
        </div>
      </div>

      {/* Appointment Quick Selector Bar (Shows ONLY appointments with added medicines or active) */}
      {activeQueueAppointments.length > 0 && (
        <div className="appointment-selector-tabs-card no-print">
          <div className="tabs-card-header">
            <FaCalendarAlt color="#2563eb" />
            <span>Pending Billing Queue ({activeQueueAppointments.length}): Only appointments with added medicines appear here!</span>
          </div>
          <div className="appt-tabs-flex">
            {activeQueueAppointments.map((appt, idx) => {
              const apptId = appt._id || appt.id || `appt_${idx}`;
              const isSelected = selectedApptId === apptId;
              const isDone = completedApptIds.includes(apptId);
              const apptDraft = draftBills[apptId] || {};
              const itemCount = (apptDraft.medicineItems || []).length;
              const apptCode = appt.booking_id ? `APT-${appt.booking_id}` : `APT-00${idx + 1}`;

              return (
                <button
                  key={apptId}
                  className={`appt-pill-btn ${isSelected ? 'active' : ''} ${isDone ? 'done' : ''}`}
                  onClick={() => switchAppointment(apptId)}
                >
                  <span className="pill-code">{apptCode}</span>
                  <span className="pill-name">{appt.patient_name}</span>
                  {itemCount > 0 && <span className="pill-badge-count">{itemCount} Meds</span>}
                  {isDone ? <FaCheckCircle className="icon-done" /> : <FaClock className="icon-pending" />}
                  <span
                    className="pill-cancel-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromQueue(e, apptId);
                    }}
                    style={{
                      marginLeft: '8px',
                      cursor: 'pointer',
                      color: isSelected ? '#ffffff' : '#ef4444',
                      opacity: 0.7,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                  >
                    <FaTimes size={12} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Inputs Form Section (Hidden when printing) */}
      <div className="bill-input-form-card no-print">
        <h3 className="form-section-title">Patient & Billing Information</h3>
        <div className="form-grid-3">
          <div className="form-field">
            <label>Select Patient Appointment (Completed):</label>
            <select value={selectedApptId} onChange={(e) => switchAppointment(e.target.value)}>
              <option value="">Select Completed Appointment...</option>
              {appointmentsList
                .filter(a => {
                  const apptId = a._id || a.id;
                  const statusLower = String(a.status || '').trim().toLowerCase();
                  const isCompleted = statusLower === 'completed' || statusLower === 'complete';
                  // Dynamically check against billings API data — no localStorage
                  const alreadyBilled = billedApptIds.includes(apptId);
                  return isCompleted && !alreadyBilled;
                })
                .map((a, idx) => (
                  <option key={idx} value={a._id || a.id || `appt_${idx}`}>
                    {a.booking_id ? `APT-${a.booking_id}` : `APT-${idx + 1}`} - {a.patient_name} ({a.treatment_category || a.department || 'General'})
                  </option>
                ))}
            </select>
          </div>

          <div className="form-field">
            <label>Appointment No:</label>
            <input type="text" value={appointmentNo} onChange={(e) => setAppointmentNo(e.target.value)} placeholder="APT-2026-08-0158" />
          </div>

          <div className="form-field">
            <label>Patient Name:</label>
            <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Ramesh Kumar" />
          </div>

          <div className="form-field">
            <label>Age / Gender:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={age} onChange={(e) => setAge(e.target.value)} placeholder="45 Years" style={{ flex: 1 }} />
              <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100px' }}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Mobile No:</label>
            <input type="text" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder="98765 43210" />
          </div>

          <div className="form-field">
            <label>Treatment Category (Dynamic):</label>
            <input type="text" value={treatmentCategory} onChange={(e) => setTreatmentCategory(e.target.value)} placeholder="General Medicine" />
          </div>

          <div className="form-field">
            <label>Consulting Doctor:</label>
            <input type="text" value={consultingDoctor} onChange={(e) => setConsultingDoctor(e.target.value)} placeholder="Dr. Vijay Kumar MD" />
          </div>

          <div className="form-field">
            <label>Doctor Consult Fee (₹):</label>
            <input type="number" step="10" value={consultFee} onChange={(e) => setConsultFee(parseFloat(e.target.value) || 0)} placeholder="300" />
          </div>

          <div className="form-field">
            <label>Payment Method:</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="Cash">Cash</option>
              <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
              <option value="Credit / Debit Card">Credit / Debit Card</option>
              <option value="Razorpay Online">Razorpay Online</option>
              <option value="Insurance / Credit">Insurance / Credit</option>
            </select>
          </div>

          <div className="form-field">
            <label>Discount (₹):</label>
            <input type="number" step="0.5" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
          </div>

          <div className="form-field">
            <label>Tax GST (%):</label>
            <input type="number" value={taxPercent} onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        {/* Add Medicine Item Row Form */}
        <div className="add-medicine-row-box">
          <h4>➕ Add Medicine Item to Bill</h4>
          <form onSubmit={handleAddMedicineItem} className="add-med-form-grid">
            <div className="form-field">
              <label>Select from Inventory:</label>
              <select value={selectedMedId} onChange={(e) => handleSelectMedicineFromInventory(e.target.value)}>
                <option value="">Select Inventory Medicine...</option>
                {inventoryMedicines.map((m, idx) => (
                  <option key={idx} value={m._id || m.id}>
                    {m.medicineName} ({m.brandName || m.category}) - ₹{m.sellingPrice} | Stock: {m.currentStock !== undefined ? m.currentStock : 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Medicine Name:</label>
              <input type="text" value={newMedName} onChange={(e) => setNewMedName(e.target.value)} placeholder="Paracetamol" required />
            </div>

            <div className="form-field">
              <label>Strength:</label>
              <input type="text" value={newStrength} onChange={(e) => setNewStrength(e.target.value)} placeholder="650 mg" />
            </div>

            <div className="form-field">
              <label>Intake Timing:</label>
              <div className="checkbox-timings-row">
                <label><input type="checkbox" checked={newMorning} onChange={(e) => setNewMorning(e.target.checked)} /> ☀️ M</label>
                <label><input type="checkbox" checked={newAfternoon} onChange={(e) => setNewAfternoon(e.target.checked)} /> 🌤️ A</label>
                <label><input type="checkbox" checked={newEvening} onChange={(e) => setNewEvening(e.target.checked)} /> 🌅 E</label>
                <label><input type="checkbox" checked={newNight} onChange={(e) => setNewNight(e.target.checked)} /> 🌙 N</label>
              </div>
            </div>

            <div className="form-field">
              <label>Intake Condition:</label>
              <select value={newIntake} onChange={(e) => setNewIntake(e.target.value)}>
                <option value="After Food">After Food</option>
                <option value="Before Food">Before Food</option>
                <option value="With Food">With Food</option>
              </select>
            </div>

            <div className="form-field">
              <label>Duration (Days):</label>
              <input type="number" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} />
            </div>

            <div className="form-field">
              <label>Qty:</label>
              <input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
            </div>

            <div className="form-field">
              <label>Rate (₹):</label>
              <input type="number" step="0.1" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
            </div>

            <div className="form-field btn-add-cell">
              <button type="submit" className="btn-add-item">
                <FaPlus /> Add Item
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE BILL CANVAS SHEET (Matching exact design of image input_file_0) */}
      {/* ========================================================================= */}
      <div className="bill-sheet-container" id="printable-bill-sheet">

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
                <span className="b-label">Bill No. : :</span>
                <span className="b-val">{billNo}</span>
              </div>
              <div className="bill-row">
                <span className="b-label">Bill Date :</span>
                <span className="b-val">{billDate}</span>
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
                <span className="val highlight-blue">{appointmentNo || '-'}</span>
              </div>
            </div>

            <div className="info-item">
              <FaPhoneAlt className="info-icon" />
              <div className="info-text">
                <span className="lbl">Mobile No</span>
                <span className="val">{mobileNo || '-'}</span>
              </div>
            </div>

            <div className="info-item">
              <FaUser className="info-icon" />
              <div className="info-text">
                <span className="lbl">Patient Name</span>
                <span className="val highlight-blue">{patientName || '-'}</span>
              </div>
            </div>

            <div className="info-item">
              <FaFolderOpen className="info-icon" />
              <div className="info-text">
                <span className="lbl">Treatment Category</span>
                <span className="val highlight-blue">{treatmentCategory || 'General Medicine'}</span>
              </div>
            </div>

            <div className="info-item">
              <FaVenusMars className="info-icon" />
              <div className="info-text">
                <span className="lbl">Age / Gender</span>
                <span className="val">{age || '-'} {age && gender ? '/' : ''} {gender || ''}</span>
              </div>
            </div>

            <div className="info-item">
              <FaUserMd className="info-icon" />
              <div className="info-text">
                <span className="lbl">Consulting Doctor</span>
                <span className="val highlight-blue">{consultingDoctor || 'Dr. Vijay Kumar MD'}</span>
              </div>
            </div>

            <div className="info-item">
              <FaCreditCard className="info-icon" />
              <div className="info-text">
                <span className="lbl">Payment Method</span>
                <span className="val highlight-blue">{paymentMethod || 'Cash'}</span>
              </div>
            </div>

            <div className="info-item">
              <FaStethoscope className="info-icon" />
              <div className="info-text">
                <span className="lbl">Doctor Consult Fee</span>
                <span className="val highlight-blue">₹ {parseFloat(consultFee || 0).toFixed(2)}</span>
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
                <th className="no-print" style={{ width: '40px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {medicineItems.length > 0 ? (
                medicineItems.map((item, idx) => (
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
                    <td className="no-print" style={{ textAlign: 'center' }}>
                      <button className="btn-del-item" onClick={() => handleRemoveItem(item.id)} title="Delete item">
                        <FaTimes />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic' }}>
                    No medicines added to this bill yet. Add medicines above or select another appointment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Summary Section (3 Boxes Layout) */}
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
                <span className="val">₹ {totalMedicineAmount.toFixed(2)}</span>
              </div>
              <div className="sum-row">
                <span>Doctor Consultation Fee</span>
                <span className="val">₹ {parseFloat(consultFee || 0).toFixed(2)}</span>
              </div>
              <div className="sum-row">
                <span>Discount</span>
                <span className="val">₹ {discount.toFixed(2)}</span>
              </div>
              <div className="sum-row">
                <span>Tax (GST {taxPercent}%)</span>
                <span className="val">₹ {taxAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="total-payable-blue-bar">
              <span>Total Payable</span>
              <span className="total-num">₹ {totalPayable.toFixed(2)}</span>
            </div>
            <div className="amount-in-words">
              <span>Amount in Words :</span> <strong>{numberToWords(totalPayable)}</strong>
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
                <span className="sig-handwriting">{consultingDoctor ? (consultingDoctor.toLowerCase().startsWith('dr') ? consultingDoctor : `Dr. ${consultingDoctor}`) : 'Dr. Vijay Kumar'}</span>
              </div>
              <p className="dr-sig-name">{consultingDoctor || 'Dr. Vijay Kumar MD'}</p>
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
  );
};

export default PurchaseMedicine;
