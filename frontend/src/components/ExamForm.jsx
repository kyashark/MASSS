import React, { useState } from "react";
import { createExam } from "../api/exams.js";

const ExamForm = ({ moduleId, onCreated, onCancel }) => {
  const [name, setName] = useState("");
  const [examType, setExamType] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !dueDate) return;

    try {
      setLoading(true);

      const createdExam = await createExam(moduleId, {
        name: name,
        exam_type: examType,   
        due_date: dueDate,     
      });

      // Optimistic UI update
      onCreated(createdExam);

      setName("");
      setDueDate("");
    } catch (error) {
      console.error("Failed to create exam", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-6 grid grid-cols-4 gap-4">
      <input
        type="text"
        placeholder="Exam name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="col-span-2 px-3 py-2 border rounded-lg text-sm"
      />
<input
  type="text"
  placeholder="Exam type (e.g. Mid, Final, Quiz)"
  value={examType}
  onChange={(e) => setExamType(e.target.value)}
  className="px-3 py-2 border rounded-lg text-sm"
/>

      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="px-3 py-2 border rounded-lg text-sm"
      />

      <div className="col-span-4 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg text-sm"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-gray-800 hover:bg-slate-900 text-white rounded-lg text-sm"
        >
          {loading ? "Saving..." : "Save Exam"}
        </button>
      </div>
    </div>
  );
};

export default ExamForm;
