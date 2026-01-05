import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

const Scheduling = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Scheduling</h2>
        <p className="text-gray-600">View and manage your study schedule</p>
      </div>

      {/* Schedule Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={24} className="text-blue-600" />
            <h4 className="font-semibold text-gray-800">Today's Tasks</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600">0</p>
          <p className="text-sm text-gray-600 mt-1">tasks scheduled</p>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <Clock size={24} className="text-green-600" />
            <h4 className="font-semibold text-gray-800">Study Time</h4>
          </div>
          <p className="text-2xl font-bold text-green-600">0h</p>
          <p className="text-sm text-gray-600 mt-1">this week</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-yellow-600" />
            <h4 className="font-semibold text-gray-800">Upcoming</h4>
          </div>
          <p className="text-2xl font-bold text-yellow-600">0</p>
          <p className="text-sm text-gray-600 mt-1">deadlines</p>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Weekly Schedule</h3>
        <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Your schedule will appear here once you add tasks</p>
        </div>
      </div>
    </div>
  );
};

export default Scheduling;
