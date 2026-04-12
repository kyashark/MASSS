import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Clock,
  RotateCcw,
  History 
} from "lucide-react";

const TaskMeta = ({ task, onMenuAction, onStartSession }) => {
  const { 
    title, 
    name, 
    priority, 
    completed, 
    estimated_pomodoros, 
    status,
    actual_pomodoros, // We grab this, but we also check other names below
    sessions_count    // Sometimes backends send this name instead
  } = task;

  // --- TINY FIX HERE ---
  // We check 'actual_pomodoros' OR 'sessions_count'. If both missing, use 0.
  const currentSessions = actual_pomodoros || sessions_count || 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const taskLabel = title || name || "Untitled Task";
  const p = priority || "low";
  
  // --- STATE LOGIC ---
 const isStrictlyActive = status === "in_progress"; 

 const isComplete       = status === "completed";      // ← lowercase

  // Check 'currentSessions' instead of 'actual_pomodoros'
  const isResumable = !isStrictlyActive && !completed && currentSessions > 0;
  
  const isStarted = isStrictlyActive || isResumable;

  const toggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action, e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (onMenuAction) onMenuAction(task, action);
  };

  // --- STYLING ---
  let containerClasses = "bg-white border-slate-200 hover:border-blue-200 hover:shadow-md hover:bg-blue-50/40";
  
  if (completed) {
    containerClasses = "border-slate-100 opacity-60 bg-slate-50/50";
  } else if (isStrictlyActive) {
    containerClasses = "bg-blue-50/30 border-blue-400 shadow-sm"; 
  } else if (isResumable) {
    containerClasses = "bg-white border-slate-300 border-l-4 border-l-slate-400"; 
  }

  return (
    <div
      className={`group w-full flex items-center justify-between p-4 border rounded-xl
      transition-all duration-200 relative
      ${menuOpen ? "z-50" : "z-0"} 
      ${containerClasses}`}
    >
      {/* LEFT: Info */}
      <div className="flex flex-col items-start gap-1.5">
        <span className={`text-sm font-semibold tracking-tight ${completed ? "line-through text-slate-400" : "text-slate-800"}`}>
          {taskLabel}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border tracking-wide uppercase text-slate-500 bg-slate-100 border-slate-200">
            {p.replace("_", " ")}
          </span>

          {/* ACTIVE Badge */}
          {isStrictlyActive && (
           <span className="
  flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border
  tracking-wide uppercase
  text-blue-600 bg-blue-100 border-blue-200
  !animate-none
">
              <Clock size={10} />
              In Progress
            </span>
          )}

          {/* RESUMABLE Badge */}
          {isResumable && (
            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border tracking-wide uppercase text-slate-600 bg-slate-100 border-slate-200">
              <History size={10} />
              {currentSessions} Done
            </span>
          )}
          
          <div className="flex items-center gap-1">
             {/* --- UPDATED DISPLAY HERE --- */}
             <span className="text-[10px] text-slate-400 ml-1">
                Sessions {estimated_pomodoros}
             </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-3">
        {!completed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onStartSession) onStartSession(task);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-lg 
                        transition-all transform active:scale-95 shadow-sm
                        ${isStarted 
                            ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30" 
                            : "bg-slate-900 hover:bg-slate-800 hover:shadow-lg"
                        }`}
            title={isStarted ? "Resume Session" : "Start Focus Session"}
          >
            {isStarted ? <RotateCcw size={12} /> : <Play size={12} fill="currentColor" />}
            {isStarted ? "Resume" : "Start Focus"}
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button onClick={toggleMenu} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <MoreHorizontal size={18} />
          </button>
          
          {menuOpen && (
             <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="flex flex-col py-1">
                  <button onClick={(e) => handleAction("edit", e)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 w-full text-left">
                    <Edit size={14} /> Edit Task
                  </button>
                  <button onClick={(e) => handleAction("assign_exam", e)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 w-full text-left">
                    <FileText size={14} /> Assign Exam
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button onClick={(e) => handleAction("delete", e)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 w-full text-left">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskMeta;