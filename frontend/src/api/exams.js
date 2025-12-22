import axiosClient from "./axiosClient";

export const fetchExamsByModule = async (moduleId) => {
  const response = await axiosClient.get(`/exams/?module_id=${moduleId}`);
  return response.data;
};

export const createExam = async (moduleId, data) => {
  const payload = {
    name: data.name,
    exam_type: data.exam_type,
    due_date: data.due_date,
  };

  const response = await axiosClient.post(
    `/exams/module/${moduleId}`,
    payload
  );

  return response.data;
};