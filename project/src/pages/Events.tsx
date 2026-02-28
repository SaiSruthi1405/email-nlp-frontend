import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Link as LinkIcon, Bell, BellOff, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import { mockClassifiedEmails } from '../mockData';

export default function Events() {
  const navigate = useNavigate();
  const eventEmails = mockClassifiedEmails.filter(
    email => email.category === 'event' && email.event_date
  );

  const sortedEvents = [...eventEmails].sort((a, b) => {
    const dateA = new Date(a.event_date!).getTime();
    const dateB = new Date(b.event_date!).getTime();
    return dateA - dateB;
  });

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    let badge = '';
    if (diffDays === 0) badge = 'Today';
    else if (diffDays === 1) badge = 'Tomorrow';
    else if (diffDays < 0) badge = 'Past';

    return { formattedDate, formattedTime, badge, diffDays };
  };

  const handleViewDetails = (eventId: string) => {
    navigate(`/email/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Events & Interviews</h1>
          <p className="text-gray-600 mt-1">
            {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>

        <div className="space-y-4">
          {sortedEvents.map((event) => {
            const { formattedDate, formattedTime, badge, diffDays } = formatEventDate(event.event_date!);
            const isUpcoming = diffDays >= 0 && diffDays <= 2;

            return (
              <div
                key={event.id}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-md transition-all ${
                  isUpcoming
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-3 rounded-lg ${
                        isUpcoming ? 'bg-red-200' : 'bg-green-100'
                      }`}>
                        <Calendar className={`h-6 w-6 ${
                          isUpcoming ? 'text-red-700' : 'text-green-600'
                        }`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {event.event_title || event.raw_email?.subject}
                          </h3>
                          {badge && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              badge === 'Today' || badge === 'Tomorrow'
                                ? 'bg-red-600 text-white'
                                : badge === 'Past'
                                ? 'bg-gray-300 text-gray-700'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {badge}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{formattedDate} at {formattedTime}</span>
                          </div>

                          {event.event_location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>{event.event_location}</span>
                            </div>
                          )}

                          {event.organizer && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              <span>{event.organizer}</span>
                            </div>
                          )}
                        </div>

                        {event.meeting_link && (
                          <a
                            href={event.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <LinkIcon className="h-4 w-4 mr-1" />
                            Join Meeting
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        event.reminder_set
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {event.reminder_set ? (
                          <>
                            <Bell className="h-4 w-4" />
                            <span className="text-sm font-medium">Reminder Set</span>
                          </>
                        ) : (
                          <>
                            <BellOff className="h-4 w-4" />
                            <span className="text-sm font-medium">No Reminder</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewDetails(event.id)}
                    className="ml-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>Details</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {sortedEvents.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No events scheduled</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
