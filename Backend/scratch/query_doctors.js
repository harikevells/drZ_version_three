const Doctor = require('../models/Doctor');
const db = require('../config/firebase');

async function checkDoctors() {
  try {
    const docs = await Doctor.find();
    console.log("Total doctors:", docs.length);
    docs.forEach(d => {
      console.log(JSON.stringify(d, null, 2));
    });
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkDoctors();
