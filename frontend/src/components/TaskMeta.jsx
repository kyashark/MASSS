// components/TaskMeta.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  // CheckCircle and XCircle removed
} from "lucide-react";

const TaskMeta = ({ task, onMenuAction, onStartSession }) => {
  // Removed onToggle from props since it's no longer used here
  const { title, name, priority, completed, estimated_pomodoros } = task;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const taskLabel = title || name || "Untitled Task";
  const p = priority ? priority.toUpperCase() : "LOW";

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

    // Removed the "toggle_complete" logic block

    // Pass the WHOLE 'task' object
    if (onMenuAction) onMenuAction(task, action);
  };

  return (
    <div
      className={`group w-full flex items-center justify-between p-4 bg-white border rounded-xl
      transition-shadow transition-colors duration-200 relative
      ${menuOpen ? "z-50" : "z-0"} 
      ${
        completed
          ? "border-slate-100 opacity-60 bg-slate-50/50"
          : "border-slate-200 hover:border-blue-200 hover:shadow-md hover:bg-blue-50/40"
      }`}
    >
      {/* --- LEFT SIDE: Name & Priority --- */}
      <div className="flex flex-col items-start gap-1.5">
        <span
          className={`text-sm font-semibold tracking-tight transition-all ${
            completed ? "line-through text-slate-400" : "text-slate-800"
          }`}
        >
          {taskLabel}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border tracking-wide uppercase text-slate-500 bg-slate-100 border-slate-200">
            {p}
          </span>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 ml-1">
              Sessions {estimated_pomodoros}
            </span>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: Actions --- */}
      <div className="flex items-center gap-3">
        {!completed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onStartSession) onStartSession(task);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg 
                        hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all transform active:scale-95"
            title="Start Focus Session"
          >
            <Play size={12} fill="currentColor" />
            Start Focus
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={toggleMenu}
            className={`p-1.5 rounded-lg transition-colors ${
              menuOpen
                ? "bg-slate-200 text-slate-900"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="flex flex-col py-1">
                <button
                  onClick={(e) => handleAction("edit", e)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 w-full text-left"
                >
                  <Edit size={14} /> Edit Task
                </button>

                <button
                  onClick={(e) => handleAction("assign_exam", e)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 w-full text-left"
                >
                  <FileText size={14} /> Assign Exam
                </button>

                {/* REMOVED: "Mark as Complete" Button Logic */}

                <div className="h-px bg-slate-100 my-1"></div>

                <button
                  onClick={(e) => handleAction("delete", e)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 w-full text-left"
                >
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