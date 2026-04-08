const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const emailsRouter = require("./routes/emails");
const authRouter = require("./routes/auth");
const syncRouter = require("./routes/sync");
const resumeRoutes = require("./routes/resumeRoutes");
const axios = require("axios"); // <--- ADD THIS

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error", err));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/api/emails", emailsRouter);
app.use("/api", syncRouter);
app.use("/api/resume", resumeRoutes);

/**
 * ML proxy: compare resume with job text
 * Expects: { resumePath: string, jobText: string }
 * Forwards to Python: http://localhost:8001/compare-resume-job
 */
app.post("/api/ml/compare-resume-job", async (req, res) => {
  try {
    const { resumePath, jobText } = req.body;

    if (!resumePath || !jobText) {
      return res.status(400).json({ error: "resumePath and jobText are required" });
    }

    const mlRes = await axios.post("http://localhost:8001/compare-resume-job", {
      resumePath,
      jobText,
    });

    return res.json(mlRes.data);
  } catch (err) {
    console.error("ML compare error:", err.message);
    return res.status(500).json({ error: "ML compare failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});