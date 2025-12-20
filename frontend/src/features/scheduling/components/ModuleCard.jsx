import React from "react";
import { 
  MoreHorizontal, 
} from "lucide-react";



const ModuleCard = ({ module, onClick, onEdit }) => {

  const lightColorClass = module.color ? `${module.color} opacity-20` : 'bg-gray-100';
  const solidColorClass = module.color || 'bg-gray-900';

  return (
    <div 
      onClick={onClick}
      className="group bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
    >
      {/* --- A. Header (Icon & Action) --- */}
      <div className="flex justify-between items-start mb-4">
        {/* Minimalist Aesthetic Icon Box */}
<div className={`w-8 h-8 rounded-lg ${lightColorClass} transition-transform duration-300 group-hover:scale-110`} >     
        </div>

        {/* Subtle Menu Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit(module);
          }}
          className="text-gray-300 hover:text-gray-900 transition-colors p-1"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* --- B. Content --- */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1 leading-tight">
          {module.name}
        </h3>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
           {module.tasks || 0} active tasks
        </p>
      </div>

      {/* --- C. Progress Footer (Light & Modern) --- */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tight">
          <span>Completion</span>
          <span className="text-gray-900">{module.progress || 0}%</span>
        </div>
        
        {/* Ultra-thin Progress Bar */}
        <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gray-900 transition-all duration-700 ease-in-out" 
            style={{ width: `${module.progress || 0}%` }} 
          />
        </div>
      </div>
    </div>
  );
};

export default ModuleCard;