const mongoose = require("mongoose");

const classifiedEmailSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rawEmailId: { type: mongoose.Schema.Types.ObjectId, ref: "RawEmail", required: true },

    category: { type: String, enum: ["job", "event", "important", "others", "spam"], required: true },
    priority: { type: String, enum: ["high", "medium", "low"], required: true },
    spamScore: { type: Number, required: true },

    jobTitle: String,
    company: String,
    location: String,
    experienceLevel: String,
    skills: [String],
    applicationDeadline: Date,

    eventTitle: String,
    eventDate: Date,
    eventLocation: String,
    organizer: String,
    meetingLink: String,
    reminderSet: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("ClassifiedEmail", classifiedEmailSchema);
