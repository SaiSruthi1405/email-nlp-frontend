const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { createOAuthClient } = require("../services/googleClient");
const User = require("../models/User");
const RawEmail = require("../models/RawEmail");
const { classifyEmail } = require("../services/mlClient");

function decodeBase64Url(data) {
  if (!data) return "";

  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);

  return Buffer.from(padded, "base64").toString("utf-8");
}

function htmlToText(html) {
  if (!html) return "";

  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "")
    .replace(/\n\s*\n+/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function extractEmailBody(payload) {
  if (!payload) return "";

  if (payload.body?.data) {
    const mime = payload.mimeType || "";
    const decoded = decodeBase64Url(payload.body.data);

    if (mime.startsWith("text/plain")) {
      return decoded.trim();
    }

    if (mime.startsWith("text/html")) {
      return htmlToText(decoded);
    }

    if (decoded.trim()) {
      return decoded.trim();
    }
  }

  if (Array.isArray(payload.parts) && payload.parts.length) {
    let htmlBody = "";

    for (const part of payload.parts) {
      const mime = part.mimeType || "";

      if (mime.startsWith("text/plain") && part.body?.data) {
        const text = decodeBase64Url(part.body.data).trim();
        if (text) return text;
      }

      if (mime.startsWith("text/html") && part.body?.data) {
        const text = htmlToText(decodeBase64Url(part.body.data));
        if (text) htmlBody = text;
      }

      if (part.parts?.length) {
        const nested = extractEmailBody(part);
        if (nested) return nested;
      }
    }

    if (htmlBody) return htmlBody;
  }

  return "";
}

function safeDate(dateValue) {
  if (!dateValue) return new Date();
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getReadableError(err) {
  return (
    err?.response?.data?.error_description ||
    err?.response?.data?.error?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Sync failed"
  );
}

// POST /api/sync-emails
router.post("/sync-emails", async (req, res) => {
  try {
    const user = await User.findOne({});

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.gmailToken) {
      return res.status(400).json({ error: "No Gmail token saved. Connect Gmail first." });
    }

    const oauth2Client = createOAuthClient();
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

    allMessages = allMessages.slice(0, MAX_TO_SYNC);

    console.log("GMAIL: fetched message IDs:", allMessages.length);

    const results = [];
    const failed = [];

    for (const msg of allMessages) {
      try {
        const full = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const payload = full.data.payload || {};
        const headers = payload.headers || [];

        const getHeader = (name) =>
          headers.find((h) => (h.name || "").toLowerCase() === name.toLowerCase())?.value || "";

        const subject = getHeader("Subject");
        const from = getHeader("From");
        const date = getHeader("Date");
        const parsedDate = safeDate(date);
        const bodyText = extractEmailBody(payload) || full.data.snippet || "";

        console.log("PROCESSING:", msg.id, "|", subject, "|", date);
        console.log("BODY LENGTH:", bodyText.length);
        console.log("BODY PREVIEW:", bodyText.slice(0, 200));

        let category = "others";
        try {
          category = await classifyEmail(subject || "", bodyText || "");
        } catch (mlErr) {
          console.error("ML classify error for", msg.id, mlErr?.message || mlErr);
        }

        const existing = await RawEmail.findOne({
          gmailId: msg.id,
          userId: user._id,
        });

        if (existing) {
          existing.subject = existing.subject || subject;
          existing.sender = existing.sender || from;

          if (
            !existing.body ||
            existing.body === "(body parsing later)" ||
            existing.body.trim().length < 20
          ) {
            existing.body = bodyText;
          }

          existing.dateReceived = existing.dateReceived || parsedDate;
          existing.category = category;

          await existing.save();

          results.push({
            id: existing._id,
            subject: existing.subject,
            from: existing.sender,
            category: existing.category,
          });

          continue;
        }

        const rawEmail = new RawEmail({
          userId: user._id,
          subject,
          sender: from,
          body: bodyText,
          dateReceived: parsedDate,
          gmailId: msg.id,
          category,
        });

        await rawEmail.save();

        results.push({
          id: rawEmail._id,
          subject,
          from,
          category,
        });
      } catch (perEmailErr) {
        console.error("PER EMAIL SYNC ERROR:", msg.id, perEmailErr);
        failed.push({
          gmailId: msg.id,
          error: getReadableError(perEmailErr),
        });
      }
    }

    return res.json({
      synced: results.length,
      failed: failed.length,
      emails: results,
      failedEmails: failed,
    });
  } catch (err) {
    console.error("SYNC ERROR:", err?.response?.data || err);

    return res.status(500).json({
      error: getReadableError(err),
    });
  }
});

// Check if Gmail is connected
router.get("/auth-status", async (req, res) => {
  try {
    const user = await User.findOne({});
    const gmailConnected = !!(user && user.gmailToken && user.gmailToken.access_token);

    res.json({ gmailConnected });
  } catch (err) {
    console.error("AUTH-STATUS ERROR", err);
    res.status(500).json({ gmailConnected: false, error: "Server error" });
  }
});

// GET /api/emails - list raw emails
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

// GET /api/emails/:id - single email
router.get("/emails/:id", async (req, res) => {
  try {
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

// TEMP route: force update one Gmail message into Mongo
router.post("/fix-one", async (req, res) => {
  try {
    const user = await User.findOne({});
    if (!user) return res.status(401).json({ error: "User not found" });
    if (!user.gmailToken) {
      return res.status(400).json({ error: "No Gmail token saved" });
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(user.gmailToken);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const gmailId = "19d15648a2201c6d";

    const full = await gmail.users.messages.get({
      userId: "me",
      id: gmailId,
      format: "full",
    });

    const payload = full.data.payload || {};
    const headers = payload.headers || [];

    const getHeader = (name) =>
      headers.find((h) => (h.name || "").toLowerCase() === name.toLowerCase())?.value || "";

    const subject = getHeader("Subject");
    const from = getHeader("From");
    const date = getHeader("Date");
    const bodyText = extractEmailBody(payload) || full.data.snippet || "";

    console.log("FIX ONE BODY LENGTH:", bodyText.length);
    console.log("FIX ONE BODY PREVIEW:", bodyText.slice(0, 200));

    let category = "others";
    try {
      category = await classifyEmail(subject || "", bodyText || "");
    } catch (e) {
      console.error("FIX ONE classify error for", gmailId, e);
    }

    const updated = await RawEmail.findOneAndUpdate(
      { gmailId, userId: user._id },
      {
        $set: {
          subject,
          sender: from,
          body: bodyText,
          dateReceived: safeDate(date),
          category,
        },
      },
      { new: true, upsert: true }
    );

    return res.json({ updated });
  } catch (err) {
    console.error("FIX ONE ERROR", err?.response?.data || err);
    res.status(500).json({ error: getReadableError(err) });
  }
});

// TEMP route: inspect raw Gmail payload for one message
router.get("/debug-email", async (req, res) => {
  try {
    const user = await User.findOne({});
    if (!user) return res.status(401).json({ error: "User not found" });
    if (!user.gmailToken) {
      return res.status(400).json({ error: "No Gmail token saved" });
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(user.gmailToken);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const gmailId = "19d15648a2201c6d";

    const full = await gmail.users.messages.get({
      userId: "me",
      id: gmailId,
      format: "full",
    });

    console.log(
      "GMAIL RAW PAYLOAD for",
      gmailId,
      JSON.stringify(full.data.payload, null, 2)
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("DEBUG EMAIL ERROR", err?.response?.data || err);
    res.status(500).json({ error: getReadableError(err) });
  }
});

module.exports = router;