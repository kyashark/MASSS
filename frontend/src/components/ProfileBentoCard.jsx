import { useEffect, useState } from "react";
import { Battery, Zap, AlertCircle, Loader2, Clock } from "lucide-react";
import { fetchDashboardStats } from "../api/stats"; 

const ProfileCard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Helper: Get Color for Stress Status (Dark Mode) ---
  const getStatusColor = (status) => {
    switch (status) {
      case "FRESH": return "text-emerald-300 bg-emerald-500/20 border-emerald-500/30";
      case "TIRED": return "text-amber-300 bg-amber-500/20 border-amber-500/30";
      case "STRESSED": return "text-rose-300 bg-rose-500/20 border-rose-500/30";
      default: return "text-slate-300 bg-slate-500/20 border-slate-500/30";
    }
  };

  // --- Helper: Get Color for Battery Bar ---
  const getBatteryColor = (level) => {
    if (level > 70) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
    if (level > 40) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
    return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!stats) return <div className="text-slate-500 text-sm">Unavailable</div>;

  return (
    <div className="w-full flex flex-col gap-6 p-4">
      
      {/* --- TOP ROW: STATUS & PERIOD --- */}
      <div className="flex items-start justify-between">
        
        {/* Status Badge */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Cognitive State
          </p>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(stats.status)}`}>
            {stats.status === "STRESSED" ? <AlertCircle size={15} /> : <Zap size={15} />}
            <span className="text-sm font-bold tracking-wide">{stats.status}</span>
          </div>
        </div>

        {/* Time Period */}
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Period
          </p>
          <div className="flex items-center justify-end gap-2 text-slate-200">
            <span className="text-lg font-medium">{stats.period}</span>
            <Clock size={16} className="text-slate-400" />
          </div>
        </div>

      </div>

      {/* --- BOTTOM ROW: ENERGY BATTERY --- */}
      <div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <Battery size={16} className="text-slate-400" /> 
            Energy Level
          </span>
          <span className="text-lg font-bold text-white font-mono">
            {stats.battery_level}%
          </span>
        </div>
        
        {/* Dark Progress Bar Track */}
        <div className="w-full h-2.5 bg-slate-700/50 rounded-full overflow-hidden border border-slate-700">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${getBatteryColor(stats.battery_level)}`} 
            style={{ width: `${stats.battery_level}%` }}
          />
        </div>
      </div>

    </div>
  );
};

export default ProfileCard;