import React, { useState } from "react";
import { ArrowLeft, BookOpen, Brain, ListTodo, Plus } from "lucide-react";

const ModuleDetailPage = ({ module, onBack }) => {
  const [activeTab, setActiveTab] = useState("tasks");

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* --- HEADER (Uses Module Color) --- */}
      <div className={`w-full ${module.color || 'bg-blue-500'} text-white px-8 py-6 shadow-sm flex flex-col gap-4`}>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Modules</span>
        </button>

        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                {module.type || "General"}
              </span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                 Level {module.difficulty || 3}/5
              </span>
            </div>
            <h1 className="text-4xl font-bold">{module.name}</h1>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-8 text-white/90">
             <div className="text-center">
                <div className="text-2xl font-bold">12</div>
                <div className="text-xs opacity-70">Tasks</div>
             </div>
             <div className="text-center">
                <div className="text-2xl font-bold">85%</div>
                <div className="text-xs opacity-70">Focus</div>
             </div>
          </div>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex items-center px-8 border-b border-gray-200">
         {[
            { id: "tasks", label: "Study Tasks", icon: ListTodo },
            { id: "ai-plan", label: "AI Syllabus", icon: Brain },
            { id: "resources", label: "Notes & Docs", icon: BookOpen },
         ].map((tab) => (
            <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`
                  flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-medium text-sm
                  ${activeTab === tab.id 
                     ? `border-${module.color?.replace('bg-', '') || 'blue-500'} text-gray-900` 
                     : "border-transparent text-gray-500 hover:text-gray-700"}
               `}
            >
               <tab.icon size={18} />
               {tab.label}
            </button>
         ))}
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
        
        {activeTab === "tasks" && (
           <div className="text-center py-20">
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-300 inline-flex flex-col items-center">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <ListTodo size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">No Tasks Yet</h3>
                 <p className="text-gray-500 mb-6 max-w-xs">Start by adding a manual task or ask the AI to generate a plan.</p>
                 <button className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2">
                    <Plus size={18} /> Add First Task
                 </button>
              </div>
           </div>
        )}

        {activeTab === "ai-plan" && (
           <div className="text-center py-20 text-gray-500">
              <Brain size={48} className="mx-auto mb-4 text-gray-300"/>
              <p>AI Generation Feature Coming Soon...</p>
           </div>
        )}

      </div>
    </div>
  );
};

export default ModuleDetailPage;