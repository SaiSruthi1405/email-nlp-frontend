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
      "ML service error (classifyEmail):",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error("ML service call failed");
  }
}

async function compareResumeWithJob({ resumePath, jobText }) {
  try {
    const res = await axios.post(`${ML_BASE_URL}/compare-resume-job`, {
      resumePath,
      jobText,
    });

    return {
      matchPercentage: res.data?.matchPercentage ?? 0,
      matchingSkills: res.data?.matchingSkills ?? [],
      missingSkills: res.data?.missingSkills ?? [],
      summary: res.data?.summary ?? "",
    };
  } catch (err) {
    console.error(
      "ML service error (compareResumeWithJob):",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error("Resume-job comparison service call failed");
  }
}

module.exports = {
  classifyEmail,
  compareResumeWithJob,
};