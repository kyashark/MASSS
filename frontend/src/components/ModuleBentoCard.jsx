import { BookOpenText, ArrowUpRight } from "lucide-react";

const ModuleCard = () => {
  const focusModule = "Algorithms";
  const otherModules = [
    "Data Structures",
    "Databases",

  ];

  return (
    

      <div className="w-full h-full ">
        {/* Header */}
   

        {/* Today's Focus - Highlighted section */}
        <div
          className="rounded-2xl px-5 py-4 mb-6 "
          style={{ backgroundColor: '#e9fa9c' }}
        >
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
            Current Focus
          </p>
          <p className="text-2xl font-bold text-gray-900">{focusModule}</p>
        </div>

        {/* Up Next - Minimal list */}
        <div className="flex flex-col ">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Up Next
          </p>
          <div className="space-y-3">
            {otherModules.map((mod, index) => (
              <div
                key={index}
                className="px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-800">{mod}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

  );
};

export default ModuleCard;