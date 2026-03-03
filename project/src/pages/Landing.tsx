import { Mail, CheckCircle, Shield, Zap } from "lucide-react";

export default function Landing() {

  const handleConnectGmail = () => {
    // Redirect to FastAPI Google OAuth
    window.location.href = "http://localhost:8000/auth/google/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl">
              <Mail className="h-16 w-16 text-white" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI-Powered Email Classification
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automatically organize your emails into Jobs, Events, and Important
            categories using advanced machine learning
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Classification
            </h3>

            <p className="text-gray-600">
              AI categorizes your emails into Jobs, Events, Important, and Others automatically
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Job Extraction
            </h3>

            <p className="text-gray-600">
              Automatically extracts job titles, companies, skills, and deadlines from job emails
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="bg-orange-100 p-3 rounded-lg w-fit mb-4">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Spam Filtering
            </h3>

            <p className="text-gray-600">
              Intelligent spam detection keeps your inbox clean and focused
            </p>
          </div>

        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md mx-auto">

          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Get Started
          </h2>

          <button
            onClick={handleConnectGmail}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-3 shadow-sm"
          >
            <Mail className="h-5 w-5" />
            <span>Sign in with Google</span>
          </button>

          <p className="text-sm text-gray-500 mt-4 text-center">
            Secure login using your Google account to access Gmail and classify emails.
          </p>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Your data is secure and private. We only access emails for classification purposes.
          </p>
        </div>

      </div>
    </div>
  );
}