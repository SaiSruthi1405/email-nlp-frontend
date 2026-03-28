import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Briefcase, Calendar, ExternalLink } from "lucide-react";
import Navbar from "../components/Navbar";
import { ClassifiedEmail } from "../types";

export default function Jobs() {
  const navigate = useNavigate();

  const [jobEmails, setJobEmails] = useState<ClassifiedEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const [companyFilter, setCompanyFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/emails");
        if (!res.ok) throw new Error("Failed to load emails");
        const data: ClassifiedEmail[] = await res.json();
        setJobEmails(data.filter((email) => email.category === "job"));
      } catch (err) {
        console.error("Failed to load job emails", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const companies = [
    ...new Set(jobEmails.map((email) => email.company).filter(Boolean)),
  ];
  const locations = [
    ...new Set(jobEmails.map((email) => email.location).filter(Boolean)),
  ];

  const filteredJobs = jobEmails.filter((job) => {
    if (companyFilter && job.company !== companyFilter) return false;
    if (locationFilter && job.location !== locationFilter) return false;
    if (
      skillFilter &&
      !job.skills?.some((skill) =>
        skill.toLowerCase().includes(skillFilter.toLowerCase())
      )
    )
      return false;
    return true;
  });

  const formatDeadline = (deadline?: string | null) => {
    if (!deadline) return "No deadline";
    const date = new Date(deadline);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `${diffDays} days left`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleViewDetails = (jobId: string) => {
    navigate(`/email/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Job Opportunities</h1>
          <p className="text-gray-600 mt-1">
            {filteredJobs.length} job
            {filteredJobs.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Companies</option>
                {companies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <input
                type="text"
                placeholder="Search skills..."
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {(companyFilter || locationFilter || skillFilter) && (
            <button
              onClick={() => {
                setCompanyFilter("");
                setLocationFilter("");
                setSkillFilter("");
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {job.job_title || job.raw_email?.subject || "Job Opportunity"}
                  </h3>

                  <div className="flex flex-wrap gap-4 mb-4">
                    {job.company && (
                      <div className="flex items-center text-gray-600">
                        <Briefcase className="h-4 w-4 mr-2" />
                        <span className="text-sm">{job.company}</span>
                      </div>
                    )}

                    {job.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">{job.location}</span>
                      </div>
                    )}

                    {job.application_deadline && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {formatDeadline(job.application_deadline)}
                        </span>
                      </div>
                    )}
                  </div>

                  {job.experience_level && (
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Experience:</span>{" "}
                      {job.experience_level}
                    </p>
                  )}

                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleViewDetails(job.id)}
                  className="ml-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>View Details</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredJobs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">
                No jobs found matching your filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
