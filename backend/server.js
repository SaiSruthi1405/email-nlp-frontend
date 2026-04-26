const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

const emailsRouter = require("./routes/emails");
const authRouter = require("./routes/auth");
const syncRouter = require("./routes/sync");
const resumeRoutes = require("./routes/resumeRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
 * Single compare proxy
 * Expects: { resumePath: string, jobText: string }
 */
app.post("/api/ml/compare-resume-job", async (req, res) => {
  try {
    const { resumePath, jobText } = req.body;

    if (!resumePath || !jobText) {
      return res.status(400).json({
        error: "resumePath and jobText are required",
      });
    }

    const mlRes = await axios.post("http://localhost:8001/compare-resume-job", {
      resumePath,
      jobText,
    });

    return res.json(mlRes.data);
  } catch (err) {
    console.error(
      "ML compare error:",
      err.response?.data || err.message || err
    );

    return res.status(err.response?.status || 500).json({
      error: "ML compare failed",
      detail:
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message,
    });
  }
});

/**
 * Bulk compare proxy
 * Expects:
 * {
 *   resumePath: string,
 *   jobs: [{ id, subject, sender, company, body, jobText }]
 * }
 */
app.post("/api/resume/compare-bulk", async (req, res) => {
  try {
    const { resumePath, jobs } = req.body;

    if (!resumePath || !Array.isArray(jobs)) {
      return res.status(400).json({
        error: "resumePath and jobs array are required",
      });
    }

    const results = [];

    for (const job of jobs) {
      if (!job?.id) continue;

      const jobText =
        String(job.jobText || "").trim() ||
        [job.subject || "", job.sender || "", job.company || "", job.body || ""]
          .join("\n")
          .trim();

      if (!jobText) {
        results.push({
          id: String(job.id),
          matchPercentage: 0,
          error: "Empty job text",
        });
        continue;
      }

      try {
        const mlRes = await axios.post(
          "http://localhost:8001/compare-resume-job",
          {
            resumePath,
            jobText,
          }
        );

        const matchPercentage =
          mlRes.data?.matchPercentage ??
          mlRes.data?.match_percentage ??
          mlRes.data?.score ??
          0;

        results.push({
          id: String(job.id),
          matchPercentage: Number(matchPercentage),
          raw: mlRes.data,
        });
      } catch (innerErr) {
        console.error(
          `ML compare failed for job ${job.id}:`,
          innerErr.response?.data || innerErr.message || innerErr
        );

        results.push({
          id: String(job.id),
          matchPercentage: 0,
          error:
            innerErr.response?.data?.detail ||
            innerErr.response?.data?.message ||
            innerErr.response?.data?.error ||
            innerErr.message,
        });
      }
    }

    return res.json({ results });
  } catch (err) {
    console.error("Bulk compare error:", err.response?.data || err.message || err);

    return res.status(500).json({
      error: "Bulk compare failed",
      detail:
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});