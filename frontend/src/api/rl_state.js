import axiosClient from "./axiosClient";
// TODO Area 2 follow-up: RL routers still use path param user_id
// These will be updated when RL routers get proper auth dependency
// For now the token in the header identifies the user on other endpoints
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