const { google } = require("googleapis");

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:5000/auth/google/callback"   // must match exactly
  );
}

module.exports = { createOAuthClient };
