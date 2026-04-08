const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { createOAuthClient } = require("../services/googleClient");
const User = require("../models/User");
const RawEmail = require("../models/RawEmail");
const { classifyEmail } = require("../services/mlClient");

// helper to extract plain text body from Gmail payload
function extractBody(payload) {
  if (!payload) return "";

  // direct body
  if (payload.body && payload.body.data) {
    let data = payload.body.data.replace(/-/g, "+").replace(/_/g, "/");
    while (data.length % 4) data += "=";
    const buff = Buffer.from(data, "base64");
    return buff.toString("utf-8");
  }

  // multipart: recurse into parts
  if (payload.parts && payload.parts.length) {
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  return "";
}

// POST /api/sync-emails
router.post("/sync-emails", async (req, res) => {
  try {
    const user = await User.findOne({});
    console.log("USER TOKEN FROM DB:", user && user.gmailToken);
    if (!user || !user.gmailToken) {
      return res.status(400).json({ error: "No Gmail token saved" });
    }

    const oauth2Client = createOAuthClient();
    console.log("USER TOKEN FROM DB:", user.gmailToken);
    oauth2Client.setCredentials(user.gmailToken);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const MAX_TO_SYNC = 200;
    let allMessages = [];
    let pageToken = undefined;

    while (allMessages.length < MAX_TO_SYNC) {
      const listRes = await gmail.users.messages.list({
        userId: "me",
        maxResults: 100,
        pageToken,
      });

      const messages = listRes.data.messages || [];
      allMessages = allMessages.concat(messages);

      pageToken = listRes.data.nextPageToken;
      if (!pageToken) break;
    }

    console.log("GMAIL: fetched message IDs:", allMessages.length);

    const results = [];

    for (const msg of allMessages) {
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

      console.log("PROCESSING:", msg.id, "|", subject, "|", date);

      const existing = await RawEmail.findOne({
        gmailId: msg.id,
        userId: user._id,
      });
      console.log("PROCESSING:", msg.id, "|", subject, "|", date);
      const bodyText = extractBody(payload) || "";

      if (existing) {
        let category = existing.category || "others";
        console.log("ALREADY EXISTS:", msg.id, "|", subject);
        try {
          category = await classifyEmail(subject || "", bodyText || "");
        } catch (e) {
          console.error("ML re-classify error for", msg.id, e);
        }

        existing.body = existing.body || bodyText;
        existing.category = category;
        await existing.save();

        results.push({
          id: existing._id,
          subject: existing.subject,
          from,
          category: existing.category,
        });
        continue;
      }

      let category = "others";
      try {
        category = await classifyEmail(subject || "", bodyText || "");
      } catch (e) {
        console.error("ML classify error for", msg.id, e);
      }

      const rawEmail = new RawEmail({
        userId: user._id,
        subject,
        sender: from,
        body: bodyText,
        dateReceived: date ? new Date(date) : new Date(),
        gmailId: msg.id,
        category,
      });

      await rawEmail.save();
      results.push({ id: rawEmail._id, subject, from, category });
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

    const emails = await RawEmail.find({ userId: user._id })
      .sort({ dateReceived: -1 })
      .select("subject sender dateReceived gmailId body category")
      .lean();

    const mapped = emails.map((e) => ({
      id: e._id,
      subject: e.subject,
      sender: e.sender,
      dateReceived: e.dateReceived,
      gmailId: e.gmailId,
      category: e.category,
      snippet: e.body?.slice(0, 200) || "",
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
    // ✅ ADDED: block non-ObjectId values like "jobs", "debug" from reaching findOne
    if (!req.params.id.match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(404).json({ error: "Not found" });
    }

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