import React from "react";
import { MoreHorizontal } from "lucide-react";

// Aesthetic priority color mapping (minimalist & modern palette)
const priorityConfig = {
  High: {
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  Medium: {
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  Low: {
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
};

const ModuleCard = ({ module, onClick, onEdit }) => {
  const priority = module.priority || "Low"; // Default to Low if not set
  const colors = priorityConfig[priority] || priorityConfig.Low;

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
    >
      {/* --- Header: Priority Label + Menu --- */}
      <div className="flex justify-between items-start mb-4">
        {/* Priority Label - Minimalist Pill */}
        <div
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}
        >
          {priority}
        </div>

        {/* Subtle Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit(module);
          }}
          className="text-gray-300 hover:text-gray-600 transition-colors p-1"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* --- Content --- */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1 leading-tight">
          {module.name}
        </h3>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          {module.tasks || 0} active tasks
        </p>
      </div>

      {/* --- Progress Footer --- */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tight">
          <span>Completion</span>
          <span className="text-gray-900">{module.progress || 0}%</span>
        </div>

        {/* Thin Progress Bar - Now uses priority color subtly */}
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