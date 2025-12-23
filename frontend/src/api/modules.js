import axiosClient from "./axiosClient";

export const createModule = async (moduleData) => {
  const payload = {
    name: moduleData.name,
    category: moduleData.category,
    color: moduleData.color,
    priority: moduleData.priority,
    difficulty: moduleData.difficulty,
    energy_time: moduleData.energyTime,
    exams: (moduleData.exams || []).map((exam) => ({
      name: exam.name,
      exam_type: exam.type,
      due_date: exam.dueDate,
    })),
  };

  const res = await axiosClient.post("/modules/", payload);
  return res.data;
};

export const createExam = async (examData) => {
  const res = await axiosClient.post("/exams/", examData);
  return res.data;
};

export const fetchModules = async () => {
  const res = await axiosClient.get("/modules/");
  return res.data;
};

export const updateModule = async (moduleId, moduleData) => {
  const payload = {
    name: moduleData.name,
    category: moduleData.category,
    color: moduleData.color,
    priority: moduleData.priority,
    difficulty: moduleData.difficulty,
    energy_time: moduleData.energyTime,
  };

  const res = await axiosClient.put(`/modules/${moduleId}`, payload);
  return res.data;
};

export const deleteModule = async (moduleId) => {
  const res = await axiosClient.delete(`/modules/${moduleId}`);
  return res.data;
};
