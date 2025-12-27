// components/TaskList.jsx
import React, { useState, useEffect } from "react";
import { Plus, Play, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import TaskForm from "./TaskForm";
import PomoSession from "./PomoSession";
import { fetchTasks } from "../api/tasks";

const TaskList = ({ module }) => {
  const [tasks, setTasks] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeSessionTask, setActiveSessionTask] = useState(null); // Which task is running?

  // Fetch on mount
  useEffect(() => {
    loadTasks();
  }, [module.id]);

  const loadTasks = async () => {
    try {
      const data = await fetchTasks(module.id);
      setTasks(data);
    } catch (err) {
      console.error("Error loading tasks", err);
    }
  };

  // Helper to color code priority
  const getPriorityColor = (p) => {
    switch (p) {
      case "HIGH": return "text-red-600 bg-red-50 border-red-100";
      case "MEDIUM": return "text-amber-600 bg-amber-50 border-amber-100";
      default: return "text-green-600 bg-green-50 border-green-100";
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Study Tasks</h2>
          <p className="text-gray-500">Break down {module.name} into manageable chunks</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-all"
        >
          <Plus size={18} /> Add Task
        </button>
      </div>

      {/* Task Grid */}
      <div className="space-y-3">
        {tasks.filter(t => t.status !== "ARCHIVED").map((task) => (
          <div
            key={task.id}
            className={`group bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 ${task.status === "COMPLETED" ? "opacity-60 bg-gray-50" : ""}`}
          >
            {/* Status Icon */}
            <div className="text-gray-400">
              {task.status === "COMPLETED" ? (
                <CheckCircle2 className="text-green-500" size={24} />
              ) : (
                <Circle size={24} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-semibold text-gray-900 ${task.status === "COMPLETED" ? "line-through text-gray-500" : ""}`}>
                  {task.name}
                </h3>
                {/* Priority Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {task.estimated_pomodoros} x 30m
                </span>
                {task.deadline && (
                    <span className="flex items-center gap-1 text-orange-600">
                        <AlertCircle size={12} /> {new Date(task.deadline).toLocaleDateString()}
                    </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {task.status !== "COMPLETED" && (
              <button
                onClick={() => setActiveSessionTask(task)}
                className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium transition-all transform hover:scale-105"
              >
                <Play size={16} fill="currentColor" /> Start
              </button>
            )}
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            No tasks yet. Create one to get started!
          </div>
        )}
      </div>

      {/* MODALS */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        moduleId={module.id}
        onTaskCreated={(newTask) => setTasks([newTask, ...tasks])}
      />

      {/* FULL SCREEN SESSION OVERLAY */}
      {activeSessionTask && (
        <PomoSession
          task={activeSessionTask}
          onClose={() => setActiveSessionTask(null)}
          onComplete={(taskId) => {
             // Update local state to show completed immediately
             setTasks(tasks.map(t => t.id === taskId ? {...t, status: "COMPLETED"} : t));
          }}
        />
      )}
    </div>
  );
};

export default TaskList;