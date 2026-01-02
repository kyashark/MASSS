// TaskList.jsx
import React, { useEffect, useState } from "react";
import TaskMeta from "./TaskMeta";
import { fetchTasks } from "../api/tasks.js"; 

const TasksList = ({ moduleId, toggleTask, openMenu, onStartSession }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTasks = async () => {
      try {
        if (moduleId) {
          const data = await fetchTasks(moduleId);
          
          // --- DEBUGGING: Check your browser console to see what the data looks like ---
          console.log("Fetched Tasks Data:", data); 
          
          setTasks(data);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    getTasks();
  }, [moduleId]);

  if (loading) return <div className="text-center text-slate-400 py-4">Loading tasks...</div>;
  if (!tasks || tasks.length === 0) return <div className="text-center text-slate-400 py-10">No tasks found.</div>;

  // --- UPDATED SORT LOGIC ---
  const sortedTasks = [...tasks].sort((a, b) => {
    // 1. Force "completed" to be a boolean (handles 1, "true", true, etc.)
    const isAComplete = Boolean(a.completed || a.status === 'COMPLETED' || a.is_completed);
    const isBComplete = Boolean(b.completed || b.status === 'COMPLETED' || b.is_completed);

    // 2. Sort: Active tasks (-1) go first, Completed tasks (1) go last
    if (isAComplete === isBComplete) return 0;
    return isAComplete ? 1 : -1;
  });

  return (
    <div className="flex flex-col gap-2 w-full px-10 py-10">
      {sortedTasks.map((task) => {
        // Ensure we pass a clean boolean to TaskMeta so the styling works
        const isComplete = Boolean(task.completed || task.status === 'COMPLETED' || task.is_completed);
        
        return (
          <TaskMeta 
            key={task.id} 
            task={{...task, completed: isComplete}} // Override task prop to ensure styling works
            onToggle={toggleTask}
            onMenuAction={openMenu}
            onStartSession={onStartSession} 
          />
        );
      })}
    </div>
  );
};

export default TasksList;