import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash } from "lucide-react";
import { fetchExamsByModule, createExam, updateExam, deleteExam } from "../../api/exams.js";
import ExamForm from "../../components/ExamForm.jsx";

const Exams = ({ module }) => {
  const [exams, setExams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const loadExams = async () => {
    try {
      const data = await fetchExamsByModule(module.id);
      setExams(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!module?.id) return;
    loadExams();
  }, [module?.id]);

  const handleExamCreated = async (examData) => {
    const created = await createExam(module.id, examData);
    setExams((prev) => [created, ...prev]);
    setShowForm(false);
  };

  const handleExamUpdated = async (examData) => {
    const updated = await updateExam(examData.id, examData);
    setExams((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setEditingExam(null);
    setShowForm(false);
  };

  const handleExamDelete = async (examId) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;
    await deleteExam(examId);
    setExams((prev) => prev.filter((e) => e.id !== examId));
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Exams</h2>
        <button
          onClick={() => {
            setEditingExam(null);
            setShowForm((v) => !v);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm"
        >
          <Plus size={16} />
          Add Exam
        </button>
      </div>

      {/* Exam Form */}
      {showForm && (
        <ExamForm
          moduleId={module.id}
          exam={editingExam}
          onCreated={handleExamCreated}
          onUpdated={handleExamUpdated}
          onCancel={() => {
            setShowForm(false);
            setEditingExam(null);
          }}
        />
      )}

      {/* Exams List */}
      {exams.length === 0 ? (
        <div className="text-gray-500 text-sm">No exams added yet.</div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{exam.name}</p>
                <p className="text-xs text-gray-500 uppercase">{exam.exam_type}</p>
              </div>

              <div className="flex gap-3 items-center">
                <span className="text-sm text-gray-600">Due: {exam.due_date}</span>
                <button
                  onClick={() => {
                    setEditingExam(exam);
                    setShowForm(true);
                  }}
                  className="text-blue-500"
                >
                  <Edit size={16} />
                </button>
                <button onClick={() => handleExamDelete(exam.id)} className="text-red-500">
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Exams;
