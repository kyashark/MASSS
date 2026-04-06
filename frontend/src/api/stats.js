import axiosClient from "./axiosClient";

export const fetchDashboardStats = async () => {
  const res = await axiosClient.get("/stats/dashboard-summary");
  return res.data;
};