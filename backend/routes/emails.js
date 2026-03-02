const express = require("express");
const ClassifiedEmail = require("../models/ClassifiedEmail");
const RawEmail = require("../models/RawEmail");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId; // later from auth
    const category = req.query.category; // optional

    const filter = {};
    if (userId) filter.userId = userId;
    if (category && category !== "all") filter.category = category;

    const docs = await ClassifiedEmail.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("rawEmailId");

    const result = docs.map((doc) => ({
      id: doc._id.toString(),
      user_id: doc.userId.toString(),
      raw_email_id: doc.rawEmailId._id.toString(),
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
      raw_email: {
        id: doc.rawEmailId._id.toString(),
        user_id: doc.rawEmailId.userId.toString(),
        subject: doc.rawEmailId.subject,
        sender: doc.rawEmailId.sender,
        body: doc.rawEmailId.body,
        date_received: doc.rawEmailId.dateReceived.toISOString(),
        gmail_id: doc.rawEmailId.gmailId || null,
        created_at: doc.rawEmailId.createdAt.toISOString()
      }
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
