import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { fetchExamsByModule } from "../../api/exams.js";
import ExamForm from "../../components/ExamForm.jsx";

const Exams = ({ module }) => {
  const [exams, setExams] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!module?.id) return;

    fetchExamsByModule(module.id)
      .then(setExams)
      .catch(console.error);
  }, [module?.id]);

  const handleExamCreated = (exam) => {
    // 🔥 Optimistic UI update
    setExams((prev) => [exam, ...prev]);
    setShowForm(false);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Exams</h2>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm"
        >
          <Plus size={16} />
          Add Exam
        </button>
      </div>

      {/* Create Exam Form */}
      {showForm && (
        <ExamForm
          moduleId={module.id}
          onCreated={handleExamCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Exams List */}
      {exams.length === 0 ? (
        <div className="text-gray-500 text-sm">
          No exams added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-gray-900">{exam.name}</p>
                <p className="text-xs text-gray-500 uppercase">
                  {exam.type}
                </p>
              </div>

              <div className="text-sm text-gray-600">
                Due: {exam.due_date}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Exams;
