const express = require("express");
const router = express.Router();
const ClassifiedEmail = require("../models/ClassifiedEmail");
const RawEmail = require("../models/RawEmail"); // only if you have this model
const User = require("../models/User");

// DEBUG: see what the backend can read
router.get("/debug", async (req, res) => {
  try {
    const docs = await ClassifiedEmail.find({});
    res.json({ count: docs.length, docs });
  } catch (err) {
    console.error("DEBUG ERROR", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/", async (req, res) => {
  try {
    const docs = await ClassifiedEmail.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("rawEmailId")
      .lean();

    const result = docs.map((doc) => ({
      id: doc._id.toString(),
      user_id: doc.userId?.toString(),
      category: doc.category,
      priority: doc.priority,
      spam_score: doc.spamScore,
      job_title: doc.jobTitle,
      company: doc.company,
      location: doc.location,
      experience_level: doc.experienceLevel,
      skills: doc.skills,
      application_deadline: doc.applicationDeadline
        ? doc.applicationDeadline.toISOString()
        : null,
      event_title: doc.eventTitle,
      event_date: doc.eventDate ? doc.eventDate.toISOString() : null,
      event_location: doc.eventLocation,
      organizer: doc.organizer,
      meeting_link: doc.meetingLink,
      reminder_set: doc.reminderSet,
      created_at: doc.createdAt.toISOString(),
      raw_email: doc.rawEmailId
        ? {
            subject: doc.rawEmailId.subject,
            sender: doc.rawEmailId.sender,
            date_received: doc.rawEmailId.dateReceived,
          }
        : null,
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /api/emails ERROR", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const doc = await ClassifiedEmail.findOne({
      _id: req.params.id,
    })
      .populate("rawEmailId")
      .lean();

    if (!doc) {
      return res.status(404).json({ error: "Email not found" });
    }

    const email = {
      id: doc._id.toString(),
      user_id: doc.userId?.toString(),
      category: doc.category,
      priority: doc.priority,
      spam_score: doc.spamScore,
      job_title: doc.jobTitle,
      company: doc.company,
      location: doc.location,
      experience_level: doc.experienceLevel,
      skills: doc.skills,
      application_deadline: doc.applicationDeadline
        ? doc.applicationDeadline.toISOString()
        : null,
      event_title: doc.eventTitle,
      event_date: doc.eventDate ? doc.eventDate.toISOString() : null,
      event_location: doc.eventLocation,
      organizer: doc.organizer,
      meeting_link: doc.meetingLink,
      reminder_set: doc.reminderSet,
      created_at: doc.createdAt.toISOString(),
      raw_email: doc.rawEmailId
        ? {
            subject: doc.rawEmailId.subject,
            sender: doc.rawEmailId.sender,
            body: doc.rawEmailId.body,
            date_received: doc.rawEmailId.dateReceived,
            gmail_id: doc.rawEmailId.gmailId,
          }
        : null,
    };

    res.json(email);
  } catch (err) {
    console.error("GET /api/emails/:id ERROR", err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
