// components/ScheduleCard.jsx
import { useState } from "react";
import { 
  Calendar, 
  ArrowUpRight, 
  Layers, 
  BrainCircuit
} from "lucide-react";

// --- Import Components ---
import TaskForm from "../components/TaskForm";
import PomoSession from "../components/PomoSession";
import { useTaskActions } from "../hooks/useTaskActions";

// --- Import The New Separate Views ---
import HeuristicView from "./HeuristicView";
import RLAgentView from "./RLAgentView";

const ScheduleCard = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState("heuristic"); 
  
  // State for Refreshing & Pomo Session
  const [refreshKey, setRefreshKey] = useState(0); 
  const [activeSessionTask, setActiveSessionTask] = useState(null);
  const [sessionOverrides, setSessionOverrides] = useState(null);

  // --- Initialize the Hook ---
  // The hook handles Form actions (Edit/Delete/Add)
  const { 
    isFormOpen, 
    editingTask, 
    handleMenuAction, 
    closeForm,
    handleFormSuccess
  } = useTaskActions(() => setRefreshKey(prev => prev + 1));

  // This function is passed down to children. 
  // When a child (RL or Heuristic) task is clicked, they pass the data back up here.
  const onStartSession = (clickedTask, overrides) => {
    setActiveSessionTask(clickedTask);
    setSessionOverrides(overrides);
  };

  return (
    <div 
      className="w-full h-full flex flex-col relative"
      onClick={(e) => e.stopPropagation()} 
    >
      {/* --- Header & Tabs --- */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            {/* <Calendar size={20} className="text-slate-700" /> */}
          </div>
          <div>
            <h2 className="text-[23px] font-[800] font-mono tracking-[-0.02em] text-[#0f172a] mt-1">Today Plan</h2>
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

      {/* --- Content Area: Swaps file based on Tab --- */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === "heuristic" ? (
          <HeuristicView 
             refreshKey={refreshKey}
             onMenuAction={handleMenuAction}
             onStartSession={onStartSession}
          />
        ) : (
          <RLAgentView 
             refreshKey={refreshKey}
             onMenuAction={handleMenuAction}
             onStartSession={onStartSession}
          />
        )}
      </div>

      {/* --- Global Action Modals (Form & Timer) --- */}
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