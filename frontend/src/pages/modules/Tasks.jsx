import React, { useState } from "react";
import TaskList from "../../components/TaskList"; 
import PomoSession from "../../components/PomoSession"; // Ensure this path is correct

const Tasks = ({ module }) => {
  // State to track which task is currently running a session
  const [activeSessionTask, setActiveSessionTask] = useState(null);
  
  // State to force list refresh after a session (optional, but good for UI sync)
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTaskComplete = () => {
    setActiveSessionTask(null);
    setRefreshKey(prev => prev + 1); // Triggers the list to re-fetch/re-render
  };

  return (
    <div className="relative w-full h-full">
      {/* The List */}
      <TaskList 
        key={refreshKey} // Forces re-render when key changes
        moduleId={module?.id} 
        onStartSession={(task) => setActiveSessionTask(task)} // Pass the start handler down
      />

      {/* The Popup Window - Renders only when a task is active */}
      {activeSessionTask && (
        <PomoSession 
          task={activeSessionTask} 
          onClose={() => setActiveSessionTask(null)}
          onComplete={handleTaskComplete}
          onUpdateTask={handleTaskComplete}
        />
      )}
    </div>
  );
};

export default Tasks;