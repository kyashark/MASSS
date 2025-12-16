import React from "react";
import { 
  MoreHorizontal, 
  Terminal, 
  Calculator, 
  BookOpen, 
  Palette, 
  Brain, 
  Layout 
} from "lucide-react";

// 1. Icon Mapping Logic (Connects DB "type" to UI Icon)
const ICON_MAP = {
  coding: Terminal,
  math: Calculator,
  language: BookOpen,
  creative: Palette,
  memorization: Brain,
  default: Layout
};

const ModuleCard = ({ module, onClick, onEdit }) => {
  // Select the correct icon, fallback to default if missing
  const IconComponent = ICON_MAP[module.type] || ICON_MAP.default;

  return (
    <div 
      onClick={onClick}
      className="group relative bg-white border border-gray-100 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden"
    >
      {/* --- A. Left Color Stripe --- */}
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${module.color} transition-all duration-300 group-hover:w-3`} />

      {/* --- B. Header (Icon & Menu) --- */}
      <div className="flex justify-between items-start mb-5 pl-2">
        {/* Icon Box */}
        <div className={`w-12 h-12 rounded-2xl ${module.color.replace('bg-', 'bg-opacity-10 bg-')} flex items-center justify-center transition-transform group-hover:rotate-6`}>
           <IconComponent 
              size={24} 
              className={`text-${module.color.replace('bg-', '')}-600`} // Tries to match text color to bg color
              style={{ color: 'inherit' }} // Fallback if tailwind class fails
           />
        </div>

        {/* Menu Button (Stop Propagation to prevent opening card) */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit(module);
          }}
          className="text-gray-300 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* --- C. Content --- */}
      <div className="pl-2 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{module.name}</h3>
        <p className="text-sm font-medium text-gray-500">
           {module.tasks || 0} active tasks
        </p>
      </div>

      {/* --- D. Progress Footer --- */}
      <div className="pl-2">
        <div className="flex justify-between text-xs font-bold mb-2 text-gray-400 group-hover:text-gray-600 transition-colors">
          <span>Progress</span>
          <span>{module.progress || 0}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full ${module.color} transition-all duration-1000 ease-out`} 
            style={{ width: `${module.progress || 0}%` }} 
          />
        </div>
      </div>

    </div>
  );
};

export default ModuleCard;