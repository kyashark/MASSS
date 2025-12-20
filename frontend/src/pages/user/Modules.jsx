// src/pages/Modules.jsx (or wherever you keep it)
import React, { useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import ModuleForm from "../../components/ModuleForm.jsx";
import ModuleDetailPage from "../../components/ModuleDetailPage.jsx";
import ModuleCard from "../../components/ModuleCard.jsx";

// Mock Data
const MOCK_MODULES = [
  {
    id: 1,
    name: "Learn Python",
    tasks: 12,
    progress: 45,
    color: "bg-blue-500",
    type: "coding",
    difficulty: 3,
    priority: "Medium",
  },
  {
    id: 2,
    name: "Data Structures",
    tasks: 8,
    progress: 20,
    color: "bg-purple-500",
    type: "math",
    difficulty: 5,
    priority: "High",
  },

  // Add more to test scrolling...
];

const Modules = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);

  const handleOpenModule = (module) => {
    setSelectedModule(module);
  };

  const handleBack = () => {
    setSelectedModule(null);
  };

  const handleCreateModule = (newModule) => {
    console.log("Creating new module:", newModule);
    setIsModalOpen(false);
    // Here you would normally add it to state or send to backend
  };

  return (
    <>
      {/* Global CSS for hidden scrollbar - add this once in your app (e.g., globals.css) */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>

      <div className="min-h-screen w-full flex">

        {/* LEFT PANEL*/}

        <div className="w-full max-w-md bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Header: Back button */}
          <div className="px-8 pt-6 pb-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
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

          <div className="flex-1 px-8 pb-8">

            {/* Small Top Nav */}
            <div className="flex items-center gap-2 pb-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search modules..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />

              {/* Sort */}
              <select className="px-2 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="name">Name</option>
                <option value="progress">Progress</option>
                <option value="priority">Priority</option>
              </select>

              {/* Add Button*/}
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 bg-gray-900 hover:bg-black text-white rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-all"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Module Cards List */}
            {MOCK_MODULES.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">
                  No modules yet. Create one to get started!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {MOCK_MODULES.map((module) => (
                  <div
                    key={module.id}
                    onClick={() => handleOpenModule(module)}
                    className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                  >
                    <ModuleCard module={module} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Detail View */}
        <div className="flex-1 bg-white">
          {selectedModule ? (
            <ModuleDetailPage module={selectedModule} onBack={handleBack} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-6">📚</div>
                <p className="text-xl font-medium">
                  Select a module from the left to view details
                </p>
                <p className="text-sm mt-2 text-gray-500">
                  Click any card to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Module Modal */}
      <ModuleForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateModule}
      />
    </>
  );
};

export default Modules;
