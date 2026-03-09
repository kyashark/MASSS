import React, { useState } from "react";
import { BookOpen, Brain, ListTodo, BarChart3, Bookmark } from "lucide-react";

import Tasks from "../pages/modules/Tasks.jsx";
import Exams from "../pages/modules/Exams.jsx";
import Progress from "../pages/modules/Progress.jsx";
import Notes from "../pages/modules/Notes.jsx";
import Resources from "../pages/modules/Resources.jsx";

const ModuleDetailPage = ({ module, onBack }) => {
  const [activeTab, setActiveTab] = useState("tasks");

  return (
    /* PAGE CONTAINER — FIXED HEIGHT */
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* HEADER (STATIC) */}
      <div
        className="w-full text-white px-8 py-6 shadow-sm flex flex-col gap-4"
        style={{ backgroundColor: module.color || "#3B82F6" }}
      >
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold">{module.name}</h1>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 flex-wrap text-white/90">
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase">
              {module.category || "General"}
            </span>
          </div>
        </div>
      </div>

      {/* TABS (STATIC) */}
      <div className="flex items-center px-8 border-b border-gray-200 bg-white">
        {[
          { id: "tasks", label: "Study Tasks", icon: ListTodo },
          { id: "exams-and-assignments", label: "Exams", icon: Bookmark },

          { id: "resources", label: "Resources", icon: BookOpen },
          { id: "ai-plan", label: "AI Syllabus", icon: Brain },
          { id: "progress", label: "Progress", icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-medium text-sm
              ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }
            `}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT — ONLY THIS SCROLLS */}
      <div className="flex-1 w-full overflow-y-auto bg-gray-50 scrollbar-hide">
        {activeTab === "tasks" && <Tasks module={module} />}

        {activeTab === "exams-and-assignments" && <Exams module={module} />}

        {activeTab === "resources" && <Resources module={module} />}

        {activeTab === "ai-plan" && <Notes module={module} />}

        {activeTab === "progress" && <Progress module={module} />}
      </div>
    </div>
  );
};

export default ModuleDetailPage;
