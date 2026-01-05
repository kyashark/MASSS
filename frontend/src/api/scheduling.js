import axiosClient from "./axiosClient";

// GET Heuristic Schedule
export const fetchHeuristicSchedule = async () => {
  const res = await axiosClient.get("/schedule/heuristic");
  return res.data;
};

// GET RL Agent Schedule
export const fetchRLSchedule = async () => {
  const res = await axiosClient.get("/schedule/rl");
  return res.data;
};

// --- NEW: GET Fixed Routine ---
export const fetchFixedRoutine = async () => {
  const res = await axiosClient.get("/profile/routine");
  return res.data;
};