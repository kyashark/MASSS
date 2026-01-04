import React, { useEffect, useState } from "react";
// Adjust the path below to match where your api file is located
import { getRecentSessions } from "../../api/sessions"; 

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch last 20 sessions by default
        const data = await getRecentSessions(0, 20);
        setSessions(data);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
        setError("Could not load session history.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- Helpers for Formatting ---

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (type) => {
    const styles = {
      COMPLETED: "bg-green-100 text-green-800 border-green-200",
      STOPPED: "bg-yellow-100 text-yellow-800 border-yellow-200",
      ABORTED: "bg-red-100 text-red-800 border-red-200",
      SKIPPED: "bg-gray-100 text-gray-600 border-gray-200",
    };
    
    const style = styles[type] || "bg-gray-100 text-gray-800";

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
        {type}
      </span>
    );
  };

  const renderStars = (rating) => {
    if (!rating) return <span className="text-gray-300">-</span>;
    return (
      <div className="flex text-yellow-400">
        {[...Array(rating)].map((_, i) => (
          <span key={i}>★</span>
        ))}
      </div>
    );
  };

  // --- Render ---

  if (loading) return <div className="p-6 text-gray-500">Loading history...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Session History</h2>
        <button 
          onClick={() => window.location.reload()} 
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No sessions recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Focus
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  {/* 1. Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(session.start_time)}
                  </td>

                  {/* 2. Task ID (Ideally fetched with Title later) */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{session.task_id}
                  </td>

                  {/* 3. Status Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(session.end_type)}
                  </td>

                  {/* 4. Duration */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {session.duration_minutes} min
                  </td>

                  {/* 5. Star Rating */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {renderStars(session.focus_rating)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Sessions;