// api/sessions.js

import axiosClient from "./axiosClient";

export const startSession = async (taskId) => {
  const response = await axiosClient.post(`/sessions/start`, { task_id: taskId });
  return response.data;
};

export const endSession = async (sessionId, data) => {
  // data = { end_type: "COMPLETED|STOPPED|ABORTED", focus_rating?: int, extra_sessions?: int }
  const response = await axiosClient.post(`/sessions/${sessionId}/end`, data);
  return response.data;
};

// 3. GET RECENT SESSIONS (New)
export const getRecentSessions = async (skip = 0, limit = 20) => {
  // We use 'params' to automatically format the query string: ?skip=0&limit=20
  const response = await axiosClient.get(`/sessions/`, {
    params: { skip, limit }
  });
  return response.data;
};