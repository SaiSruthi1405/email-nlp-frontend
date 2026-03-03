import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    localStorage.setItem("user", email);

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-2xl border border-gray-200 p-8 w-full max-w-md">

        <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="flex items-center border rounded-lg mt-1 px-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <input
                type="email"
                className="w-full p-3 outline-none"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="flex items-center border rounded-lg mt-1 px-3">
              <Lock className="h-5 w-5 text-gray-400" />
              <input
                type="password"
                className="w-full p-3 outline-none"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>

        </form>

        <p className="text-center text-sm text-gray-600 mt-5">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 font-semibold">
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
}