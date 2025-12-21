// src/pages/Modules.jsx
import React, { useState,useEffect } from "react";
import { Plus, ArrowLeft,Book } from "lucide-react";
import ModuleForm from "../../components/ModuleForm.jsx";
import ModuleDetailPage from "../../components/ModuleDetailPage.jsx";
import ModuleCard from "../../components/ModuleCard.jsx";

// API
import { createModule, createExam, fetchModules } from "../../api/modules";

// Mock Data
// const MOCK_MODULES = [
//   {
//     id: 1,
//     name: "Learn Python",
//     tasks: 12,
//     progress: 45,
//     color: "bg-blue-500",
//     type: "coding",
//     difficulty: 3,
//     priority: "Medium",
//   },
//   {
//     id: 2,
//     name: "Data Structures",
//     tasks: 8,
//     progress: 20,
//     color: "bg-purple-500",
//     type: "math",
//     difficulty: 5,
//     priority: "High",
//   },
//   {
//     id: 3,
//     name: "Algorithms",
//     tasks: 15,
//     progress: 60,
//     color: "bg-green-500",
//     type: "coding",
//     difficulty: 4,
//     priority: "High",
//   },
//   {
//     id: 4,
//     name: "Databases",
//     tasks: 10,
//     progress: 30,
//     color: "bg-red-500",
//     type: "backend",
//     difficulty: 3,
//     priority: "Medium",
//   },
//   {
//     id: 5,
//     name: "Operating Systems",
//     tasks: 9,
//     progress: 15,
//     color: "bg-yellow-500",
//     type: "theory",
//     difficulty: 5,
//     priority: "High",
//   },
// ];

const Modules = () => {
  const [modules, setModules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
  fetchModules().then(setModules);
}, []);

  const handleOpenModule = (module) => {
    setSelectedModule(module);
  };

  const handleBack = () => {
    setSelectedModule(null);
  };

const handleCreateModule = async (newModule) => {
  try {
    // 1. Create module
    const createdModule = await createModule({
      name: newModule.name,
      category: newModule.category.toUpperCase(),
      color: newModule.color,
      priority: newModule.priority.toUpperCase(),
      difficulty: newModule.difficulty,
      energy_time: newModule.energyTime,
    });

    // 2. Create exams (if any)
    for (const exam of newModule.exams) {
      await createExam({
        module_id: createdModule.id,
        name: exam.name,
        type: exam.type,
        due_date: exam.dueDate,
      });
    }

    // 3. Update UI immediately
    setModules((prev) => [createdModule, ...prev]);

    setIsModalOpen(false);
  } catch (err) {
    console.error("Failed to create module", err);
  }
};


  return (
    <>
      {/* PAGE CONTAINER — FIXED HEIGHT (NO PAGE SCROLL) */}
      <div className="h-screen w-full flex overflow-hidden">

        {/* LEFT PANEL */}
        <div className="w-full max-w-md bg-gray-50 border-r border-gray-200 flex flex-col">

          {/* Back Button */}
          <div className="px-8 pt-6 pb-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft size={22} />
              Back to Home
            </button>
          </div>

          {/* Title */}
          <div className="px-8 pb-8">
            <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
            <p className="text-md text-gray-600 mt-2">
              Manage Active Learning Paths and Tasks
            </p>
          </div>

          {/* CONTENT AREA (FLEX COLUMN, NO SCROLL HERE) */}
          <div className="flex-1 px-8 pb-8 flex flex-col overflow-hidden">

            {/* Top Controls (STATIC) */}
            <div className="flex items-center gap-2 pb-4 pt-2">
              <input
                type="text"
                placeholder="Search modules..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />

              <select className="px-2 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="name">Name</option>
                <option value="progress">Progress</option>
                <option value="priority">Priority</option>
              </select>

              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 bg-gray-900 hover:bg-black text-white rounded-lg flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* SCROLLABLE MODULE GRID — ONLY THIS SCROLLS */}
            {modules.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                No modules yet. Create one to get started!
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-1 scrollbar-hide">
                <div className="grid grid-cols-1 gap-6">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      onClick={() => handleOpenModule(module)}
                      className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                    >
                      <ModuleCard module={module} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-white">
          {selectedModule ? (
            <ModuleDetailPage module={selectedModule} onBack={handleBack} />
          ) : (
            <div className=" flex items-center justify-center h-full text-gray-400 text-slate-300">
              <div className="text-center">
                <div className="text-6xl mb-6 flex items-center justify-center "><Book size={48} className="text-slate-300"/></div>
                <p className="text-xl font-medium">
                  Select a module from the left to view details
                </p>
                <p className="text-sm mt-2 text-slate-300">
                  Click any card to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODULE MODAL */}
      <ModuleForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateModule}
      />
    </>
  );
};

export default Modules;
