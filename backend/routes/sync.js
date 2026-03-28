const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { createOAuthClient } = require("../services/googleClient");
const User = require("../models/User");
const RawEmail = require("../models/RawEmail");

router.post("/sync-emails", async (req, res) => {
  try {
    // for now, always use your own Gmail
    const user = await User.findOne({});
        console.log("USER TOKEN FROM DB:", user && user.gmailToken);
    if (!user || !user.gmailToken) {
      return res.status(400).json({ error: "No Gmail token saved" });
    }

    const oauth2Client = createOAuthClient();
    console.log("USER TOKEN FROM DB:", user.gmailToken);
    oauth2Client.setCredentials(user.gmailToken);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // list last 10 messages
    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });

    const messages = listRes.data.messages || [];

    const results = [];

    for (const msg of messages) {
      const full = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const payload = full.data.payload || {};
      const headers = payload.headers || [];

      const getHeader = (name) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ||
        "";

      const subject = getHeader("Subject");
      const from = getHeader("From");
      const date = getHeader("Date");

       // 1) CHECK FOR EXISTING RAW EMAIL BY gmailId + userId
  const existing = await RawEmail.findOne({
    gmailId: msg.id,
    userId: user._id,
  });

  if (existing) {
    // already synced, just push info and skip insert
    results.push({ id: existing._id, subject: existing.subject, from });
    continue;
  }

      const rawEmail = new RawEmail({
        userId: user._id,
        subject,
        sender: from,
        body: "(body parsing later)",
        dateReceived: date ? new Date(date) : new Date(),
        gmailId: msg.id,
      });

      await rawEmail.save();
      results.push({ id: rawEmail._id, subject, from });
    }

    res.json({ synced: results.length, emails: results });
  } catch (err) {
    console.error("SYNC ERROR", err);
    res.status(500).json({ error: "Sync failed" });
  }
});

// Check if Gmail is connected
router.get("/auth-status", async (req, res) => {
  try {
    const user = await User.findOne({});
    const gmailConnected =
      !!(user && user.gmailToken && user.gmailToken.access_token);

    res.json({ gmailConnected });
  } catch (err) {
    console.error("AUTH-STATUS ERROR", err);
    res.status(500).json({ gmailConnected: false, error: "Server error" });
  }
});

// GET /api/emails - list raw emails (simple list for Inbox)
router.get("/emails", async (req, res) => {
  try {
    const user = await User.findOne({});
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const emails = await RawEmail.find({})
      .sort({ dateReceived: -1 })
      .select("subject sender dateReceived gmailId body") // only fields you need
      .lean();

    const mapped = emails.map((e) => ({
      id: e._id,
      subject: e.subject,
      sender: e.sender,
      dateReceived: e.dateReceived,
      gmailId: e.gmailId,
      snippet: e.body?.slice(0, 200) || "", // body snippet for later
    }));

    res.json(mapped);
  } catch (err) {
    console.error("GET /emails error", err);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

// GET /api/emails/:id - single email for EmailDetails
router.get("/emails/:id", async (req, res) => {
  try {
    const user = await User.findOne({});
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const email = await RawEmail.findOne({
      _id: req.params.id,
      userId: user._id,
    }).lean();

    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    res.json(email);
  } catch (err) {
    console.error("GET /emails/:id error", err);
    res.status(500).json({ error: "Failed to fetch email" });
  }
});

module.exports = router;
