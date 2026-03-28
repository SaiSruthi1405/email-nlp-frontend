import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Mail, User, Calendar } from "lucide-react";
import Navbar from "../components/Navbar";

type RawEmail = {
  _id: string;
  subject: string;
  sender: string;
  body: string;
  dateReceived: string;
  gmailId: string;
};

export default function EmailDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [email, setEmail] = useState<RawEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/emails/${id}`);
        if (!res.ok) {
          throw new Error("Email not found");
        }
        const data = await res.json();
        setEmail({
          _id: data._id,
          subject: data.subject || "(no subject)",
          sender: data.sender || "",
          body: data.body || "",
          dateReceived: data.dateReceived,
          gmailId: data.gmailId,
        });
      } catch (err) {
        console.error("Failed to load email", err);
        setError("Could not load email");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmail();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Loading email...</p>
        </div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Not Found
            </h2>
            <button
              onClick={() => navigate("/inbox")}  // <-- back to Inbox route
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Return to Inbox
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  {email.subject}
                </h1>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium mr-2">From:</span>
                    <span>{email.sender}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium mr-2">Date:</span>
                    <span>{formatDate(email.dateReceived)}</span>
                  </div>
                </div>
              </div>

              <a
                href={`https://mail.google.com/mail/u/0/#search/rfc822msgid:${encodeURIComponent(
                  email.gmailId
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>Open in Gmail</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Email Content
            </h2>
            <div className="prose max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{email.body}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
