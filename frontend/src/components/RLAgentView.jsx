// components/RLAgentView.jsx
import { useEffect, useState } from "react";
import { Sun, Sunset, Moon, Clock, Lock, BrainCircuit } from "lucide-react";
import { fetchRLSchedule, fetchFixedRoutine } from "../api/scheduling";
import TaskMeta from "../components/TaskMeta";

const RLAgentView = ({ refreshKey, onMenuAction, onStartSession }) => {
  const [schedule, setSchedule] = useState({ Morning: [], Afternoon: [], Evening: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Specific API Call for RL
        const aiData = await fetchRLSchedule();
        const routineData = await fetchFixedRoutine();
        const mergedSchedule = mergeRoutineWithSchedule(aiData, routineData);
        setSchedule(mergedSchedule);
      } catch (error) {
        console.error("Failed to load RL schedule", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [refreshKey]);

  // --- Independent Logic (Can be customized for RL later) ---
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

  const handleTaskClick = (clickedTask) => {
     // Logic to find grouped tasks specifically within the RL list
     const allTasks = [...schedule.Morning, ...schedule.Afternoon, ...schedule.Evening];
     const relatedTasks = allTasks.filter(t => t.task_id === clickedTask.id && !t.isFixed);
     
     let overrides = null;
     if (relatedTasks.length > 1) {
        const completedCount = relatedTasks.filter(t => t.status === "COMPLETED").length;
        overrides = {
          initialSessionCount: completedCount,
          totalSessionOverride: relatedTasks.length
        };
     }
     onStartSession(clickedTask, overrides);
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

  // --- Main Render ---
  if (loading) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-violet-500 text-sm animate-pulse">
            <BrainCircuit size={24} className="mb-2" />
            <span>Consulting AI Agent...</span>
        </div>
    );
  }

  if (Object.values(schedule).every(arr => arr.length === 0)) {
     return <div className="text-center text-slate-400 text-sm mt-10 italic">Agent has no tasks for today.</div>;
  }

  return (
    <div className="space-y-4 pb-10">
      {/* You can add specific RL headers or analytics here later without breaking Heuristic view */}
      {["Morning", "Afternoon", "Evening"].map((period) => {
        const tasks = schedule[period] || [];
        if (tasks.length === 0) return null;

        return (
          <div key={period} className="border-l-2 border-violet-100 pl-4 py-1">
            <div className="flex items-center gap-2 mb-3">
              {getPeriodIcon(period)}
              <h3 className="text-sm font-semibold text-slate-600">{period}</h3>
              <span className="text-xs text-violet-500 font-medium px-2 py-0.5 bg-violet-50 rounded-full">{tasks.length}</span>
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
                
                const mappedTask = { ...task, id: task.task_id, name: task.task_name, estimated_pomodoros: task.assigned_sessions };
                return (
                  <TaskMeta 
                    key={`task-${task.task_id}-${index}`} 
                    task={mappedTask} 
                    onMenuAction={onMenuAction} 
                    onStartSession={(t) => handleTaskClick(t)} 
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

export default RLAgentView;