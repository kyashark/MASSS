import React, { useState, useEffect } from "react";

const ExamForm = ({ moduleId, exam, onCreated, onUpdated, onCancel }) => {
  const [name, setName] = useState(exam?.name || "");
  const [examType, setExamType] = useState(exam?.exam_type || "MID");
  const [dueDate, setDueDate] = useState(exam?.due_date || "");
  const [loading, setLoading] = useState(false);

  const isEdit = !!exam;

  const handleSubmit = async () => {
    if (!name || !dueDate) return;

    setLoading(true);

    try {
      if (isEdit) {
        const updated = await onUpdated({ id: exam.id, name, exam_type: examType, due_date: dueDate });
      } else {
        const created = await onCreated({ name, exam_type: examType, due_date: dueDate });
      }
    } catch (err) {
      console.error(err);
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
        placeholder="Exam type (e.g., MID, FINAL, QUIZ)"
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
        <button onClick={onCancel} className="px-4 py-2 border rounded-lg text-sm">
          Cancel
        </button>

        <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
          {loading ? "Saving..." : isEdit ? "Update Exam" : "Save Exam"}
        </button>
      </div>
    </div>
  );
};

export default ExamForm;
