import { useEffect, useState } from "react";
import { 
  Calendar, 
  ArrowUpRight, 
  Layers, 
  BrainCircuit, 
  Sun, 
  Sunset, 
  Moon, 
  Clock,
  Lock, // Icon for fixed tasks
  Briefcase
} from "lucide-react";
import { fetchHeuristicSchedule, fetchRLSchedule, fetchFixedRoutine } from "../api/scheduling";

const ScheduleCard = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState("heuristic"); 
  const [schedule, setSchedule] = useState({ Morning: [], Afternoon: [], Evening: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch the AI Schedule (Heuristic or RL)
        let aiData = activeTab === "heuristic" 
          ? await fetchHeuristicSchedule() 
          : await fetchRLSchedule();

        // 2. Fetch the Fixed Routine
        const routineData = await fetchFixedRoutine();

        // 3. Process & Merge Data
        const mergedSchedule = mergeRoutineWithSchedule(aiData, routineData);
        setSchedule(mergedSchedule);

      } catch (error) {
        console.error("Failed to load schedule", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  // --- LOGIC: Filter Today's Routine & Place in Slots ---
  const mergeRoutineWithSchedule = (aiSchedule, fullRoutine) => {
    // 1. Get Today's Day Name (e.g., "Monday")
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = days[new Date().getDay()];

    // 2. Filter Routine for Today
    const todayRoutine = fullRoutine.filter(item => item.day_of_week === todayName);

    // 3. Create a deep copy of the AI schedule to avoid mutation issues
    const newSchedule = {
      Morning: [...(aiSchedule.Morning || [])],
      Afternoon: [...(aiSchedule.Afternoon || [])],
      Evening: [...(aiSchedule.Evening || [])]
    };

    // 4. Inject Fixed Tasks into correct buckets
    todayRoutine.forEach(task => {
      // Parse hour (e.g., "09:00:00" -> 9)
      const startHour = parseInt(task.start_time.split(":")[0], 10);
      
      // Create a standardized task object
      const fixedTaskObj = {
        ...task,
        isFixed: true, // Flag to identify for styling
        task_name: task.name,
        module: "Fixed Routine",
        priority: "FIXED"
      };

      // Slot Logic
      if (startHour >= 5 && startHour < 12) {
        newSchedule.Morning.unshift(fixedTaskObj); // Add to top of list
      } else if (startHour >= 12 && startHour < 17) {
        newSchedule.Afternoon.unshift(fixedTaskObj);
      } else {
        newSchedule.Evening.unshift(fixedTaskObj);
      }
    });

    return newSchedule;
  };

  // Helper: Period Icons
  const getPeriodIcon = (period) => {
    switch (period) {
      case "Morning": return <Sun size={18} className="text-amber-500" />;
      case "Afternoon": return <Sunset size={18} className="text-orange-500" />;
      case "Evening": return <Moon size={18} className="text-indigo-500" />;
      default: return <Clock size={18} className="text-gray-400" />;
    }
  };

  // Helper: Format Time (09:00:00 -> 09:00)
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.slice(0, 5); 
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Calendar size={20} className="text-slate-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Today's Plan</h2>
            <p className="text-xs text-slate-500">Auto-generated Schedule</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={(e) => { e.stopPropagation(); setActiveTab("heuristic"); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "heuristic" 
                ? "bg-white text-slate-800 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Layers size={14} /> Heuristic
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveTab("rl"); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "rl" 
                ? "bg-white text-violet-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <BrainCircuit size={14} /> AI Agent
          </button>
        </div>
      </div>

      <div onClick={() => navigate && navigate("/user/scheduling")} className="absolute top-0 right-0 p-2 cursor-pointer hover:bg-slate-50 rounded-full transition-colors">
        <ArrowUpRight size={24} className="text-slate-400" />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm animate-pulse">
            Generating Schedule...
          </div>
        ) : (
          ["Morning", "Afternoon", "Evening"].map((period) => {
            const tasks = schedule[period] || [];
            if (tasks.length === 0) return null;

            return (
              <div key={period} className="border-l-2 border-slate-100 pl-4 py-1">
                {/* Period Label */}
                <div className="flex items-center gap-2 mb-3">
                  {getPeriodIcon(period)}
                  <h3 className="text-sm font-semibold text-slate-600">{period}</h3>
                  <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-slate-50 rounded-full">
                    {tasks.length} Tasks
                  </span>
                </div>

                {/* Task List */}
                <div className="space-y-3">
                  {tasks.map((task, index) => {
                    // --- CONDITIONAL RENDERING ---
                    // Check if it is a Fixed Routine Task
                    if (task.isFixed) {
                      return (
                        <div 
                          key={`fixed-${index}`} 
                          className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl shadow-sm flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                              <Lock size={12} className="text-indigo-400" />
                              {task.task_name}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-700 border border-indigo-300">
                              ROUTINE
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-indigo-600 mt-1">
                            <Clock size={12} />
                            <span>{formatTime(task.start_time)} - {formatTime(task.end_time)}</span>
                          </div>
                        </div>
                      );
                    }

                    // --- STANDARD AI TASK RENDERING ---
                    return (
                      <div 
                        key={`task-${task.task_id}-${index}`} 
                        className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-200 p-3 rounded-xl transition-all shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-semibold text-slate-800 line-clamp-1" title={task.task_name}>
                            {task.task_name}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            task.priority === "HIGH" ? "bg-red-50 text-red-700 border-red-100" :
                            task.priority === "MEDIUM" ? "bg-yellow-50 text-yellow-700 border-yellow-100" :
                            "bg-green-50 text-green-700 border-green-100"
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500 truncate max-w-[60%] flex items-center gap-1">
                            <Briefcase size={10} />
                            {task.module}
                          </p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(task.assigned_sessions, 5) }).map((_, i) => (
                              <div key={i} className="w-1.5 h-3 bg-blue-400 rounded-sm"></div>
                            ))}
                            {task.assigned_sessions > 5 && <span className="text-[10px] text-gray-400">+</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
        
        {!loading && Object.values(schedule).every(arr => arr.length === 0) && (
             <div className="text-center text-slate-400 text-sm mt-10 italic">
                Free day! No tasks.
             </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleCard;