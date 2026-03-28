import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle, Shield, Zap } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  // whether Gmail is connected
  const [isConnected, setIsConnected] = useState(false);
  // just for showing the green box; we’ll keep it simple for now
  const [userEmail, setUserEmail] = useState("");
  // while we are calling /api/auth-status
  const [loadingStatus, setLoadingStatus] = useState(true);

  // 1) On page load, ask backend if Gmail is connected
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth-status");
        const data = await res.json();
        setIsConnected(data.gmailConnected);
        // if you later return email from backend, set it here
        // setUserEmail(data.email);
      } catch (err) {
        console.error("Failed to fetch auth status", err);
        setIsConnected(false);
      } finally {
        setLoadingStatus(false);
      }
    };

    checkStatus();
  }, []);

  // 2) If not connected, open Google OAuth window
  const handleConnectGmail = () => {
    window.open(
      "http://localhost:5000/auth/google",
      "_blank",
      "width=500,height=600"
    );
  };

  // 3) If already connected, go to dashboard (where you can sync/show emails)
  const handleStartAnalyzing = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
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

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Classification
            </h3>
            <p className="text-gray-600">
              AI categorizes your emails into Jobs, Events, Important, and
              Others automatically
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
              Automatically extracts job titles, companies, skills, and
              deadlines from job emails
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

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Get Started
          </h2>

          {loadingStatus ? (
            <p className="text-center text-gray-500">
              Checking Gmail connection…
            </p>
          ) : !isConnected ? (
            <div>
              <button
                onClick={handleConnectGmail}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-3 shadow-sm"
              >
                <Mail className="h-5 w-5" />
                <span>Connect Gmail Account</span>
              </button>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Grant permission to read and classify your emails
              </p>
            </div>
          ) : (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900">
                      Connected Successfully
                    </p>
                    <p className="text-sm text-green-700">
                      {userEmail || "Your Gmail account"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartAnalyzing}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Start Analyzing Emails
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Your data is secure and private. We only access emails for
            classification purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
