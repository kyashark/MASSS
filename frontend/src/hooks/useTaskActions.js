// hooks/useTaskActions.js
import { useState } from "react";
import { deleteTask, updateTask } from "../api/tasks";

export const useTaskActions = (onRefresh) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // 1. Handle Menu Actions (Delete, Edit, Assign)
  const handleMenuAction = async (task, action) => {
    if (action === "delete") {
      if (window.confirm("Are you sure you want to delete this task?")) {
        try {
          await deleteTask(task.id);
          if (onRefresh) onRefresh(); // Trigger list refresh
        } catch (error) {
          console.error("Error deleting task:", error);
          alert("Failed to delete task.");
        }
      }
    } else if (action === "edit" || action === "assign_exam") {
      setEditingTask(task);
      setIsFormOpen(true);
    }
  };

  // 2. Handle Checkbox Toggle
  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      // Toggle the boolean status
      await updateTask(taskId, { completed: !currentStatus });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  // 3. Form Management Helpers
  const openAddForm = () => {
    setEditingTask(null); // Ensure we are in "Add" mode
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleFormSuccess = () => {
    if (onRefresh) onRefresh();
    closeForm();
  };

  return {
    isFormOpen,
    editingTask,
    handleMenuAction,
    handleToggleTask,
    openAddForm,
    closeForm,
    handleFormSuccess,
  };
};