import React, { useState } from "react";

const API = "http://localhost:8000";

export default function TestUI() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobBody, setJobBody] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const uploadResume = async () => {
    if (!resumeFile) return alert("Select a PDF first!");
    setLoading(true);
    const form = new FormData();
    form.append("resume_file", resumeFile);
    const res = await fetch(`${API}/upload-resume`, { method: "POST", body: form });
    const data = await res.json();
    setUploadResult(data);
    setStep(2);
    setLoading(false);
  };

  const matchJob = async () => {
    if (!jobBody) return alert("Paste a job email body!");
    setLoading(true);
    const form = new FormData();
    form.append("job_body", jobBody);
    const res = await fetch(`${API}/match`, { method: "POST", body: form });
    const data = await res.json();
    setMatchResult(data);
    setStep(3);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif", padding: 20 }}>
      <h2>Resume Parser — Test UI</h2>

      {/* Step 1 */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h3>Step 1 — Upload Resume (PDF)</h3>
        <input type="file" accept=".pdf" onChange={e => setResumeFile(e.target.files[0])} />
        <br /><br />
        <button onClick={uploadResume} disabled={loading}
          style={{ padding: "8px 20px", background: "#4f46e5", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
          {loading && step === 1 ? "Uploading..." : "Upload & Parse"}
        </button>

        {uploadResult && (
          <div style={{ marginTop: 15, background: "#f0fdf4", padding: 12, borderRadius: 6 }}>
            <b>✅ Resume uploaded!</b>
            <p><b>Skills found:</b> {uploadResult.skills_found?.join(", ") || "None detected"}</p>
          </div>
        )}
      </div>

      {/* Step 2 */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 20, marginBottom: 20, opacity: step >= 2 ? 1 : 0.4 }}>
        <h3>Step 2 — Paste Job Email Body</h3>
        <textarea
          rows={6}
          style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          placeholder="Paste a job email body here to simulate your friend's system..."
          value={jobBody}
          onChange={e => setJobBody(e.target.value)}
        />
        <br /><br />
        <button onClick={matchJob} disabled={loading || step < 2}
          style={{ padding: "8px 20px", background: "#4f46e5", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
          {loading && step === 2 ? "Matching..." : "Match with Resume"}
        </button>
      </div>

      {/* Step 3 - Results */}
      {matchResult && (
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 20, background: "#fafafa" }}>
          <h3>Step 3 — Match Results</h3>

          <div style={{ fontSize: 32, fontWeight: "bold", color: parseInt(matchResult.match_score) > 60 ? "green" : "orange" }}>
            {matchResult.match_score} Match
          </div>

          <p><b>✅ Matched Skills:</b> {matchResult.matched_skills?.join(", ") || "None"}</p>
          <p><b>❌ Missing Skills:</b> {matchResult.missing_skills?.join(", ") || "None"}</p>

          <h4>📚 Suggestions:</h4>
          <ul>
            {Object.entries(matchResult.suggestions || {}).map(([k, v]) => (
              <li key={k}><b>{k}</b>: {v}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}