const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { createOAuthClient } = require("../services/googleClient");
const User = require("../models/User"); // make sure you have this model

router.get("/google", (req, res) => {
  const oauth2Client = createOAuthClient();

  const scopes = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.readonly",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });

  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("No code provided");

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    const email = userInfo.email;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, gmailToken: tokens, lastSync: null });
    } else {
      user.gmailToken = tokens;
    }
    await user.save();

    res.send("Gmail connected! You can close this tab and return to the app.");
  } catch (err) {
    console.error("Google callback error", err);
    res.status(500).send("Auth error");
  }
});

module.exports = router;
