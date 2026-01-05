import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";

// Priority color mapping
const priorityConfig = {
  High: { text: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  Medium: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  Low: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const ModuleCard = ({ module, onClick, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const priority = module.priority || "Low";
  const colors = priorityConfig[priority] || priorityConfig.Low;

  return (
    <div
      onClick={onClick} // open module detail
      className="group bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer relative transition-all duration-200 hover:scale-[1.01]"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        {/* Priority label */}
        <div
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}
        >
          {priority}
        </div>

        {/* Menu button */}
        <div ref={menuRef} className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent card click
              setMenuOpen((prev) => !prev);
            }}
            className="text-gray-300 hover:text-gray-600 p-1"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(module);
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(module.id);
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Module Content */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1 leading-tight">
          {module.name}
        </h3>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          {module.tasks || 0} active tasks
        </p>
      </div>

      {/* Progress Footer */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tight">
          <span>Completion</span>
          <span className="text-gray-900">{module.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.text} opacity-70 transition-all duration-700 ease-in-out`}
            style={{ width: `${module.progress || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ModuleCard;
