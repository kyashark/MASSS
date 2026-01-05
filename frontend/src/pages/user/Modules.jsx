import React, { useState, useEffect } from "react";
import { Plus, ArrowLeft, Book } from "lucide-react";
import ModuleForm from "../../components/ModuleForm.jsx";
import ModuleDetailPage from "../../components/ModuleDetailPage.jsx";
import ModuleCard from "../../components/ModuleCard.jsx";

// API
import {
  createModule,
  createExam,
  fetchModules,
  updateModule,
  deleteModule,
} from "../../api/modules";

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
      // 1. Create module with exams bundled
      const createdModule = await createModule({
        name: newModule.name,
        category: newModule.category,
        color: newModule.color,
        priority: newModule.priority,
        difficulty: newModule.difficulty,
        // Use camelCase here; API layer maps to snake_case
        energyTime: newModule.energyTime,
        exams: newModule.exams,
      });

      // 2. Update UI immediately
      setModules((prev) => [createdModule, ...prev]);

      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create module", err);
    }
  };

  const [editingModule, setEditingModule] = useState(null);

  const handleEditModule = (module) => {
    setIsModalOpen(true);
    setEditingModule(module);
  };

  const handleUpdateModule = async (updatedModule) => {
    try {
      // 1. Format the data
      const apiData = {
        id: updatedModule.id,
        name: updatedModule.name,
        category: updatedModule.category,
        color: updatedModule.color,
        priority: updatedModule.priority,
        difficulty: updatedModule.difficulty,
        energyTime: updatedModule.energyTime,
        exams: updatedModule.exams.map((exam) => {
          const isTempId = exam.id > 2000000000; // Rough check for timestamp

          return {
            id: isTempId ? null : exam.id,
            name: exam.name,
            exam_type: exam.type,
            due_date: exam.dueDate,
          };
        }),
      };

      // 2. Send the formatted data
      const savedModule = await updateModule(updatedModule.id, apiData);

      // 3. Update UI
      setModules((prev) =>
        prev.map((m) => (m.id === savedModule.id ? savedModule : m))
      );

      setIsModalOpen(false);
      setEditingModule(null);
    } catch (err) {
      console.error("Failed to update module", err);
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm("Are you sure you want to delete this module?")) return;
    try {
      await deleteModule(moduleId);
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    } catch (err) {
      console.error("Failed to delete module", err);
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
                    <ModuleCard
                      key={module.id}
                      module={module}
                      onClick={() => handleOpenModule(module)}
                      onEdit={handleEditModule}
                      onDelete={handleDeleteModule}
                    />
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
                <div className="text-6xl mb-6 flex items-center justify-center ">
                  <Book size={48} className="text-slate-300" />
                </div>
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
        // When closing, we must close modal AND clear the editing module so "Add" works next time
        onClose={() => {
          setIsModalOpen(false);
          setEditingModule(null);
        }}
        // Dynamically switch between Update and Create based on if we are editing
        onSubmit={editingModule ? handleUpdateModule : handleCreateModule}
        // PASS THE DATA HERE
        initialModule={editingModule}
      />
    </>
  );
};

export default Modules;
