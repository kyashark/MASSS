import axiosClient from "./axiosClient";

// Temporary user ID — will be replaced when real auth is added in Phase 1 Area 2
const TEMP_USER_ID = 1;

export const fetchStateVector = async (activeSlot = "Morning") => {
  const res = await axiosClient.get(`/rl/state-vector/${TEMP_USER_ID}`, {
    params: { active_slot: activeSlot },
  });
  return res.data;
};

export const fetchActionDistribution = async (
  activeSlot = "Morning",
  userId = TEMP_USER_ID
) => {
  const res = await axiosClient.get(`/rl/action-distribution/${userId}`, {
    params: { active_slot: activeSlot },
  });
  return res.data;
};