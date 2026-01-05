// components/HeuristicView.jsx
import { useEffect, useState } from "react";
import { Sun, Sunset, Moon, Clock, Lock } from "lucide-react";
import { fetchHeuristicSchedule, fetchFixedRoutine } from "../api/scheduling";
// 1. Import the new fetch function
import { fetchTask } from "../api/tasks"; 
import TaskMeta from "../components/TaskMeta";

const HeuristicView = ({ refreshKey, onMenuAction, onStartSession }) => {
  const [schedule, setSchedule] = useState({ Morning: [], Afternoon: [], Evening: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const aiData = await fetchHeuristicSchedule();
        const routineData = await fetchFixedRoutine();
        const mergedSchedule = mergeRoutineWithSchedule(aiData, routineData);
        setSchedule(mergedSchedule);
      } catch (error) {
        console.error("Failed to load heuristic schedule", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [refreshKey]);

  // --- Helpers ---
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

      if (startHour >= 5 && startHour < 12) newSchedule.Morning.unshift(fixedTaskObj);
      else if (startHour >= 12 && startHour < 17) newSchedule.Afternoon.unshift(fixedTaskObj);
      else newSchedule.Evening.unshift(fixedTaskObj);
    });
    return newSchedule;
  };

  // --- 2. UPDATED CLICK HANDLER ---
  const handleTaskClick = async (clickedTask) => {
      try {
        // Fetch the "Real" task data from the database to get the full history (sessions_count)
        const fullTaskData = await fetchTask(clickedTask.task_id);
        
        // Merge the Schedule info (Time) with the Database info (History)
        const mergedTask = {
            ...clickedTask,          // Keeps the start_time/end_time from schedule
            ...fullTaskData,         // Overwrites with real sessions_count & estimated_pomodoros
            // Ensure ID match
            id: clickedTask.task_id 
        };

        // Pass null for overrides so it uses the real data we just fetched
        onStartSession(mergedTask, null);
      } catch (error) {
        console.error("Could not fetch full task details", error);
        // Fallback: Open with what we have if fetch fails
        onStartSession(clickedTask, null);
      }
  };

  // --- Rendering Helpers ---
  const getPeriodIcon = (period) => {
    switch (period) {
      case "Morning": return <Sun size={18} className="text-amber-500" />;
      case "Afternoon": return <Sunset size={18} className="text-orange-500" />;
      case "Evening": return <Moon size={18} className="text-indigo-500" />;
      default: return <Clock size={18} className="text-gray-400" />;
    }
  };

  const formatTime = (timeStr) => timeStr ? timeStr.slice(0, 5) : "";

  if (loading) {
    return <div className="h-full flex items-center justify-center text-slate-400 text-sm animate-pulse">Loading Heuristic Plan...</div>;
  }

  if (Object.values(schedule).every(arr => arr.length === 0)) {
     return <div className="text-center text-slate-400 text-sm mt-10 italic">Free day! No tasks.</div>;
  }

  return (
    <div className="space-y-4 pb-10">
      {["Morning", "Afternoon", "Evening"].map((period) => {
        const tasks = schedule[period] || [];
        if (tasks.length === 0) return null;

        return (
          <div key={period} className="border-l-2 border-slate-100 pl-4 py-1">
            <div className="flex items-center gap-2 mb-3">
              {getPeriodIcon(period)}
              <h3 className="text-sm font-semibold text-slate-600">{period}</h3>
              <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-slate-50 rounded-full">{tasks.length} Tasks</span>
            </div>
            <div className="space-y-3">
              {tasks.map((task, index) => {
                if (task.isFixed) {
                   return (
                     <div key={`fixed-${index}`} className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl shadow-sm flex flex-col justify-between">
                       <div className="flex justify-between items-start mb-1">
                         <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                           <Lock size={12} className="text-indigo-400" /> {task.task_name}
                         </h4>
                         <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-700 border border-indigo-300">ROUTINE</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs text-indigo-600 mt-1">
                         <Clock size={12} /> <span>{formatTime(task.start_time)} - {formatTime(task.end_time)}</span>
                       </div>
                     </div>
                   );
                }
                
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
                    onMenuAction={onMenuAction} 
                    // 3. Make sure we call the new async handler
                    onStartSession={() => handleTaskClick(mappedTask)} 
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HeuristicView;