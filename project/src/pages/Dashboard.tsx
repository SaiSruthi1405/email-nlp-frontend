import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/emails");
        if (!res.ok) throw new Error("Failed to load emails");
        const data = await res.json();
        setEmails(data);
      } catch (err) {
        console.error("Failed to load dashboard emails", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmails();
  }, []);

  const stats = {
    total: emails.length,
    jobs: emails.filter((e) => e.category === "jobs").length,
    events: emails.filter((e) => e.category === "events").length,
    important: emails.filter((e) => e.category === "important").length,
    spam: emails.filter((e) => e.category === "spam").length,
  };

  const recentEmails = emails.slice(0, 5);

  // use "events" (plural) here to match Mongo
  const upcomingEvents = emails
    .filter((email) => email.category === "events" && email.event_date)
    .filter((email) => new Date(email.event_date!) > new Date()).length;

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

        {/* Stats cards */}
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
            subtitle="Found this month"
          />
          <StatsCard
            title="Upcoming Events"
            value={upcomingEvents}
            icon={Calendar}
            iconColor="text-orange-600"
            bgColor="bg-orange-100"
            subtitle={
              upcomingEvents > 0 ? "Events coming soon" : "No upcoming events"
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
            value={
              stats.total -
              stats.jobs -
              stats.events -
              stats.important -
              stats.spam
            }
            icon={Inbox}
            iconColor="text-gray-600"
            bgColor="bg-gray-100"
            subtitle="Promotions & newsletters"
          />
        </div>

        {/* Quick actions + recent activity */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                to="/jobs"
                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    View Job Opportunities
                  </span>
                </div>
                <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/events"
                className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">
                    View Upcoming Events
                  </span>
                </div>
                <ArrowRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/emails"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Inbox className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    Open Inbox View
                  </span>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
              <Link
                to="/emails"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentEmails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      email.category === "jobs"
                        ? "bg-blue-100"
                        : email.category === "events"
                        ? "bg-green-100"
                        : email.category === "important"
                        ? "bg-yellow-100"
                        : email.category === "spam"
                        ? "bg-red-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {email.category === "jobs" && (
                      <Briefcase className="h-4 w-4 text-blue-600" />
                    )}
                    {email.category === "events" && (
                      <Calendar className="h-4 w-4 text-green-600" />
                    )}
                    {email.category === "important" && (
                      <Star className="h-4 w-4 text-yellow-600" />
                    )}
                    {email.category === "spam" && (
                      <Ban className="h-4 w-4 text-red-600" />
                    )}
                    {email.category === "others" && (
                      <Inbox className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {email.raw_email?.subject ||
                        email.job_title ||
                        "(no subject)"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {email.raw_email?.sender}
                    </p>
                  </div>
                </div>
              ))}

              {recentEmails.length === 0 && (
                <p className="text-sm text-gray-500">
                  No recent activity yet. Connect Gmail and run classification.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}