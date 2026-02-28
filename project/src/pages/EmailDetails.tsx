import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Mail, User, Calendar, Briefcase, MapPin, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import CategoryBadge from '../components/CategoryBadge';
import PriorityBadge from '../components/PriorityBadge';
import { mockClassifiedEmails } from '../mockData';

export default function EmailDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const email = mockClassifiedEmails.find(e => e.id === id);

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Not Found</h2>
            <button
              onClick={() => navigate('/inbox')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Return to Inbox
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

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
                  {email.raw_email?.subject}
                </h1>

                <div className="flex flex-wrap gap-3 mb-4">
                  <CategoryBadge category={email.category} />
                  <PriorityBadge priority={email.priority} />
                  {email.spam_score > 0.5 && (
                    <span className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      Spam Score: {Math.round(email.spam_score * 100)}%
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium mr-2">From:</span>
                    <span>{email.raw_email?.sender}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium mr-2">Date:</span>
                    <span>{formatDate(email.raw_email?.date_received || email.created_at)}</span>
                  </div>
                </div>
              </div>

              <a
                href={`https://mail.google.com`}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Content</h2>
            <div className="prose max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{email.raw_email?.body}</p>
            </div>
          </div>

          {(email.category === 'job' || email.category === 'event') && (
            <div className="p-6 bg-blue-50 border-t border-blue-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                AI Extracted Information
              </h2>

              {email.category === 'job' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {email.job_title && (
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-1">
                        <Briefcase className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Job Title</span>
                      </div>
                      <p className="text-gray-900 font-semibold">{email.job_title}</p>
                    </div>
                  )}

                  {email.company && (
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-1">
                        <Briefcase className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Company</span>
                      </div>
                      <p className="text-gray-900 font-semibold">{email.company}</p>
                    </div>
                  )}

                  {email.location && (
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-1">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Location</span>
                      </div>
                      <p className="text-gray-900 font-semibold">{email.location}</p>
                    </div>
                  )}

                  {email.experience_level && (
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-1">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Experience</span>
                      </div>
                      <p className="text-gray-900 font-semibold">{email.experience_level}</p>
                    </div>
                  )}

                  {email.application_deadline && (
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Application Deadline</span>
                      </div>
                      <p className="text-gray-900 font-semibold">
                        {formatDate(email.application_deadline)}
                      </p>
                    </div>
                  )}

                  {email.skills && email.skills.length > 0 && (
                    <div className="bg-white p-4 rounded-lg md:col-span-2">
                      <div className="flex items-center text-gray-600 mb-2">
                        <Briefcase className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Required Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {email.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {email.category === 'event' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {email.event_title && (
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Event Title</span>
                      </div>
                      <p className="text-gray-900 font-semibold">{email.event_title}</p>
                    </div>
                  )}

                  {email.event_date && (
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Date & Time</span>
                      </div>
                      <p className="text-gray-900 font-semibold">
                        {formatDate(email.event_date)}
                      </p>
                    </div>
                  )}

                  {email.event_location && (
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-1">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Location</span>
                      </div>
                      <p className="text-gray-900 font-semibold">{email.event_location}</p>
                    </div>
                  )}

                  {email.organizer && (
                    <div className="bg-white p-4 rounded-lg">
                      <div className="flex items-center text-gray-600 mb-1">
                        <User className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Organizer</span>
                      </div>
                      <p className="text-gray-900 font-semibold">{email.organizer}</p>
                    </div>
                  )}

                  {email.meeting_link && (
                    <div className="bg-white p-4 rounded-lg md:col-span-2">
                      <div className="flex items-center text-gray-600 mb-2">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Meeting Link</span>
                      </div>
                      <a
                        href={email.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium break-all"
                      >
                        {email.meeting_link}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
