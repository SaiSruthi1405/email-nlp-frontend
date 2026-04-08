const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const RawEmail = require("../models/RawEmail");

// GET /api/emails/debug
router.get("/debug", async (req, res) => {
  try {
    const docs = await RawEmail.find({});
    res.json({ count: docs.length, docs });
  } catch (err) {
    console.error("DEBUG ERROR", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/emails/jobs
router.get("/jobs", async (req, res) => {
  try {
    const docs = await RawEmail.find({ category: { $in: ["jobs", "job"] } })
      .sort({ dateReceived: -1 })
      .limit(50)
      .lean();

    const result = docs.map((doc) => ({
      id: doc._id.toString(),
      category: doc.category,
      created_at: doc.dateReceived?.toISOString?.() || null,
      raw_email: {
        subject: doc.subject,
        sender: doc.sender,
        body: doc.body,
        date_received: doc.dateReceived,
        gmail_id: doc.gmailId,
      },
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /api/emails/jobs ERROR", err);
    res.status(500).json({ error: "Failed to fetch job emails", details: err.message });
  }
});

// GET /api/emails — all emails for dashboard
router.get("/", async (req, res) => {
  try {
    const docs = await RawEmail.find({})
      .sort({ dateReceived: -1 })
      .limit(200)
      .lean();

    const result = docs.map((doc) => ({
      id: doc._id.toString(),
      category: doc.category || "others",
      created_at: doc.dateReceived?.toISOString?.() || null,
      raw_email: {
        subject: doc.subject,
        sender: doc.sender,
        date_received: doc.dateReceived,
      },
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /api/emails ERROR", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// GET /api/emails/:id — single email detail
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid email id" });
    }

    const doc = await RawEmail.findById(id).lean();

    if (!doc) {
      return res.status(404).json({ error: "Email not found" });
    }

    const email = {
      id: doc._id.toString(),
      category: doc.category || "others",
      created_at: doc.dateReceived?.toISOString?.() || null,
      raw_email: {
        subject: doc.subject,
        sender: doc.sender,
        body: doc.body,
        date_received: doc.dateReceived,
        gmail_id: doc.gmailId,
      },
    };

    res.json(email);
  } catch (err) {
    console.error("GET /api/emails/:id ERROR", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;