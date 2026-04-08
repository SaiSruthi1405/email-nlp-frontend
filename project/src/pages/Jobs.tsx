import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Search, Upload, RefreshCcw, FileText } from "lucide-react";
import Navbar from "../components/Navbar";

type RawEmailBackend = {
  subject?: string;
  sender?: string;
  body?: string;
  date_received?: string;
  gmail_id?: string;
};

type JobEmail = {
  _id?: string;
  id?: string;
  category?: string;
  company?: string;
  created_at?: string;
  subject?: string;
  sender?: string;
  date?: string;
  dateReceived?: string;
  rawemail?: any;
  raw_email?: RawEmailBackend;
};

export default function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<JobEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // resume upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState("Sai_Sruthi_Resume.pdf");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");

  const fetchJobEmails = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("http://localhost:5000/api/emails/jobs");
      if (!res.ok) {
        throw new Error(`Failed to fetch job emails: ${res.status}`);
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Jobs API did not return an array");
      }

      setJobs(data);
    } catch (err) {
      console.error("Failed to load job emails", err);
      setError("Could not load job emails");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobEmails();
  }, []);

  const getJobId = (job: JobEmail): string =>
    String(job.id || job._id || "");

  const getSubject = (job: JobEmail): string =>
    job.subject || job.raw_email?.subject || "No subject";

  const getSender = (job: JobEmail): string =>
    job.sender || job.raw_email?.sender || "Unknown sender";

  const getCompany = (job: JobEmail): string =>
    job.company || "Unknown company";

  const getDateValue = (job: JobEmail): string =>
    job.date ||
    job.dateReceived ||
    job.created_at ||
    job.raw_email?.date_received ||
    "";

  const formatRelativeDate = (dateString?: string): string => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleJobClick = (job: JobEmail) => {
    const jobId = getJobId(job);

    if (!jobId) {
      console.warn("Cannot open job — missing id/_id fields:", job);
      return;
    }

    navigate(`/job-email/${jobId}`, { state: { job } });
  };

  // resume upload handlers
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

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setUploadingResume(true);

      const res = await fetch("http://localhost:5000/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Resume upload failed: ${res.status}`);
      }

      const data = await res.json();
      setResumeMessage(data?.message || "Resume uploaded successfully.");
    } catch (err) {
      console.error("Resume upload failed", err);
      setResumeMessage("Resume upload failed. Please check backend API.");
    } finally {
      setUploadingResume(false);
    }
  };

  const filteredJobs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return jobs;

    return jobs.filter((job) => {
      const subject = getSubject(job).toLowerCase();
      const sender = getSender(job).toLowerCase();
      const company = getCompany(job).toLowerCase();

      return (
        subject.includes(term) ||
        sender.includes(term) ||
        company.includes(term)
      );
    });
  }, [jobs, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-10 text-gray-600">
          Loading job emails...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={fetchJobEmails}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              <RefreshCcw size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Heading */}
        <div className="text-left">
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-600 mt-2">
            Job-related emails curated from your inbox.
          </p>
        </div>

        {/* Centered resume upload card */}
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
                Upload your latest resume here and use it as the default profile
                for all job comparisons.
              </p>

              {/* hidden input */}
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
            </div>
          </div>
        </div>

        {/* Job emails table */}
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Job Emails</h2>
              <p className="text-gray-500 mt-1">
                Click any row to view the complete email and compare it with your resume.
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by subject, sender, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="hidden md:grid grid-cols-12 px-6 py-4 bg-gray-50 text-sm font-semibold text-gray-500">
            <div className="col-span-5">Subject</div>
            <div className="col-span-4">Sender / Company</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1 text-right">Open</div>
          </div>

          <div>
            {filteredJobs.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-500">
                No job emails found.
              </div>
            ) : (
              filteredJobs.map((job, index) => {
                const jobId = getJobId(job);
                const subject = getSubject(job);
                const sender = getSender(job);
                const company = getCompany(job);
                const dateValue = getDateValue(job);

                return (
                  <button
                    key={jobId || index}
                    type="button"
                    onClick={() => handleJobClick(job)}
                    className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-0 px-6 py-5 border-b border-gray-100 hover:bg-gray-50 transition text-left"
                  >
                    <div className="md:col-span-5">
                      <p className="font-semibold text-gray-900 line-clamp-2">
                        {subject}
                      </p>
                    </div>

                    <div className="md:col-span-4">
                      <p className="text-gray-800">{sender}</p>
                      <p className="text-sm text-gray-500">{company}</p>
                    </div>

                    <div className="md:col-span-2 text-sm text-gray-500">
                      {formatRelativeDate(dateValue)}
                    </div>

                    <div className="md:col-span-1 flex md:justify-end text-indigo-600">
                      <ChevronRight size={20} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}