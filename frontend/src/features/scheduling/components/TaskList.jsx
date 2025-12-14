export default function TaskList({ tasks, onDelete, onEdit }) {
  if (!tasks.length) {
    return (
      <div className="text-sm text-gray-500 mt-4">
        No tasks yet.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">
              {task.title}
            </p>
            <span className="text-xs text-gray-500">
              {task.category}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(task)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>

            <button
              onClick={() => onDelete(task.id)}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
