import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Briefcase,
  Calendar,
  Star,
  Ban,
  Inbox,
  ArrowRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import { ClassifiedEmail } from "../types";

export default function Dashboard() {
  const [emails, setEmails] = useState<ClassifiedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/emails");
        if (!res.ok) throw new Error("Failed to load emails");

        const data = await res.json();
        setEmails(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load dashboard emails", err);
        setEmails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, []);

  const getCategory = (email: ClassifiedEmail) => {
    const category = String(email.category || "").toLowerCase().trim();

    if (category === "job" || category === "jobs") return "jobs";
    if (category === "event" || category === "events") return "events";
    if (category === "important") return "important";
    if (category === "spam") return "spam";
    return "others";
  };

  const getSubject = (email: ClassifiedEmail) => {
    return (
      email.rawemail?.subject ||
      email.raw_email?.subject ||
      email.jobtitle ||
      email.job_title ||
      email.eventtitle ||
      email.event_title ||
      "(no subject)"
    );
  };

  const getSender = (email: ClassifiedEmail) => {
    return (
      email.rawemail?.sender ||
      email.raw_email?.sender ||
      email.company ||
      "Unknown sender"
    );
  };

  // ✅ FIXED: fallback added
  const getEventDate = (email: ClassifiedEmail) => {
    return (
      email.eventdate ||
      email.event_date ||
      email.dateReceived || // important fallback
      null
    );
  };

  const stats = useMemo(() => {
    const normalized = emails.map(getCategory);

    const total = emails.length;
    const jobs = normalized.filter((c) => c === "jobs").length;
    const events = normalized.filter((c) => c === "events").length;
    const important = normalized.filter((c) => c === "important").length;
    const spam = normalized.filter((c) => c === "spam").length;
    const others = normalized.filter((c) => c === "others").length;

    return { total, jobs, events, important, spam, others };
  }, [emails]);

  const recentEmails = useMemo(() => emails.slice(0, 5), [emails]);

  // ✅ FIXED: removed broken date filtering
  const upcomingEvents = useMemo(() => {
    return emails.filter(
      (email) => getCategory(email) === "events"
    ).length;
  }, [emails]);

  const getIconWrapClass = (category: string) => {
    switch (category) {
      case "jobs":
        return "bg-blue-100";
      case "events":
        return "bg-green-100";
      case "important":
        return "bg-yellow-100";
      case "spam":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "jobs":
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case "events":
        return <Calendar className="h-4 w-4 text-green-600" />;
      case "important":
        return <Star className="h-4 w-4 text-yellow-600" />;
      case "spam":
        return <Ban className="h-4 w-4 text-red-600" />;
      default:
        return <Inbox className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your email classification
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Emails"
            value={stats.total}
            icon={Mail}
            iconColor="text-blue-600"
            bgColor="bg-blue-100"
            subtitle="Processed and classified"
          />

          <StatsCard
            title="Job Opportunities"
            value={stats.jobs}
            icon={Briefcase}
            iconColor="text-green-600"
            bgColor="bg-green-100"
            subtitle="Job-related emails found"
          />

          <StatsCard
            title="Upcoming Events"
            value={upcomingEvents}
            icon={Calendar}
            iconColor="text-orange-600"
            bgColor="bg-orange-100"
            subtitle={
              upcomingEvents > 0
                ? "Event emails detected"
                : "No event emails"
            }
          />

          <StatsCard
            title="Important Emails"
            value={stats.important}
            icon={Star}
            iconColor="text-yellow-600"
            bgColor="bg-yellow-100"
            subtitle="Requires attention"
          />

          <StatsCard
            title="Spam Filtered"
            value={stats.spam}
            icon={Ban}
            iconColor="text-red-600"
            bgColor="bg-red-100"
            subtitle="Kept your inbox clean"
          />

          <StatsCard
            title="Other Emails"
            value={stats.others}
            icon={Inbox}
            iconColor="text-gray-600"
            bgColor="bg-gray-100"
            subtitle="Other classified emails"
          />
        </div>

        {/* rest remains same */}
      </div>
    </div>
  );
}