import React, { useState, useEffect } from "react";

const ExamForm = ({ moduleId, exam, onCreated, onUpdated, onCancel }) => {
  const [name, setName] = useState(exam?.name || "");
  // Default to "Final" or your preferred default from the enum
  const [examType, setExamType] = useState(exam?.exam_type || "Final");
  const [dueDate, setDueDate] = useState(exam?.due_date || "");
  const [weight, setWeight] = useState(exam?.weight || 10);
  const [loading, setLoading] = useState(false);

  const isEdit = !!exam;

  const handleSubmit = async () => {
    if (!name || !dueDate) return;

    setLoading(true);

    try {
      if (isEdit) {
        await onUpdated({
          id: exam.id,
          name,
          exam_type: examType,
          due_date: dueDate,
          weight: parseInt(weight),
        });
      } else {
        await onCreated({
          name,
          exam_type: examType,
          due_date: dueDate,
          weight: parseInt(weight),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-6 grid grid-cols-4 gap-4 border border-gray-100">
      <input
        type="text"
        placeholder="Exam name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="col-span-2 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
      />

      {/* Changed from input to select */}
      <select
        value={examType}
        onChange={(e) => setExamType(e.target.value)}
        className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
      >
        <option value="Final">Final</option>
        <option value="Midterm">Midterm</option>
        <option value="Quiz">Quiz</option>
        <option value="Assignment">Assignment</option>
        <option value="Presentation">Presentation</option>
        <option value="Other">Other</option>
      </select>

      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
      />

      <div className="col-span-4 flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500">Weight (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Weight %"
          className="w-24 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
        <span className="text-xs text-gray-400 italic">Determines "Crunch Mode" intensity</span>
        
        <div className="flex-1 flex justify-end gap-2">
          <button
            onClick={onCancel}
            type="button"
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm transition disabled:opacity-50"
          >
            {loading ? "Saving..." : isEdit ? "Update Exam" : "Save Exam"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamForm;