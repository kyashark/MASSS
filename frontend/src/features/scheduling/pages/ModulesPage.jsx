import React, { useState } from "react";
import { Plus } from "lucide-react";
import ModuleForm from "../components/ModuleForm.jsx";
import ModuleDetailPage from "./ModuleDetailPage.jsx";
import ModuleCard from "../components/ModuleCard.jsx";

// Mock Data (Updated with 'type' so icons appear correctly)
const MOCK_MODULES = [
  { 
    id: 1, 
    name: "Learn Python", 
    tasks: 12, 
    progress: 45, 
    color: "bg-blue-500", 
    type: "coding", 
    difficulty: 3 
  },
  { 
    id: 2, 
    name: "Data Structures", 
    tasks: 8, 
    progress: 20, 
    color: "bg-purple-500", 
    type: "math", 
    difficulty: 5 
  },
  { 
    id: 3, 
    name: "Research Methods", 
    tasks: 5, 
    progress: 10, 
    color: "bg-green-500", 
    type: "language", 
    difficulty: 1 
  },
];

const ModulesPage = ({ setIsDetailView }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);

  // --- HANDLERS ---

  // Open Module: Select it AND tell Layout to hide the header
  const handleOpenModule = (module) => {
    setSelectedModule(module);
    if (setIsDetailView) setIsDetailView(true);
  };

  // Close Module: Deselect AND tell Layout to show header again
  const handleBack = () => {
    setSelectedModule(null);
    if (setIsDetailView) setIsDetailView(false);
  };

  const handleCreateModule = (newModule) => {
    console.log("Creating:", newModule);
    // TODO: Add logic to update backend here
    setIsModalOpen(false);
  };

  const handleEditModule = (module) => {
    console.log("Edit clicked for:", module.name);
  };

  // --- RENDER LOGIC ---

  // 1. Show Detail Page if a module is selected
  if (selectedModule) {
    return (
      <ModuleDetailPage 
        module={selectedModule} 
        onBack={handleBack} 
      />
    );
  }

  // 2. Show Grid View
  return (
    <div className="p-8 h-full overflow-y-auto bg-white animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Current Subjects</h2>
          <p className="text-gray-500 text-sm">Manage your active learning paths</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium transition-transform duration-200 shadow-lg hover:scale-105"
        >
          <Plus size={18} />
          <span>New Module</span>
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 'Add New' Empty State Card */}
        <div 
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-6 text-gray-400 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] cursor-pointer group h-64"
        >
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Plus size={28} />
          </div>
          <span className="font-bold text-lg">Create Module</span>
        </div>

        {/* Real Module Cards */}
        {MOCK_MODULES.map((module) => (
          <ModuleCard 
            key={module.id} 
            module={module} 
            onClick={() => handleOpenModule(module)}
            onEdit={handleEditModule}
          />
        ))}
        
      </div>

      {/* Create Module Modal */}
      <ModuleForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateModule} 
      />
    </div>
  );
};

export default ModulesPage;