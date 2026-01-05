// components/TaskForm.jsx
import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, BookOpen } from "lucide-react";
import { createTask, updateTask } from "../api/tasks"; // Import updateTask
import { fetchExamsByModule } from "../api/exams";

const TaskForm = ({ isOpen, onClose, moduleId, onTaskCreated, taskToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    estimated_pomodoros: 1,
    priority: "Medium",
    deadline: "",
    is_fixed: false,
    exam_id: "",
  });

  // 1. Fetch Exams & Populate Form for Editing
  useEffect(() => {
    if (isOpen) {
      // Load Exams
      if (moduleId) {
        fetchExamsByModule(moduleId).then(setExams).catch(console.error);
      }

      // If Editing: Pre-fill data
      if (taskToEdit) {
        setFormData({
          name: taskToEdit.name || "",
          description: taskToEdit.description || "",
          estimated_pomodoros: taskToEdit.estimated_pomodoros || 1,
          priority: taskToEdit.priority || "Medium",
          // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
          deadline: taskToEdit.deadline ? new Date(taskToEdit.deadline).toISOString().slice(0, 16) : "",
          is_fixed: taskToEdit.is_fixed || false,
          exam_id: taskToEdit.exam_id || "",
        });
      } else {
        // If Adding: Reset form
        setFormData({
          name: "",
          description: "",
          estimated_pomodoros: 1,
          priority: "Medium",
          deadline: "",
          is_fixed: false,
          exam_id: "",
        });
      }
    }
  }, [isOpen, moduleId, taskToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        module_id: moduleId,
        exam_id: formData.exam_id ? parseInt(formData.exam_id) : null,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      };

      let result;
      // 2. Decide: Create or Update?
      if (taskToEdit) {
        result = await updateTask(taskToEdit.id, payload);
      } else {
        result = await createTask(payload);
      }

      onTaskCreated(result); // Pass result back
      onClose();
    } catch (err) {
      console.error("Failed to save task", err);
      alert(err.response?.data?.detail?.[0]?.msg || "Error saving task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">
            {taskToEdit ? "Edit Task" : "Add New Task"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details (Optional)</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Exam Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <BookOpen size={14} /> Link to Exam (Optional)
            </label>
            <select
              value={formData.exam_id}
              onChange={(e) => setFormData({ ...formData, exam_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white"
            >
              <option value="">-- No Exam --</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Est. Pomodoros */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Clock size={14} /> Est. Pomodoros
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.estimated_pomodoros}
                onChange={(e) => setFormData({ ...formData, estimated_pomodoros: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar size={14} /> Deadline
            </label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : taskToEdit ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;