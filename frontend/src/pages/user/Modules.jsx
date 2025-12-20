import React from 'react';
import { Plus, BookOpen } from 'lucide-react';

const Modules = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">My Modules</h2>
        <p className="text-gray-600">Manage your study modules and learning paths</p>
      </div>

      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Active Modules</h3>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={20} />
          Add Module
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="flex justify-center mb-4">
          <BookOpen size={48} className="text-gray-400" />
        </div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">No modules yet</h4>
        <p className="text-gray-500 mb-6">Create your first module to start organizing your studies</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          Create Module
        </button>
      </div>

      {/* Template for when modules exist */}
      {/* 
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Python Basics</h4>
          <p className="text-gray-600 text-sm mb-4">Learning Python programming fundamentals</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{width: '60%'}}></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">60% Complete</p>
        </div>
      </div>
      */}
    </div>
  );
};

export default Modules;
