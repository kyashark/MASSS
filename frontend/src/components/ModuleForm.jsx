import React, { useState } from "react";

import { X, SendHorizontal } from "lucide-react";

const pastelColors = [
  { name: "Dusty Pink", value: "#E89BAE" },
  { name: "Steel Blue", value: "#7AAFE0" },
  { name: "Teal Mint", value: "#82CBB2" },
  { name: "Deep Lavender", value: "#B888E2" },
  { name: "Warm Peach", value: "#FFB07C" },
  { name: "Golden Yellow", value: "#FFE680" },
  { name: "Sage Green", value: "#A3C48A" },
  { name: "Coral Rose", value: "#FF9E85" },
];

const categories = [
  "Coding",
  "Math/Logic",
  "Language",
  "Creative Design",
  "Memorization",
];
const priorities = ["Low", "Medium", "High"];
const energyTimes = ["Morning", "Afternoon", "Evening"];

const ModuleForm = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1); // 1 = basics, 2 = exams

  // Page 1 states
  const [moduleName, setModuleName] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState(pastelColors[0].value);
  const [priority, setPriority] = useState("Medium");
  const [difficulty, setDifficulty] = useState(3);
  const [energyTime, setEnergyTime] = useState("Morning");

  // Page 2 states
  const [exams, setExams] = useState([]);
  const [newExamName, setNewExamName] = useState("");
  const [newExamType, setNewExamType] = useState("");
  const [newExamDueDate, setNewExamDueDate] = useState("");

  if (!isOpen) return null;

  const addExam = () => {
    if (newExamName.trim() && newExamType.trim() && newExamDueDate) {
      setExams([
        ...exams,
        {
          id: Date.now(),
          name: newExamName.trim(),
          type: newExamType.trim(),
          dueDate: newExamDueDate,
        },
      ]);
      setNewExamName("");
      setNewExamType("");
      setNewExamDueDate("");
    }
  };

  const removeExam = (id) => {
    setExams(exams.filter((exam) => exam.id !== id));
  };

  const handleSubmit = () => {
    if (!moduleName.trim() || !category) return;

    onSubmit({
      name: moduleName.trim(),
      category,
      color,
      priority,
      difficulty,
      energyTime,
      exams,
    });

    // Reset all
    setModuleName("");
    setCategory("");
    setColor(pastelColors[0].value);
    setPriority("Medium");
    setDifficulty(3);
    setEnergyTime("Morning");
    setExams([]);
    setStep(1);
    onClose();
  };

  const nextStep = () => {
    if (moduleName.trim() && category) {
      setStep(2);
    }
  };

  const prevStep = () => setStep(1);

  return (
    <>
      {/* Blurred backdrop */}
      <div
        className="fixed inset-0 bg-white/10 backdrop-blur-lg z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header*/}
          <div className=" bg-slate-200 px-8 py-6 border-b border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Add New Module
              </h2>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-200/50 rounded-lg transition focus:outline-none"
                aria-label="Close"
              >
                <X size={24} className="text-black" strokeWidth={2} />
              </button>
            </div>

            {/* Form Step Indicator */}
            <div className="flex items-center gap-4">
              <div
                className={`h-2 flex-1 rounded-full ${
                  step >= 1 ? "bg-slate-800" : "bg-gray-300"
                }`}
              />
              <div
                className={`h-2 flex-1 rounded-full ${
                  step >= 2 ? "bg-slate-800" : "bg-gray-300"
                }`}
              />
            </div>

            {/* Step Indicator Text */}
            <p className="text-sm text-gray-700 mt-2">
              Step {step}:{" "}
              {step === 1 ? "Module Details" : "Exams & Assignments"}
            </p>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-8">
            {step === 1 ? (
              /* PAGE 1: Module Basics */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
                {/* Column 1 */}
                <div className="space-y-7">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Module Name
                    </label>
                    <input
                      type="text"
                      value={moduleName}
                      onChange={(e) => setModuleName(e.target.value)}
                      placeholder="e.g., Advanced React"
                      className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Color Theme
                    </label>
                    <div className="mt-3 grid grid-cols-4 gap-3">
                      {pastelColors.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setColor(c.value)}
                          className={`h-8 rounded-md transition-all ${
                            color === c.value
                              ? "ring-4 ring-gray-200 ring-offset-2"
                              : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-7">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
                    >
                      {priorities.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mt-5">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Module Difficulty
                      </label>
                      {difficulty > 0 && (
                        <div className="mt-1 text-sm text-gray-700 tracking-widest">
                          Level {difficulty}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-5 mb-10">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`flex-1 h-5 cursor-pointer rounded transition-all duration-300 ${
                            difficulty >= level
                              ? "bg-slate-700"
                              : "bg-slate-300"
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Best Time to Study
                    </label>
                    <select
                      value={energyTime}
                      onChange={(e) => setEnergyTime(e.target.value)}
                      className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
                    >
                      {energyTimes.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-sm text-gray-500">
                      This is just a starting preference and can be adjusted
                      based on your optimal learning time
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* PAGE 2: Exams & Assignments */
              <div className="max-w-full mx-auto  ">
                <h3 className="text-xl font-semibold text-gray-800 mb-8">
                  Add Exams & Assignments
                </h3>

                {/* Add New Exam Form */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Exam/Assignment Name"
                    value={newExamName}
                    onChange={(e) => setNewExamName(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
                  />

                  <input
                    type="text"
                    placeholder="Type (e.g., Final, Quiz)"
                    value={newExamType}
                    onChange={(e) => setNewExamType(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
                  />

                  <div className="flex gap-3">
                    <input
                      type="date"
                      value={newExamDueDate}
                      onChange={(e) => setNewExamDueDate(e.target.value)}
                      className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
                    />
                    <button
                      onClick={addExam}
                      className="px-6 py-2 bg-slate-700 hover:bg-slate-900 text-white font-medium rounded-md transition shadow-md flex items-center justify-center"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Exam List */}
                <div className="space-y-4  min-h-[200px] mt-4 mb-4">
                  {exams.length === 0 ? (
                    <div className="text-center text-gray-400 pt-10">
                      <p className="text-md">
                        No exams or assignments added yet
                      </p>
                      <p className="text-sm mt-2">
                        You can skip this and add them later
                      </p>
                    </div>
                  ) : (
                    exams.map((exam) => (
                      <div
                        key={exam.id}
                        className="bg-white py-3 px-5 rounded-md shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition mb-3 "
                      >
                        <div>
                          <span className="font-semibold text-gray-800">
                            {exam.name}
                          </span>
                          <span className="text-gray-500 mx-3">•</span>
                          <span className="text-gray-600">{exam.type}</span>
                          <span className="text-gray-500 mx-3">•</span>
                          <span className="text-sm text-gray-500">
                            Due {new Date(exam.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          onClick={() => removeExam(exam.id)}
                          className="text-slate-800 hover:text-red-600 cursor-pointer text-sm transition"
                        >
                          Cancel
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex justify-between">
            <button
              onClick={step === 1 ? onClose : prevStep}
              className="px-10 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>

            <div className="flex gap-4">
              {step === 1 ? (
                <button
                  onClick={nextStep}
                  disabled={!moduleName.trim() || !category}
                  className="px-10 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-md transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-10 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-lg transition"
                >
                  Create Module
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModuleForm;
