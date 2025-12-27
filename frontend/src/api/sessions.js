import axiosClient from "./axiosClient";

export const startSession = async (taskId) => {
  const response = await axiosClient.post(`/sessions/start`, { task_id: taskId });
  return response.data;
};

export const endSession = async (sessionId, data) => {
  // data = { is_completed: boolean, focus_rating: int }
  const response = await axiosClient.post(`/sessions/${sessionId}/end`, data);
  return response.data;
};