import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

type EventEmail = {
  id: string;
  subject?: string;
  from?: string;
  snippet?: string;
  date?: string | null;
  parseddate?: string | null;
  created_at?: string | null;
  raw_email?: {
    subject?: string;
    sender?: string;
    body?: string;
    date_received?: string | null;
    gmail_id?: string;
  };
};

export default function EventEmailDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState<EventEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchEmail = async () => {
      try {
        setLoading(true);
        setError(null);
        // adjust this endpoint to match your backend
        const res = await fetch(`http://localhost:5000/api/emails/events/${id}`);
        if (!res.ok) throw new Error("Failed to load event email");
        const data: EventEmail = await res.json();
        setEmail(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Failed to load event email");
      } finally {
        setLoading(false);
      }
    };

    fetchEmail();
  }, [id]);

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Loading event email...</p>
        </div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-red-600 mb-4">
            {error ?? "Event email not found"}
          </p>
          <button
            onClick={() => navigate("/events")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const subject = email.subject || email.raw_email?.subject || "Event Email";
  const from = email.from || email.raw_email?.sender || "Unknown sender";
  const date =
    email.parseddate ||
    email.created_at ||
    email.raw_email?.date_received ||
    null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/events")}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← Back to Events
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{subject}</h1>
        <div className="text-sm text-gray-600 mb-4">
          <div>From: {from}</div>
          <div>Date: {formatDateTime(date)}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <pre className="whitespace-pre-wrap text-sm text-gray-800">
            {email.raw_email?.body || email.snippet || "No content available."}
          </pre>
        </div>
      </div>
    </div>
  );
}