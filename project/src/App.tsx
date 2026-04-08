import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Jobs from "./pages/Jobs";
import Events from "./pages/Events";
import Settings from "./pages/Settings";
import EmailDetails from "./pages/EmailDetails";
import JobEmailDetails from "./pages/JobEmailDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/events" element={<Events />} />
        <Route path="/settings" element={<Settings />} />

        {/* Normal inbox mail detail */}
        <Route path="/email/:id" element={<EmailDetails />} />

        {/* Jobs mail detail */}
        <Route path="/job-email/:id" element={<JobEmailDetails />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;