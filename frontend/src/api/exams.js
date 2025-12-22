import axiosClient from "./axiosClient";

// GET all exams by module
export const fetchExamsByModule = async (moduleId) => {
  const res = await axiosClient.get(`/exams/module/${moduleId}`);
  return res.data;
};

// CREATE exam
export const createExam = async (moduleId, data) => {
  const payload = {
    name: data.name,
    exam_type: data.exam_type,
    due_date: data.due_date,
  };
  const res = await axiosClient.post(`/exams/module/${moduleId}`, payload);
  return res.data;
};

// UPDATE exam
export const updateExam = async (examId, data) => {
  const payload = {
    name: data.name,
    exam_type: data.exam_type,
    due_date: data.due_date,
  };
  const res = await axiosClient.put(`/exams/${examId}`, payload);
  return res.data;
};

// DELETE exam
export const deleteExam = async (examId) => {
  await axiosClient.delete(`/exams/${examId}`);
};
