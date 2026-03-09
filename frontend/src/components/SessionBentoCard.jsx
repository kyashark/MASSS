import { useEffect, useState } from "react";
import { Loader2, Target } from "lucide-react";
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

  if (loading) return (
    <div className="w-full flex items-center justify-center p-5 bg-[#0f172a] rounded-[24px] min-h-[80px]">
      <Loader2 className="animate-spin text-slate-500" size={20} />
    </div>
  );

  return (
    <div className="w-full flex items-center justify-between p-5 rounded-[24px] text-[#e2e8f0]">
      
      <div>
        <p className="m-0 text-[16px] font-[700] font-mono text-[#64748b] uppercase tracking-[2px]">
          Recent Focus Sessions
        </p>
        
      </div>



    </div>
  );
};

export default SessionBentoCard;