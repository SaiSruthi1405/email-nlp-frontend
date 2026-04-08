// src/pages/Jobs.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  RefreshCcw,
  Search,
  ChevronRight,
} from "lucide-react";
import Navbar from "../components/Navbar";

type ClassifiedJobEmail = {
  id: string;              // from backend
  subject: string;
  sender: string;
  dateReceived: string;
  gmailId?: string;
  category: string;        // "jobs", "important", "others", ...
  snippet?: string;
};

export default function Jobs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [jobEmails, setJobEmails] = useState<ClassifiedJobEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/emails");
        if (!res.ok) throw new Error("Failed to load emails");
        const data: ClassifiedJobEmail[] = await res.json();

        // only keep category === "jobs"
        const jobsOnly = data.filter((email) => email.category === "jobs");
        setJobEmails(jobsOnly);
      } catch (err) {
        console.error("Failed to load job emails", err);
        setError("Could not load job emails");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobEmails;

    return jobEmails.filter(
      (j) =>
        j.subject?.toLowerCase().includes(q) ||
        j.sender?.toLowerCase().includes(q) ||
        j.snippet?.toLowerCase().includes(q)
    );
  }, [jobEmails, search]);

  // IMPORTANT: use the classified email id and your JobEmailDetails route
  const handleOpenJob = (id: string) => {
    navigate(`/job-email/${id}`);
  };

  const handleUploadResume = () => navigate("/resume-upload");
  const handleChangeResume = () => navigate("/resume-upload");

  if (loading) {
    return (
      <div style={styles.page}>
        <Navbar />
        <main style={styles.main}>
          <p style={styles.infoText}>Loading job emails...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <Navbar />
        <main style={styles.main}>
          <p style={styles.errorText}>{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.main}>
        <section style={styles.headerBlock}>
          <div>
            <h1 style={styles.title}>Jobs</h1>
            <p style={styles.subtitle}>
              Job-related emails curated from your inbox.
            </p>
          </div>
        </section>

        {/* Resume card */}
        <section style={styles.resumeCard}>
          <div style={styles.resumeLeft}>
            <div style={styles.resumeIconWrap}>
              <FileText size={22} color="#3563E9" />
            </div>
            <div>
              <p style={styles.resumeLabel}>Current Resume</p>
              <h2 style={styles.resumeName}>Sai_Sruthi_Resume.pdf</h2>
              <p style={styles.resumeMeta}>
                Used as the default profile for all job comparisons.
              </p>
            </div>
          </div>

          <div style={styles.resumeActions}>
            <button style={styles.secondaryButton} onClick={handleUploadResume}>
              <Upload size={16} />
              Upload Resume
            </button>
            <button style={styles.primaryButton} onClick={handleChangeResume}>
              <RefreshCcw size={16} />
              Change Resume
            </button>
          </div>
        </section>

        {/* Jobs table */}
        <section style={styles.tableCard}>
          <div style={styles.tableToolbar}>
            <div>
              <h3 style={styles.tableTitle}>Job Emails</h3>
              <p style={styles.tableSubtitle}>
                Click any row to view the complete email and compare it with your resume.
              </p>
            </div>

            <div style={styles.searchWrap}>
              <Search size={16} color="#6B7280" />
              <input
                type="text"
                placeholder="Search jobs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          <div style={styles.tableScroll}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Sender</th>
                  <th style={styles.th}>Date</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Open</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    style={styles.row}
                    onClick={() => handleOpenJob(job.id)}
                  >
                    <td style={styles.tdSubject}>
                      <div style={styles.subjectText}>
                        {job.subject || "No subject"}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.senderText}>
                        {job.sender || "Unknown sender"}
                      </div>
                    </td>
                    <td style={styles.tdMuted}>
                      {formatDate(job.dateReceived)}
                    </td>
                    <td style={styles.tdArrow}>
                      <ChevronRight size={18} color="#3563E9" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredJobs.length === 0 && (
            <div style={styles.emptyState}>
              No job emails match your search.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#F5F7FB",
    color: "#111827",
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 24px 48px",
  },
  headerBlock: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "40px",
    lineHeight: 1.1,
    margin: 0,
    fontWeight: 700,
    color: "#111827",
  },
  subtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#6B7280",
    fontSize: "16px",
  },
  resumeCard: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "center",
    flexWrap: "wrap",
    boxShadow: "0 10px 30px rgba(17, 24, 39, 0.05)",
    marginBottom: "24px",
  },
  resumeLeft: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  resumeIconWrap: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    background: "#EEF4FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resumeLabel: {
    margin: 0,
    color: "#6B7280",
    fontSize: "13px",
    fontWeight: 600,
  },
  resumeName: {
    margin: "6px 0 4px",
    fontSize: "20px",
    color: "#111827",
  },
  resumeMeta: {
    margin: 0,
    color: "#6B7280",
    fontSize: "14px",
  },
  resumeActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "none",
    background: "#3563E9",
    color: "#FFFFFF",
    padding: "12px 16px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    color: "#374151",
    padding: "12px 16px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  tableCard: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(17, 24, 39, 0.05)",
  },
  tableToolbar: {
    padding: "20px 24px",
    borderBottom: "1px solid #E5E7EB",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  tableTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#111827",
  },
  tableSubtitle: {
    margin: "6px 0 0",
    fontSize: "14px",
    color: "#6B7280",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "10px 12px",
    minWidth: "250px",
    background: "#F9FAFB",
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    width: "100%",
    fontSize: "14px",
    color: "#111827",
  },
  tableScroll: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "16px 24px",
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#6B7280",
    background: "#F9FAFB",
    borderBottom: "1px solid #E5E7EB",
  },
  row: {
    cursor: "pointer",
    borderBottom: "1px solid #F0F2F5",
  },
  td: {
    padding: "18px 24px",
    verticalAlign: "middle",
  },
  tdSubject: {
    padding: "18px 24px",
    verticalAlign: "middle",
    minWidth: "420px",
  },
  tdMuted: {
    padding: "18px 24px",
    color: "#6B7280",
    whiteSpace: "nowrap",
  },
  tdArrow: {
    padding: "18px 24px",
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  subjectText: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#111827",
  },
  senderText: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#111827",
  },
  emptyState: {
    padding: "28px 24px",
    textAlign: "center",
    color: "#6B7280",
    fontSize: "14px",
  },
  infoText: {
    color: "#6B7280",
    fontSize: "16px",
  },
  errorText: {
    color: "#DC2626",
    fontSize: "16px",
  },
};
