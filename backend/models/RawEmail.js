const mongoose = require("mongoose");

const rawEmailSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    sender: { type: String, required: true },
    body: { type: String, required: true },
    dateReceived: { type: Date, required: true },
    gmailId: { type: String }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("RawEmail", rawEmailSchema);
