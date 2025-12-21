import axiosClient from "./axiosClient";

export const createModule = async (moduleData) => {
  const res = await axiosClient.post("/modules/", moduleData);
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
