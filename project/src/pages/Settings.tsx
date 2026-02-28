import { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, User, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import { mockUser } from '../mockData';

export default function Settings() {
  const [jobExtraction, setJobExtraction] = useState(true);
  const [eventDetection, setEventDetection] = useState(true);
  const [spamFiltering, setSpamFiltering] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 2000);
  };

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your email classification preferences</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Account Information
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Connected Email</p>
                  <div className="flex items-center mt-1">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <p className="text-gray-900 font-semibold">{mockUser.email}</p>
                  </div>
                </div>
                <Mail className="h-8 w-8 text-blue-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Sync</p>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <p className="text-gray-900 font-semibold">
                      {formatLastSync(mockUser.last_sync || mockUser.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Emails Fetched</p>
                  <p className="text-gray-900 font-semibold text-2xl mt-1">127</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900">Classification Settings</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Enable Job Extraction</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Automatically extract job titles, companies, and requirements from job emails
                  </p>
                </div>
                <button
                  onClick={() => setJobExtraction(!jobExtraction)}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    jobExtraction ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      jobExtraction ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Enable Event Detection</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Detect and extract event details including dates, times, and locations
                  </p>
                </div>
                <button
                  onClick={() => setEventDetection(!eventDetection)}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    eventDetection ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      eventDetection ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Filter Spam</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Automatically filter low-priority and promotional emails
                  </p>
                </div>
                <button
                  onClick={() => setSpamFiltering(!spamFiltering)}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    spamFiltering ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      spamFiltering ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900">Email Synchronization</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Manually sync your emails to fetch the latest messages and re-run classification
              </p>

              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`flex items-center space-x-3 px-6 py-3 rounded-lg font-semibold transition-all ${
                  isSyncing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                }`}
              >
                <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing Emails...' : 'Re-sync Emails'}</span>
              </button>

              {isSyncing && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Fetching emails and running AI classification...
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-sm text-gray-600 mb-2">
              This AI-powered email classification system uses machine learning to automatically
              categorize your emails into Jobs, Events, Important, and Others.
            </p>
            <p className="text-sm text-gray-500">
              ML Service: http://127.0.0.1:8000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
