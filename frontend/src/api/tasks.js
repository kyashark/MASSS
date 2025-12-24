import axiosClient from "./axiosClient";

export const fetchTasks = async (moduleId) => {
  const response = await axiosClient.get(`/tasks/?module_id=${moduleId}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await axiosClient.post(`/tasks/`, taskData);
  return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await axiosClient.patch(`/tasks/${taskId}`, { status });
  return response.data;
};