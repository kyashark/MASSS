import React, { useState } from "react";
import { X, Check, Sun, Moon, Sunrise, Clock, Calendar, Hash } from "lucide-react";

const COLORS = [
  { id: "blue", bg: "bg-blue-500", hex: "#3B82F6" },
  { id: "purple", bg: "bg-purple-500", hex: "#A855F7" },
  { id: "green", bg: "bg-green-500", hex: "#22C55E" },
  { id: "orange", bg: "bg-orange-500", hex: "#F97316" },
  { id: "red", bg: "bg-red-500", hex: "#EF4444" },
  { id: "pink", bg: "bg-pink-500", hex: "#EC4899" },
  { id: "teal", bg: "bg-teal-500", hex: "#14B8A6" },
  { id: "yellow", bg: "bg-yellow-500", hex: "#EAB308" },
  { id: "gray", bg: "bg-gray-500", hex: "#6B7280" },
];

const MODULE_TYPES = [
    { id: "coding", label: "💻 Coding" },
    { id: "math", label: "📐 Math / Logic" },
    { id: "language", label: "📚 Language / Reading" },
    { id: "creative", label: "🎨 Creative / Design" },
    { id: "memorization", label: "🧠 Memorization" },
];

const ModuleForm = ({ isOpen, onClose, onSubmit }) => {
  // --- STATE MANAGEMENT ---
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [moduleType, setModuleType] = useState("coding");
  
  // AI Params
  const [difficulty, setDifficulty] = useState(3); // 1-5
  const [energyTime, setEnergyTime] = useState("any"); // morning, afternoon, evening
  
  // Goals
  const [targetHours, setTargetHours] = useState(5);
  const [deadline, setDeadline] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name,
      color: selectedColor.bg,
      type: moduleType,
      difficulty,
      energyTime,
      targetHours,
      deadline
    });
    
    // Reset and Close
    setName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
              <h3 className="text-2xl font-bold text-gray-900">Create Module</h3>
              <p className="text-sm text-gray-500">Define a new subject for the AI.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: IDENTITY */}
          <div className="space-y-4">
            {/* Name Input */}
            <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Module Name</label>
                <input 
                type="text" 
                placeholder="e.g., Learn React Native" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                autoFocus
                />
            </div>

            {/* Type & Color Row */}
            <div className="grid grid-cols-2 gap-4">
                {/* Module Type */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
                    <select 
                        value={moduleType}
                        onChange={(e) => setModuleType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium focus:border-black outline-none appearance-none cursor-pointer"
                    >
                        {MODULE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                </div>
                
                {/* Color Picker (Compact) */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Theme Color</label>
                    <div className="flex flex-wrap gap-2">
                        {COLORS.slice(0, 5).map((color) => (
                            <button
                            key={color.id}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`w-6 h-6 rounded-full ${color.bg} flex items-center justify-center transition-transform hover:scale-110 ${
                                selectedColor.id === color.id ? "ring-2 ring-offset-1 ring-black scale-110" : ""
                            }`}
                            >
                            </button>
                        ))}
                        {/* Expandable or just show top 5 to save space */}
                    </div>
                </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* SECTION 2: AI SETTINGS (Difficulty & Energy) */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Hash size={16} className="text-blue-600"/> AI Calibration
            </h4>
            
            <div className="grid grid-cols-2 gap-6">
                 {/* Difficulty Slider */}
                 <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs font-semibold text-gray-500">Difficulty</label>
                        <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{difficulty}/5</span>
                    </div>
                    <input 
                        type="range" min="1" max="5" step="1"
                        value={difficulty}
                        onChange={(e) => setDifficulty(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                 </div>

                 {/* Best Time (Icons) */}
                 <div>
                    <label className="text-xs font-semibold text-gray-500 mb-2 block">Best Energy Time</label>
                    <div className="flex gap-2">
                        {[
                            { id: "morning", icon: Sunrise },
                            { id: "afternoon", icon: Sun },
                            { id: "evening", icon: Moon },
                        ].map((time) => (
                            <button
                                key={time.id}
                                type="button"
                                onClick={() => setEnergyTime(time.id)}
                                className={`p-2 rounded-lg border transition-all ${
                                    energyTime === time.id 
                                        ? "border-black bg-black text-white" 
                                        : "border-gray-200 text-gray-400 hover:bg-gray-50"
                                }`}
                            >
                                <time.icon size={16} />
                            </button>
                        ))}
                    </div>
                 </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* SECTION 3: GOALS (Hours & Deadlines) */}
          <div className="space-y-4">
             <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Clock size={16} className="text-blue-600"/> Goals & Limits
            </h4>

             <div className="grid grid-cols-2 gap-4">
                {/* Target Hours */}
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-500">Weekly Goal (Hrs)</label>
                   <input 
                      type="number" min="1" max="40"
                      value={targetHours}
                      onChange={(e) => setTargetHours(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-black text-sm font-bold"
                   />
                </div>
                
                {/* Deadline */}
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-500">Exam/Deadline</label>
                   <div className="relative">
                     <Calendar size={14} className="absolute left-3 top-3 text-gray-400"/>
                     <input 
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:border-black text-xs font-medium"
                     />
                   </div>
                </div>
             </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-[2] py-3 rounded-xl font-bold text-white bg-black hover:scale-[1.02] transition-transform shadow-lg"
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