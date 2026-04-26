import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ExternalLink, User, X, Bell } from "lucide-react";
import Navbar from "../components/Navbar";

type EventEmail = {
  id: string;
  category?: string;
  subject?: string;
  from?: string;
  snippet?: string;
  date?: string | null;
  parseddate?: string | null;
  isReminderEligible?: boolean;
  created_at?: string | null;
  raw_email?: {
    subject?: string;
    sender?: string;
    body?: string;
    date_received?: string | null;
    gmail_id?: string;
  };
};

type ReminderPopup = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  parseddate?: string | null;
};

export default function Events() {
  const navigate = useNavigate();

  const [eventEmails, setEventEmails] = useState<EventEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [popups, setPopups] = useState<ReminderPopup[]>([]);
  const scheduledIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/emails/events");
        if (!res.ok) throw new Error("Failed to load event emails");

        const data: EventEmail[] = await res.json();
        setEventEmails(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load event emails", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch((err) => {
        console.error("Notification permission error:", err);
      });
    }
  }, []);

  useEffect(() => {
    const timers: number[] = [];
    const now = Date.now();

    const reminderEligibleEvents = eventEmails.filter(
      (event) => event.isReminderEligible && event.parseddate
    );

    reminderEligibleEvents.forEach((event) => {
      if (!event.parseddate) return;
      if (scheduledIdsRef.current.has(event.id)) return;

      const triggerTime = new Date(event.parseddate).getTime();
      const delay = triggerTime - now;

      if (delay <= 0) return;

      scheduledIdsRef.current.add(event.id);

      const timer = window.setTimeout(() => {
        const popupItem: ReminderPopup = {
          id: event.id,
          subject: event.subject || event.raw_email?.subject || "Upcoming Event",
          from: event.from || event.raw_email?.sender || "Unknown sender",
          snippet: event.snippet || event.raw_email?.body?.slice(0, 200) || "",
          parseddate: event.parseddate,
        };

        setPopups((prev) => [...prev, popupItem]);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Event Reminder", {
            body: `${popupItem.subject} - ${popupItem.from}`,
          });
        }
      }, delay);

      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [eventEmails]);

  const upcomingCount = useMemo(() => {
    return eventEmails.filter((event) => event.isReminderEligible).length;
  }, [eventEmails]);

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "No date detected";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ✅ navigate to /events/:id (not /email/:id)
  const handleViewDetails = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleClosePopup = (id: string) => {
    setPopups((prev) => prev.filter((popup) => popup.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Events & Reminders</h1>
          <p className="text-gray-600 mt-1">
            {eventEmails.length} event email{eventEmails.length !== 1 ? "s" : ""} found,{" "}
            {upcomingCount} upcoming reminder{upcomingCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-4">
          {eventEmails.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {event.subject || event.raw_email?.subject || "Event Email"}
                  </h3>

                  <div className="flex flex-wrap gap-4 mb-3">
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        {event.from || event.raw_email?.sender || "Unknown sender"}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        {formatDateTime(event.parseddate || event.created_at)}
                      </span>
                    </div>

                    {event.isReminderEligible ? (
                      <div className="flex items-center text-green-600">
                        <Bell className="h-4 w-4 mr-2" />
                        <span className="text-sm">Reminder active</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <Bell className="h-4 w-4 mr-2" />
                        <span className="text-sm">No reminder</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm leading-6">
                    {event.snippet ||
                      event.raw_email?.body?.slice(0, 220) ||
                      "No preview available."}
                  </p>
                </div>

                <button
                  onClick={() => handleViewDetails(event.id)}
                  className="shrink-0 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>View Details</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {eventEmails.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No event emails found.</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-4 left-4 z-50 space-y-3 w-[340px] max-w-[calc(100vw-2rem)]">
        {popups.map((popup) => (
          <div
            key={popup.id}
            className="bg-white border border-gray-200 shadow-lg rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Event Reminder</p>
                <h4 className="text-sm font-medium text-blue-700 mt-1">
                  {popup.subject}
                </h4>
                <p className="text-xs text-gray-600 mt-1">{popup.from}</p>
                <p className="text-xs text-gray-500 mt-2 line-clamp-3">
                  {popup.snippet}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatDateTime(popup.parseddate)}
                </p>
              </div>

              <button
                onClick={() => handleClosePopup(popup.id)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close reminder"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}