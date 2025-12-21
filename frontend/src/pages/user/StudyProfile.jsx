import React, { useState } from 'react';
import { User, Mail, Clock, Zap, Save } from 'lucide-react';

const StudyProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    wakeTime: '08:00',
    bedTime: '23:00',
    morningCapacity: 4,
    afternoonCapacity: 4,
    nightCapacity: 2,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    console.log('Saving profile:', profile);
    alert('Profile updated (this is a template)');
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Study Profile</h2>
        <p className="text-gray-600">Customize your study preferences and schedule</p>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        {/* Personal Info */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <User size={24} className="text-blue-600" />
            Personal Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Study Schedule */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock size={24} className="text-green-600" />
            Study Schedule
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wake Time
                </label>
                <input
                  type="time"
                  name="wakeTime"
                  value={profile.wakeTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bed Time
                </label>
                <input
                  type="time"
                  name="bedTime"
                  value={profile.bedTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Energy Levels */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Zap size={24} className="text-yellow-600" />
            Daily Energy Capacity
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Morning (6am - 12pm)</span>
                <span className="text-blue-600 font-bold">{profile.morningCapacity} hours</span>
              </label>
              <input
                type="range"
                name="morningCapacity"
                value={profile.morningCapacity}
                onChange={handleChange}
                min="0"
                max="8"
                className="w-full"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Afternoon (12pm - 6pm)</span>
                <span className="text-blue-600 font-bold">{profile.afternoonCapacity} hours</span>
              </label>
              <input
                type="range"
                name="afternoonCapacity"
                value={profile.afternoonCapacity}
                onChange={handleChange}
                min="0"
                max="8"
                className="w-full"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Night (6pm - 11pm)</span>
                <span className="text-blue-600 font-bold">{profile.nightCapacity} hours</span>
              </label>
              <input
                type="range"
                name="nightCapacity"
                value={profile.nightCapacity}
                onChange={handleChange}
                min="0"
                max="8"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Save size={20} />
          Save Profile
        </button>
      </div>
    </div>
  );
};

export default StudyProfile;
