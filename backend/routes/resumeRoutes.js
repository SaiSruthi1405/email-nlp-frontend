const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const { compareResumeWithJob } = require("../services/mlClient");

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Optional file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, and DOCX files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// Upload route
router.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    return res.status(200).json({
      message: "Resume uploaded successfully",
      filename: req.file.originalname,
      path: req.file.path,
    });
  } catch (error) {
    console.error("Resume upload failed:", error);
    return res.status(500).json({ message: "Upload failed" });
  }
});

// Compare route
router.post("/compare", async (req, res) => {
  try {
    const { resumePath, jobText } = req.body;

    if (!resumePath || !jobText) {
      return res.status(400).json({
        message: "resumePath and jobText are required",
      });
    }

    const result = await compareResumeWithJob({ resumePath, jobText });

    return res.status(200).json({
      matchPercentage: result?.matchPercentage ?? 0,
      matchingSkills: result?.matchingSkills ?? [],
      missingSkills: result?.missingSkills ?? [],
      summary: result?.summary ?? "",
    });
  } catch (error) {
    console.error("Resume comparison failed:", error);
    return res.status(500).json({
      message: "Resume comparison failed",
    });
  }
});

module.exports = router;