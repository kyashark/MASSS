export default function ItemList({ items, onDelete, onEdit }) {
  if (!items.length) {
    return (
      <div className="text-sm text-gray-500 mt-4">
        No items yet.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">
              {item.title}
            </p>
            <span className="text-xs text-gray-500">
              {item.category}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(item)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>

            <button
              onClick={() => onDelete(item.id)}
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