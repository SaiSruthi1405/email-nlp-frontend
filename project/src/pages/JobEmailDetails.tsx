import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileText,
  Mail,
  RefreshCcw,
  Sparkles,
  User,
  Upload,
} from "lucide-react";
import Navbar from "../components/Navbar";

type JobEmail = {
  _id?: string;
  id?: string;
  subject?: string;
  sender?: string;
  body?: string;
  dateReceived?: string;
  gmailId?: string;
  company?: string;
  rawemail?: {
    subject?: string;
    sender?: string;
    body?: string;
    dateReceived?: string;
    datereceived?: string;
    gmailId?: string;
    gmailid?: string;
  };
  raw_email?: {
    subject?: string;
    sender?: string;
    body?: string;
    dateReceived?: string;
    datereceived?: string;
    gmailId?: string;
    gmailid?: string;
  };
};

type JobLocationState = {
  job?: JobEmail;
};

type CompareResumeJobResponse = {
  matchPercentage?: string;
  matchingSkills?: string[];
  missingSkills?: string[];
  summary?: {
    jobSkills?: string[];
    resumeSkills?: string[];
    suggestions?: Record<string, string>;
  };
  error?: string;
};

export default function JobEmailDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const stateJob = (location.state as JobLocationState | null)?.job ?? null;

  const [email, setEmail] = useState<JobEmail | null>(stateJob);
  const [loading, setLoading] = useState<boolean>(!stateJob);
  const [error, setError] = useState("");
  const [showComparison, setShowComparison] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState("Sai_Sruthi_Resume.pdf");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");
  const [resumePath, setResumePath] = useState<string>("");

  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [matchPercentage, setMatchPercentage] = useState("");
  const [matchingSkills, setMatchingSkills] = useState<string[]>([
    "HTML",
    "CSS",
    "JavaScript",
    "React",
  ]);
  const [missingSkills, setMissingSkills] = useState<string[]>([
    "Responsive Testing",
    "System Design",
  ]);

  useEffect(() => {
    if (stateJob) return;

    if (!id) {
      setError("No job ID provided.");
      setLoading(false);
      return;
    }

    const fetchJobById = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("http://localhost:5000/api/emails/jobs");
        if (!res.ok) {
          throw new Error("Failed to fetch job emails");
        }

        const data = await res.json();
        const jobs: JobEmail[] = Array.isArray(data) ? data : [];

        const found = jobs.find((job) => job.id === id || job._id === id);

        if (!found) {
          throw new Error("Job email not found");
        }

        setEmail(found);
      } catch (err) {
        console.error("Failed to load job email", err);
        setError("Could not load job email");
      } finally {
        setLoading(false);
      }
    };

    fetchJobById();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const raw = email?.rawemail || email?.raw_email;

  const subject = email?.subject || raw?.subject || "No subject";
  const sender = email?.sender || raw?.sender || "Unknown sender";
  const body = email?.body || raw?.body || "No email content available.";
  const dateReceived =
    email?.dateReceived || raw?.dateReceived || raw?.datereceived || "";
  const gmailId = email?.gmailId || raw?.gmailId || raw?.gmailid || "";

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleResumeButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleResumeChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    setResumeName(file.name);
    setResumeMessage("");
    setCompareError("");
    setMatchPercentage("");
    setShowComparison(false);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setUploadingResume(true);

      const res = await fetch("http://localhost:5000/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || `Resume upload failed: ${res.status}`);
      }

      setResumeName(data.filename || file.name);
      setResumePath(data.path || "");
      setResumeMessage(data.message || "Resume uploaded successfully.");
    } catch (err: any) {
      console.error("Resume upload failed", err);
      setResumeMessage("Resume upload failed. Please check backend API.");
      setResumePath("");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleCompareClick = async () => {
    if (showComparison) {
      setShowComparison(false);
      return;
    }

    if (!resumePath) {
      setResumeMessage("Please upload your resume first.");
      return;
    }

    if (!body || body === "No email content available.") {
      setCompareError("Job email content is not available for comparison.");
      setShowComparison(true);
      return;
    }

    try {
      setComparing(true);
      setCompareError("");
      setResumeMessage("");
      setShowComparison(true);

      const res = await fetch("http://localhost:5000/api/ml/compare-resume-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumePath,
          jobText: body,
        }),
      });

      const data: CompareResumeJobResponse = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to compare resume with job email");
      }

      setMatchPercentage(data.matchPercentage || "");
      setMatchingSkills(
        Array.isArray(data.matchingSkills) && data.matchingSkills.length > 0
          ? data.matchingSkills
          : []
      );
      setMissingSkills(
        Array.isArray(data.missingSkills) && data.missingSkills.length > 0
          ? data.missingSkills
          : []
      );
    } catch (err: any) {
      console.error("Resume comparison failed", err);
      setCompareError(
        err?.message || "Resume comparison failed. Please check backend API."
      );
      setMatchingSkills([]);
      setMissingSkills([]);
      setMatchPercentage("");
    } finally {
      setComparing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-10 text-gray-600">
          Loading job email...
        </div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
            <h2 className="text-2xl font-bold text-red-700">Job Email Not Found</h2>
            <p className="text-red-600 mt-2">
              {error || "We could not load this job email."}
            </p>
            <button
              onClick={() => navigate("/jobs")}
              className="mt-5 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Return to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-[1500px] mx-auto px-6 py-8 space-y-6">
        <button
          onClick={() => navigate("/jobs")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft size={18} />
          Back to Jobs
        </button>

        <div className="grid grid-cols-1 gap-6">
          <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="max-w-5xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-4">
                  <Mail size={14} />
                  Job Email
                </div>

                <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                  {subject}
                </h1>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="flex items-start gap-3">
                    <User size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-500">From</p>
                      <p className="text-gray-900 font-medium break-words">
                        {sender}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="text-gray-900 font-medium">
                        {formatDate(dateReceived)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {gmailId && (
                <a
                  href={`https://mail.google.com/mail/u/0/#inbox/${gmailId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <ExternalLink size={16} />
                  Open in Gmail
                </a>
              )}
            </div>

            <div className="mt-8 border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-5">
                Original Email
              </h2>

              <div className="bg-gray-50 rounded-2xl p-6 min-h-[520px] max-h-none overflow-visible">
                <div className="whitespace-pre-wrap break-words text-gray-700 leading-8 text-[17px]">
                  {body}
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-center">
            <div className="w-full max-w-2xl bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
                  <FileText size={24} />
                </div>

                <p className="text-sm text-gray-500">Current Resume</p>
                <h3 className="font-semibold text-gray-900 text-2xl mt-2">
                  {resumeName}
                </h3>
                <p className="text-sm text-gray-500 mt-2 max-w-lg">
                  Upload or change your resume here and use it for comparison with this job email.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleResumeChange}
                />

                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleResumeButtonClick}
                    disabled={uploadingResume}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <Upload size={16} />
                    {uploadingResume ? "Uploading..." : "Upload Resume"}
                  </button>

                  <button
                    type="button"
                    onClick={handleResumeButtonClick}
                    disabled={uploadingResume}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <RefreshCcw size={16} />
                    Change Resume
                  </button>
                </div>

                {resumeFile && (
                  <p className="text-sm text-gray-600 mt-4">
                    Selected file: {resumeFile.name}
                  </p>
                )}

                {resumeMessage && (
                  <p className="text-sm mt-3 text-indigo-600 font-medium">
                    {resumeMessage}
                  </p>
                )}

                {resumePath && (
                  <p className="text-xs mt-2 text-gray-500 break-all">
                    (Saved path: {resumePath})
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-2xl bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-center">
                <button
                  onClick={handleCompareClick}
                  disabled={comparing}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  <Sparkles size={16} />
                  {comparing
                    ? "Comparing..."
                    : showComparison
                    ? "Hide Resume Comparison"
                    : "Compare with Resume"}
                </button>
              </div>

              {showComparison && (
                <div className="mt-6 space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 text-center">
                      Resume Comparison
                    </h3>
                    {matchPercentage && (
                      <p className="text-center text-sm text-indigo-600 font-medium mt-2">
                        Match Percentage: {matchPercentage}
                      </p>
                    )}
                    {compareError && (
                      <p className="text-center text-sm text-red-600 font-medium mt-2">
                        {compareError}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-3 text-center">
                      Matching Skills
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {matchingSkills.length > 0 ? (
                        matchingSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center">
                          No matching skills found.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-3 text-center">
                      Missing Skills
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {missingSkills.length > 0 ? (
                        missingSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center">
                          No missing skills found.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}