// components/Tasks.jsx
import React from "react";
import { Plus, Calendar, CheckCircle2, Circle } from "lucide-react";

const mockTasks = [
  {
    id: 1,
    title: "Complete Python Basics Chapter 1-3",
    completed: true,
    dueDate: "2025-12-22",
    priority: "High",
  },
  {
    id: 2,
    title: "Practice Variables and Data Types",
    completed: false,
    dueDate: "2025-12-24",
    priority: "Medium",
  },
  {
    id: 3,
    title: "Solve 10 Easy LeetCode Problems",
    completed: false,
    dueDate: "2025-12-28",
    priority: "High",
  },
  {
    id: 4,
    title: "Watch Intro to Functions Video",
    completed: true,
    dueDate: "2025-12-20",
    priority: "Low",
  },
];

const Tasks = ({ module }) => {
  // You can add state for adding/editing tasks later
  const [tasks] = React.useState(mockTasks);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "text-red-600 bg-red-100";
      case "Medium": return "text-amber-600 bg-amber-100";
      case "Low": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-gray-50">
      {/* Task List Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <h2 className="text-2xl font-bold text-gray-900">Study Tasks</h2>
        <p className="text-gray-600 mt-1">{tasks.length} tasks • {tasks.filter(t => t.completed).length} completed</p>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30">📝</div>
            <p className="text-gray-500 text-lg">No tasks yet</p>
            <p className="text-gray-400">Add your first task to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex items-center gap-4 cursor-pointer"
              >
                {/* Checkbox */}
                <button className="flex-shrink-0">
                  {task.completed ? (
                    <CheckCircle2 size={24} className="text-green-600" />
                  ) : (
                    <Circle size={24} className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>

                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar size={16} />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button className="absolute bottom-8 right-8 bg-gray-900 hover:bg-black text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110">
        <Plus size={28} />
      </button>
    </div>
  );
};

export default Tasks;