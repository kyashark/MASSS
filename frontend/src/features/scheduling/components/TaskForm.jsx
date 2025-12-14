import { useState, useEffect } from "react";

export default function TaskForm({ onAdd, onUpdate, taskToEdit, onCancel }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");

  // Populate form when Edit button is clicked
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setCategory(taskToEdit.category);
    } else {
      setTitle("");
      setCategory("General");
    }
  }, [taskToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (taskToEdit) {
      // Send the updated object back to parent
      onUpdate({ ...taskToEdit, title, category });
    } else {
      // Add new task
      onAdd(title, category);
      setTitle("");
      setCategory("General");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-xl bg-white p-4 shadow-sm border border-gray-200"
    >
      <h3 className="mb-3 text-sm font-semibold text-gray-800">
        {taskToEdit ? "Edit Task" : "New Task"}
      </h3>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="General">General</option>
          <option value="Coding">Coding</option>
          <option value="Math">Math</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className={`w-full rounded-lg py-2 text-sm font-medium text-white transition-colors ${
            taskToEdit
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {taskToEdit ? "Save Changes" : "Add Task"}
        </button>

        {taskToEdit && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
