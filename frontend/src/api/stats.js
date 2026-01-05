import axiosClient from "./axiosClient";

// GET dashboard stats (Energy Battery, Pulse, etc.)
export const fetchDashboardStats = async () => {
  const res = await axiosClient.get("/dashboard/stats");
  return res.data;
};