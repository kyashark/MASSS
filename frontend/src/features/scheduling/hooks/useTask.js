import { useEffect, useState } from "react";
import {
  getTasks,
  createTask,
  deleteTask,
  updateTask as updateTaskApi,
} from "../api/taskApi";

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load Tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Create Task
  const addTask = async (title, category) => {
    try {
      const newTask = await createTask({ title, category });
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      setError("Failed to add task");
    }
  };

  // Delete Task
  const removeTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      setError("Failed to delete task");
    }
  };

  // Update Task

  const updateTask = async (taskToUpdate) => {
    try {
      const { id, ...updates } = taskToUpdate;

      const updatedTask = await updateTaskApi(id, updates);

      setTasks((prev) =>
        prev.map((task) => (task.id === id ? updatedTask : task))
      );
    } catch (err) {
      setError("Failed to update task");
    }
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    removeTask,
    updateTask,
    refetch: fetchTasks,
  };
};
