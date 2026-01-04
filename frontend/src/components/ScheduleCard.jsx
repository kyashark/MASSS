// components/ScheduleCard.jsx
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
  Lock
} from "lucide-react";
import { fetchHeuristicSchedule, fetchRLSchedule, fetchFixedRoutine } from "../api/scheduling";

// --- 1. Import The Logic & Components ---
import TaskMeta from "../components/TaskMeta"; 
import TaskForm from "../components/TaskForm";
import PomoSession from "../components/PomoSession";
import { useTaskActions } from "../hooks/useTaskActions"; 

const ScheduleCard = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState("heuristic"); 
  const [schedule, setSchedule] = useState({ Morning: [], Afternoon: [], Evening: [] });
  const [loading, setLoading] = useState(false);
  
  // --- 2. Add State for Refreshing & Pomo Session ---
  const [refreshKey, setRefreshKey] = useState(0); 
  const [activeSessionTask, setActiveSessionTask] = useState(null);

  // NEW: Store calculated props for the session (for RL group tasks)
  const [sessionOverrides, setSessionOverrides] = useState(null);

  // --- 3. Initialize the Hook ---
  const { 
    isFormOpen, 
    editingTask, 
    handleMenuAction, 
    closeForm,
    handleFormSuccess
  } = useTaskActions(() => setRefreshKey(prev => prev + 1));

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let aiData = activeTab === "heuristic" 
          ? await fetchHeuristicSchedule() 
          : await fetchRLSchedule();

        const routineData = await fetchFixedRoutine();
        const mergedSchedule = mergeRoutineWithSchedule(aiData, routineData);
        setSchedule(mergedSchedule);

      } catch (error) {
        console.error("Failed to load schedule", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, refreshKey]);

  // ... (mergeRoutineWithSchedule, getPeriodIcon, formatTime helpers remain same) ...
  const mergeRoutineWithSchedule = (aiSchedule, fullRoutine) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = days[new Date().getDay()];
    const todayRoutine = fullRoutine.filter(item => item.day_of_week === todayName);

    const newSchedule = {
      Morning: [...(aiSchedule.Morning || [])],
      Afternoon: [...(aiSchedule.Afternoon || [])],
      Evening: [...(aiSchedule.Evening || [])]
    };

    todayRoutine.forEach(task => {
      const startHour = parseInt(task.start_time.split(":")[0], 10);
      const fixedTaskObj = {
        ...task,
        isFixed: true, 
        task_name: task.name,
        module: "Fixed Routine",
        priority: "FIXED"
      };

      if (startHour >= 5 && startHour < 12) {
        newSchedule.Morning.unshift(fixedTaskObj); 
      } else if (startHour >= 12 && startHour < 17) {
        newSchedule.Afternoon.unshift(fixedTaskObj);
      } else {
        newSchedule.Evening.unshift(fixedTaskObj);
      }
    });

    return newSchedule;
  };

  const getPeriodIcon = (period) => {
    switch (period) {
      case "Morning": return <Sun size={18} className="text-amber-500" />;
      case "Afternoon": return <Sunset size={18} className="text-orange-500" />;
      case "Evening": return <Moon size={18} className="text-indigo-500" />;
      default: return <Clock size={18} className="text-gray-400" />;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.slice(0, 5); 
  };

  // --- 4. NEW: Logic to handle opening a session for RL Tasks ---
  const handleStartSession = (clickedTask) => {
    // 1. Flatten the schedule to find siblings
    const allTasks = [...schedule.Morning, ...schedule.Afternoon, ...schedule.Evening];
    
    // 2. Find all instances of this task ID (this handles the RL list)
    // Note: clickedTask.id comes from TaskMeta mapping (which is task_id)
    const relatedTasks = allTasks.filter(t => t.task_id === clickedTask.id && !t.isFixed);

    // 3. If it's a multi-entry task group (RL style)
    if (relatedTasks.length > 1) {
       // Calculate how many are actually DONE
       const completedCount = relatedTasks.filter(t => t.status === "COMPLETED").length;
       const totalCount = relatedTasks.length;

       setSessionOverrides({
          initialSessionCount: completedCount, // If 1 is done, start at 1 (which makes current = 2)
          totalSessionOverride: totalCount
       });
    } else {
       // Normal single task
       setSessionOverrides(null);
    }

    setActiveSessionTask(clickedTask);
  };

  return (
    <div 
      className="w-full h-full flex flex-col relative"
      onClick={(e) => e.stopPropagation()} 
    >
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

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={(e) => { e.stopPropagation(); setActiveTab("heuristic"); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "heuristic" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Layers size={14} /> Heuristic
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveTab("rl"); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "rl" ? "bg-white text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <BrainCircuit size={14} /> AI Agent
          </button>
        </div>
      </div>

      <div 
        onClick={() => navigate && navigate("/user/scheduling")} 
        className="absolute top-0 right-0 p-2 cursor-pointer hover:bg-slate-50 rounded-full transition-colors"
      >
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
                <div className="flex items-center gap-2 mb-3">
                  {getPeriodIcon(period)}
                  <h3 className="text-sm font-semibold text-slate-600">{period}</h3>
                  <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-slate-50 rounded-full">
                    {tasks.length} Tasks
                  </span>
                </div>

                <div className="space-y-3">
                  {tasks.map((task, index) => {
                    // Fixed Routine Logic
                    if (task.isFixed) {
                      return (
                        <div key={`fixed-${index}`} className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                              <Lock size={12} className="text-indigo-400" />
                              {task.task_name}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-700 border border-indigo-300">ROUTINE</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-indigo-600 mt-1">
                            <Clock size={12} />
                            <span>{formatTime(task.start_time)} - {formatTime(task.end_time)}</span>
                          </div>
                        </div>
                      );
                    }

                    // --- STANDARD AI TASK RENDERING ---
                    const mappedTask = {
                        ...task,
                        id: task.task_id, 
                        name: task.task_name,
                        estimated_pomodoros: task.assigned_sessions
                    };

                    return (
                      <TaskMeta 
                        key={`task-${task.task_id}-${index}`} 
                        task={mappedTask}
                        onMenuAction={handleMenuAction}
                        // UPDATED: Now calls handleStartSession to calculate group logic
                        onStartSession={(t) => handleStartSession(t)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
        
        {!loading && Object.values(schedule).every(arr => arr.length === 0) && (
             <div className="text-center text-slate-400 text-sm mt-10 italic">Free day! No tasks.</div>
        )}
      </div>

      {/* --- RENDER THE ACTION MODALS --- */}
      <div onClick={(e) => e.stopPropagation()}>
        <TaskForm 
          isOpen={isFormOpen}
          onClose={closeForm}
          onTaskCreated={handleFormSuccess}
          taskToEdit={editingTask} 
        />

        {activeSessionTask && (
          <PomoSession 
            task={activeSessionTask} 
            // Pass the calculated overrides here
            initialSessionCount={sessionOverrides?.initialSessionCount}
            totalSessionOverride={sessionOverrides?.totalSessionOverride}
            onClose={() => { setActiveSessionTask(null); setSessionOverrides(null); }}
            onComplete={() => setRefreshKey(prev => prev + 1)}
            onUpdateTask={() => setRefreshKey(prev => prev + 1)}
          />
        )}
      </div>

    </div>
  );
};

export default ScheduleCard;