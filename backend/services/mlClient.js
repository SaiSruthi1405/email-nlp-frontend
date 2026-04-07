const axios = require("axios");

const ML_BASE_URL = process.env.ML_BASE_URL || "http://localhost:8001";

async function classifyEmail(subject, body) {
  try {
    const res = await axios.post(`${ML_BASE_URL}/classify-email`, {
      subject,
      body,
    });

    return res.data.category || "others";
  } catch (err) {
    console.error(
      "ML service error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error("ML service call failed");
  }
}

module.exports = { classifyEmail };