const mongoose = require("mongoose");

const ClassifiedEmailSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rawEmailId: { type: mongoose.Schema.Types.ObjectId, ref: "RawEmail" },
    category: { type: String, default: "others" },
    priority: { type: String },
    spamScore: { type: Number },
    jobTitle: { type: String },
    company: { type: String },
    location: { type: String },
    experienceLevel: { type: String },
    skills: [{ type: String }],
    applicationDeadline: { type: Date },
    eventTitle: { type: String },
    eventDate: { type: Date },
    eventLocation: { type: String },
    organizer: { type: String },
    meetingLink: { type: String },
    reminderSet: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClassifiedEmail", ClassifiedEmailSchema);