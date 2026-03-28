import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, ExternalLink, User } from "lucide-react";
import Navbar from "../components/Navbar";
import { ClassifiedEmail } from "../types";

export default function Events() {
  const navigate = useNavigate();

  const [eventEmails, setEventEmails] = useState<ClassifiedEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/emails");
        if (!res.ok) throw new Error("Failed to load emails");
        const data: ClassifiedEmail[] = await res.json();
        setEventEmails(data.filter((email) => email.category === "event"));
      } catch (err) {
        console.error("Failed to load event emails", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const upcomingEvents = eventEmails.filter((event) => {
    if (!event.event_date) return false;
    return new Date(event.event_date) > new Date();
  });

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

  const handleViewDetails = (eventId: string) => {
    navigate(`/email/${eventId}`);
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Events & Reminders</h1>
          <p className="text-gray-600 mt-1">
            {upcomingEvents.length} upcoming event
            {upcomingEvents.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {event.event_title ||
                      event.raw_email?.subject ||
                      "Upcoming Event"}
                  </h3>

                  <div className="flex flex-wrap gap-4 mb-4">
                    {event.event_date && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {formatDateTime(event.event_date)}
                        </span>
                      </div>
                    )}

                    {event.event_location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">{event.event_location}</span>
                      </div>
                    )}

                    {event.organizer && (
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        <span className="text-sm">{event.organizer}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleViewDetails(event.id)}
                  className="ml-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>View Details</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {upcomingEvents.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No upcoming events found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
