import React, { useState } from "react";
import { Plus } from "lucide-react";
import ModuleForm from "../components/ModuleForm.jsx";
import ModuleDetailPage from "./ModuleDetailPage.jsx";
import ModuleCard from "../components/ModuleCard.jsx";
import PageHeader from "../components/PageHeader.jsx";

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

<PageHeader 
  title="Modules" 
  description="Manage your active learning paths"
>
  <button 
    onClick={() => setIsModalOpen(true)}
    className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium transition-transform duration-200 shadow-lg hover:scale-105"
  >
    <Plus size={18} />
    <span>New Module</span>
  </button>
</PageHeader>


      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        


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