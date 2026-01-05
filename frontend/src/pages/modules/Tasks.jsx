// page/module/Task.jsx
import React, { useState } from "react";
import { Plus } from "lucide-react";
import TaskList from "../../components/TaskList"; 
import PomoSession from "../../components/PomoSession"; 
import TaskForm from "../../components/TaskForm"; 
import { useTaskActions } from "../../hooks/useTaskActions";

const Tasks = ({ module }) => {
  const [activeSessionTask, setActiveSessionTask] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize Hook
  const { 
    isFormOpen, 
    editingTask, 
    handleMenuAction, 
    // handleToggleTask,  <-- REMOVED
    openAddForm, 
    closeForm,
    handleFormSuccess
  } = useTaskActions(() => setRefreshKey((prev) => prev + 1));

  const handleSessionComplete = () => {
    setActiveSessionTask(null);
    setRefreshKey((prev) => prev + 1); 
  };

  return (
    <div className="relative w-full h-full">
      {/* Header */}
      <div className="flex justify-between items-center px-9 pt-8 pb-0">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {/* The List */}
      <TaskList 
        key={refreshKey} 
        moduleId={module?.id} 
        onStartSession={setActiveSessionTask}
        // Plug in Hook Logic
        onMenuAction={handleMenuAction} 
        // toggleTask prop REMOVED
      />

      {/* Shared Form */}
      <TaskForm 
        isOpen={isFormOpen}
        onClose={closeForm}
        moduleId={module?.id}
        onTaskCreated={handleFormSuccess}
        taskToEdit={editingTask} 
      />

      {/* Pomo Session Popup */}
      {activeSessionTask && (
        <PomoSession 
          task={activeSessionTask} 
          onClose={() => setActiveSessionTask(null)}
          onComplete={handleSessionComplete}
          onUpdateTask={handleSessionComplete}
        />
      )}
    </div>
  );
};

export default Tasks;