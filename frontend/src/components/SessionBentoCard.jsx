import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { fetchDashboardStats } from "../api/stats";

const SessionBentoCard = () => {
  const [recentFocus, setRecentFocus] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchDashboardStats();
        setRecentFocus(data?.recent_avg_focus ?? 0);
      } catch (error) {
        console.error("Failed to load session stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold tracking-widest text-slate-400 uppercase">
        Recent Focus
      </p>

      {loading ? (
        <div className="h-10 w-28 rounded-md bg-slate-800 animate-pulse" />
      ) : (
        <div className="flex items-center gap-3">
         
          <span className="text-4xl font-bold text-white">
            {recentFocus.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
};

export default SessionBentoCard;
