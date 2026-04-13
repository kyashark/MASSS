import axiosClient from "./axiosClient";

// user_id is no longer in the URL
// The backend reads it from the JWT token automatically
export const fetchStateVector = async (activeSlot = "morning") => {   // ← lowercase
  const res = await axiosClient.get(`/rl/state-vector`, {
    params: { active_slot: activeSlot },
  });
  return res.data;
};

export const fetchActionDistribution = async (activeSlot = "morning") => {
  const res = await axiosClient.get(`/rl/action-distribution`, {
    params: { active_slot: activeSlot },
  });
  return res.data;
};