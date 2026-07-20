import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { Alert, NativeModules, Platform } from 'react-native';
import { LOGO_BASE64 } from './logoBase64';

export const generatePrescriptionPDF = async (appData) => {
  try {
    const {
      doctorName,
      appId,
      appointmentDate,
      patientName,
      patientAge,
      patientGender,
      treatmentCategory,
      appointmentTime,
      medicines
    } = appData;

    // Formatting doctor name
    const formattedDoctorName = doctorName ? (doctorName.toLowerCase().startsWith('dr') ? doctorName : `Dr. ${doctorName}`) : 'Unknown Doctor';
    const finalDoctorName = formattedDoctorName.replace(/\b\w/g, c => c.toUpperCase());

    // Create table rows for medicines
    let medicineRows = '';
    if (medicines && medicines.length > 0) {
      medicines.forEach(med => {
        const timingStr = (med.timing || '').toLowerCase();
        const morningCheck = (med.morning || timingStr.includes('morning')) ? '<div class="check-box">&#10003;</div>' : '';
        const afternoonCheck = (med.afternoon || timingStr.includes('afternoon') || timingStr.includes('noon')) ? '<div class="check-box">&#10003;</div>' : '';
        const eveningCheck = (med.evening || timingStr.includes('evening')) ? '<div class="check-box">&#10003;</div>' : '';
        const nightCheck = (med.night || timingStr.includes('night')) ? '<div class="check-box">&#10003;</div>' : '';

        let intakeClass = 'intake-default';
        if (med.intake?.toLowerCase().includes('after')) {
          intakeClass = 'intake-after';
        } else if (med.intake?.toLowerCase().includes('before')) {
          intakeClass = 'intake-before';
        }

        medicineRows += `
          <tr>
            <td style="text-align: left;">${med.name || med.medicineName || ''}</td>
            <td>${morningCheck}</td>
            <td>${afternoonCheck}</td>
            <td>${eveningCheck}</td>
            <td>${nightCheck}</td>
            <td>
              <span class="intake-badge ${intakeClass}">${med.intake || ''}</span>
            </td>
            <td><span class="days-text">${med.days || ''}</span></td>
          </tr>
        `;
      });
    }

    const htmlContent = `
      <html>
        <head>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #ffffff;
              color: #2d3748;
            }
            .prescription-card {
              width: 100%;
              background-color: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 30px;
              box-sizing: border-box;
              position: relative;
              min-height: 900px;
            }
            
            .prescription-header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header-title {
              font-size: 24px;
              font-weight: 800;
              color: #125c73;
              letter-spacing: 4px;
              margin: 0;
              text-transform: uppercase;
            }
            .header-line {
              width: 60px;
              height: 4px;
              background-color: #3cbfae;
              margin: 8px auto 0 auto;
              border-radius: 2px;
            }
            
            .top-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 25px;
            }
            .left-side {
              width: 55%;
            }
            .right-side {
              width: 40%;
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              text-align: right;
            }
            
            .logo {
              max-width: 155px;
              height: auto;
              margin-bottom: 12px;
            }
            .address {
              font-size: 12.5px;
              line-height: 1.5;
              color: #718096;
            }
            
            .booking-badge {
              background-color: #e8f4f8;
              color: #125c73;
              padding: 6px 14px;
              border-radius: 20px;
              font-weight: 700;
              font-size: 13px;
              display: inline-block;
              margin-bottom: 12px;
              border: 1px solid #d4e8f1;
            }
            
            .patient-details {
              width: 100%;
            }
            .patient-details p {
              margin: 5px 0;
              font-size: 14px;
              line-height: 1.4;
            }
            .patient-details .label {
              color: #7b8e96;
              font-weight: 500;
              margin-right: 4px;
            }
            .patient-details .value {
              color: #0f3c4c;
              font-weight: 700;
            }
            
            .doctor-section {
              display: flex;
              align-items: center;
              margin: 25px 0;
              padding: 5px 0;
            }
            .doctor-icon {
              background-color: #125c73;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 10px;
            }
            .doctor-text {
              font-size: 14.5px;
              color: #4a5568;
            }
            .doctor-name {
              color: #125c73;
              font-weight: 700;
            }
            
            .medicine-section-header {
              margin-top: 30px;
              margin-bottom: 15px;
            }
            .medicine-section-header h2 {
              font-size: 20px;
              font-weight: 800;
              color: #0f3c4c;
              margin: 0;
            }
            .heading-line {
              width: 45px;
              height: 4px;
              background-color: #3cbfae;
              margin-top: 6px;
              border-radius: 2px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              border-radius: 12px;
              border-style: hidden;
              box-shadow: 0 0 0 1px #e2e8f0;
              overflow: hidden;
              margin-bottom: 30px;
            }
            th {
              background-color: #125c73;
              color: #ffffff;
              padding: 12px 14px;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              text-align: left;
            }
            th:not(:first-child) {
              text-align: center;
            }
            
            td {
              padding: 14px;
              border-bottom: 1px solid #edf2f7;
              color: #2d3748;
              font-size: 13.5px;
              font-weight: 600;
            }
            td:not(:first-child) {
              text-align: center;
            }
            tr:last-child td {
              border-bottom: none;
            }
            
            .check-box {
              background-color: #125c73;
              color: #ffffff;
              border-radius: 4px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 20px;
              height: 20px;
              font-size: 13px;
              font-weight: bold;
              margin: 0 auto;
            }
            
            .intake-badge {
              padding: 3px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 700;
              display: inline-block;
            }
            .intake-after {
              background-color: #e6f6f3;
              color: #279482;
            }
            .intake-before {
              background-color: #fdf3e7;
              color: #d28c31;
            }
            .intake-default {
              background-color: #edf2f7;
              color: #4a5568;
            }
            
            .days-text {
              color: #125c73;
              font-weight: 800;
              font-size: 14.5px;
            }
            
            .footer {
              text-align: center;
              font-size: 13px;
              color: #718096;
              font-weight: 500;
              margin-top: 50px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="prescription-card">
            <div class="prescription-header">
              <div class="header-title">PRESCRIPTION</div>
              <div class="header-line"></div>
            </div>
            
            <div class="top-section">
              <div class="left-side">
                <img src="${LOGO_BASE64}" class="logo" />
                <div class="address">
                  1ST FLOOR, HAKEEM AJMAL, 33, MADHAVAN ENCLAVE,<br/>
                  Hakim Ajmal Khan Rd, near Seventhday School,<br/>
                  Chinna Chokikulam, Madurai, Tamil Nadu 625002<br/><br/>
                  <strong>PH :</strong> 97891 91180
                </div>
              </div>
              
              <div class="right-side">
                <div class="booking-badge">Booking ID: #${appId || '0000'}</div>
                <div class="patient-details">
                  <p><span class="label">Patient:</span> <span class="value">${patientName || ''}</span></p>
                  <p><span class="label">Age/Gender:</span> <span class="value">${patientAge || ''} / ${patientGender || '-'}</span></p>
                  <p><span class="label">Treatment:</span> <span class="value">${treatmentCategory || ''}</span></p>
                  <p><span class="label">Date:</span> <span class="value">${appointmentDate || ''}</span></p>
                  <p><span class="label">Time:</span> <span class="value">${appointmentTime || ''}</span></p>
                </div>
              </div>
            </div>
            
            <div class="doctor-section">
              <div class="doctor-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <span class="doctor-text">Consulting Doctor: <strong class="doctor-name">${finalDoctorName}</strong></span>
            </div>
            
            <div class="medicine-section-header">
              <h2>Medicine Details</h2>
              <div class="heading-line"></div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>MEDICINE NAME</th>
                  <th>MORNING</th>
                  <th>AFTERNOON</th>
                  <th>EVENING</th>
                  <th>NIGHT</th>
                  <th>INTAKE</th>
                  <th>DAYS</th>
                </tr>
              </thead>
              <tbody>
                ${medicineRows}
              </tbody>
            </table>
            
            <div class="footer">
              Powered by DrZ.
            </div>
          </div>
        </body>
      </html>
    `;

    const options = {
      html: htmlContent,
      fileName: `Prescription_${appId || 'Doc'}`,
      directory: 'Documents',
      base64: true,
    };

    const file = await generatePDF(options);
    console.log('PDF generated at:', file);

    if (!file || !file.filePath) {
      throw new Error('PDF generation failed to return a file path');
    }

    const shareUrl = file.filePath.startsWith('file://')
      ? file.filePath
      : `file://${file.filePath}`;

    if (Platform.OS === 'android') {
      try {
        const fileName = `Prescription_${appId || 'Doc'}.pdf`;
        await NativeModules.FileModule.saveToDownloads(file.filePath, fileName);
        Alert.alert('Success', `Prescription saved to Downloads folder as ${fileName}`);
      } catch (err) {
        console.log('Failed to save to downloads:', err);
        // Fallback to Share.open if saveToDownloads fails
        await Share.open({
          url: shareUrl,
          title: 'Prescription PDF',
          message: 'Here is your prescription',
          type: 'application/pdf',
          failOnCancel: false,
        });
      }
    } else {
      // iOS
      await Share.open({
        url: shareUrl,
        title: 'Prescription PDF',
        message: 'Here is your prescription',
        type: 'application/pdf',
        failOnCancel: false,
      });
    }

  } catch (error) {
    console.log('Error generating or sharing PDF:', error);
    Alert.alert('PDF Error', error?.message || 'An unknown error occurred');
  }
};
