const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function clearGmailToken() {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.updateOne(
    { email: 'saisruthigujja@gmail.com' },
    { $set: { gmailToken: null } }
  );
  console.log('Cleared gmailToken');
  await mongoose.disconnect();
}

clearGmailToken().catch(console.error);
