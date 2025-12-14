import { useState } from 'react'; // Import useState
import TaskForm from '../components/TaskForm.jsx';
import TaskList from '../components/TaskList.jsx';
import { useTasks } from '../hooks/useTask.js';

export default function TaskSection() {
  const [taskToEdit, setTaskToEdit] = useState(null); // State to track editing

  const {
    tasks,
    loading,
    error,
    addTask,
    removeTask,
    updateTask, // You need to make sure your hook exports this (see Step 3)
  } = useTasks();

  // 1. Handle when "Edit" is clicked on a list item
  const handleEditClick = (task) => {
    setTaskToEdit(task);
  };

  // 2. Handle when the form submits an update
  const handleUpdate = (updatedTask) => {
    updateTask(updatedTask);
    setTaskToEdit(null); // Stop editing after save
  };

  // 3. Handle when user cancels editing
  const handleCancelEdit = () => {
    setTaskToEdit(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        
        {/* Pass the new props to TaskForm */}
        <TaskForm 
          onAdd={addTask} 
          onUpdate={handleUpdate}
          taskToEdit={taskToEdit}
          onCancel={handleCancelEdit}
        />

        {loading && (
          <p className="mt-4 text-sm text-gray-500 text-center">
            Loading tasks...
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-500 text-center">
            {error}
          </p>
        )}

        {!loading && !error && (
          <TaskList
            tasks={tasks}
            onDelete={removeTask}
            onEdit={handleEditClick} // Pass the edit handler here
          />
        )}
      </div>
    </div>
  );
}