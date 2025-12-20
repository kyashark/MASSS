// components/ModuleForm.jsx
import React, { useState } from "react";
import { X, Sun, Moon, Sunrise, Clock, Calendar, Hash } from "lucide-react";

const COLORS = [
  { id: "blue", bg: "bg-blue-500" },
  { id: "purple", bg: "bg-purple-500" },
  { id: "green", bg: "bg-green-500" },
  { id: "orange", bg: "bg-orange-500" },
  { id: "red", bg: "bg-red-500" },
  { id: "pink", bg: "bg-pink-500" },
  { id: "teal", bg: "bg-teal-500" },
  { id: "yellow", bg: "bg-yellow-500" },
  { id: "gray", bg: "bg-gray-500" },
];

const MODULE_TYPES = [
  { id: "coding", label: "Coding" },
  { id: "math", label: "Math / Logic" },
  { id: "language", label: "Language / Reading" },
  { id: "creative", label: "Creative / Design" },
  { id: "memorization", label: "Memorization" },
];

const ModuleForm = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [moduleType, setModuleType] = useState("coding");
  const [difficulty, setDifficulty] = useState(3);
  const [energyTime, setEnergyTime] = useState("any");
  const [targetHours, setTargetHours] = useState(5);
  const [deadline, setDeadline] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      color: selectedColor.bg,
      type: moduleType,
      difficulty,
      energyTime: energyTime === "any" ? null : energyTime,
      targetHours: Number(targetHours),
      deadline: deadline || null,
    });

    setName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md px-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Create New Module</h2>
            <p className="text-sm opacity-75 mt-0.5">Configure your personalized learning path</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          {/* Three-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Column 1: Basics */}
            <div className="space-y-7">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Module Name</label>
                <input
                  type="text"
                  placeholder="e.g., Advanced Python Programming"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 text-lg font-medium bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={moduleType}
                  onChange={(e) => setModuleType(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                >
                  {MODULE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Theme Color</label>
                <div className="grid grid-cols-5 gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`aspect-square rounded-xl ${color.bg} transition-all hover:scale-105 ${
                        selectedColor.id === color.id
                          ? "ring-4 ring-offset-2 ring-gray-900 scale-105 shadow-lg"
                          : "shadow"
                      }`}
                      aria-label={color.id}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: AI Calibration */}
            <div className="space-y-7">
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Hash size={18} className="text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">AI Calibration</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium text-gray-700">Difficulty Level</label>
                      <span className="text-sm font-bold bg-gray-100 px-3 py-1.5 rounded-lg">{difficulty} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={difficulty}
                      onChange={(e) => setDifficulty(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Preferred Study Time</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "morning", icon: Sunrise, label: "Morning" },
                        { id: "afternoon", icon: Sun, label: "Afternoon" },
                        { id: "evening", icon: Moon, label: "Evening" },
                      ].map((time) => (
                        <button
                          key={time.id}
                          type="button"
                          onClick={() => setEnergyTime(time.id)}
                          className={`py-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            energyTime === time.id
                              ? "border-gray-900 bg-gray-900 text-white shadow-md"
                              : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <time.icon size={22} />
                          <span className="text-sm font-medium">{time.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Goals */}
            <div className="space-y-7">
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Clock size={18} className="text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Goals & Timeline</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Weekly Target Hours</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={targetHours}
                      onChange={(e) => setTargetHours(Math.max(1, Math.min(40, Number(e.target.value))))}
                      className="w-full px-4 py-3.5 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Target Completion Date</label>
                    <div className="relative">
                      <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-12">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-10 py-3.5 rounded-xl font-semibold text-white bg-gray-900 hover:bg-black transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Create Module
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModuleForm;