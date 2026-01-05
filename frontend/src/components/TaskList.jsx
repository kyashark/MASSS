// components/TaskList.jsx
import React, { useEffect, useState } from "react";
import TaskMeta from "./TaskMeta";
import { fetchTasks } from "../api/tasks.js"; 

// 1. Removed 'toggleTask' from props
const TasksList = ({ moduleId, onMenuAction, onStartSession }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTasks = async () => {
      try {
        if (moduleId) {
          const data = await fetchTasks(moduleId);
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

  // Sort: Incomplete first, Completed last (Keeping this visual sorting just in case)
  const sortedTasks = [...tasks].sort((a, b) => {
    const isAComplete = Boolean(a.completed || a.status === 'COMPLETED' || a.is_completed);
    const isBComplete = Boolean(b.completed || b.status === 'COMPLETED' || b.is_completed);
    if (isAComplete === isBComplete) return 0;
    return isAComplete ? 1 : -1;
  });

  return (
    <div className="flex flex-col gap-2 w-full px-10 py-10">
      {sortedTasks.map((task) => {
        const isComplete = Boolean(task.completed || task.status === 'COMPLETED' || task.is_completed);
        
        return (
          <TaskMeta 
            key={task.id} 
            task={{...task, completed: isComplete}} 
            // 2. Removed onToggle prop
            onMenuAction={onMenuAction}
            onStartSession={onStartSession} 
          />
        );
      })}
    </div>
  );
};

export default TasksList;