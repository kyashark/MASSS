import { useEffect, useState } from "react";
import { fetchRLSchedule } from "../api/scheduling"; // Ensure this path is correct
import { Loader2 } from "lucide-react";

const ModuleBentoCard = () => {
  const [focusModule, setFocusModule] = useState("No Focus");
  const [otherModules, setOtherModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const schedule = await fetchRLSchedule();
        processSchedule(schedule);
      } catch (error) {
        console.error("Failed to load module focus", error);
        setFocusModule("Error Loading");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- LOGIC: Determine Focus based on Time ---
  const processSchedule = (schedule) => {
    const hour = new Date().getHours();
    let currentPeriod = "Morning";
    let nextPeriods = ["Afternoon", "Evening"];

    if (hour >= 12 && hour < 17) {
      currentPeriod = "Afternoon";
      nextPeriods = ["Evening"];
    } else if (hour >= 17) {
      currentPeriod = "Evening";
      nextPeriods = [];
    }

    // 1. Find Current Focus
    // We look at the current period first. If empty, look ahead.
    const allTasks = [
      ...(schedule[currentPeriod] || []),
      ...(schedule[nextPeriods[0]] || []),
      ...(schedule[nextPeriods[1]] || []) // safely handle undefined
    ];

    if (allTasks.length > 0) {
      // The first task in the queue is the "Current Focus"
      setFocusModule(allTasks[0].module);

      // 2. Find "Up Next" Modules
      // We want unique module names from the REST of the list
      const uniqueNext = [
        ...new Set(
          allTasks
            .slice(1) // Skip the first one (current focus)
            .map(t => t.module) // Extract names
        )
      ].slice(0, 2); // Limit to top 2

      setOtherModules(uniqueNext);
    } else {
      setFocusModule("Free Time");
      setOtherModules([]);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Header - (Hidden in your original snippet but keeping structure) */}

      {/* Today's Focus - Highlighted section */}
      <div
        className="rounded-2xl px-5 py-4 mb-6 shadow-sm"
        style={{ backgroundColor: '#e9fa9c' }}
      >
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
          Current Focus
        </p>
        <p className="text-2xl font-bold text-gray-900 truncate" title={focusModule}>
          {focusModule}
        </p>
      </div>

      {/* Up Next - Minimal list */}
      <div className="flex flex-col">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Up Next
        </p>
        
        {otherModules.length > 0 ? (
          <div className="space-y-3">
            {otherModules.map((mod, index) => (
              <div
                key={index}
                className="px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
              >
                <span className="text-sm font-medium text-gray-800 line-clamp-1">
                  {mod}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-3 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center">
            <span className="text-sm text-gray-400">Nothing scheduled</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleBentoCard;