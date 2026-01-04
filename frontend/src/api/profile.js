import axiosClient from "./axiosClient";

// --- ROUTINE ENDPOINTS ---

// GET: Fetch all routine events
export const fetchRoutine = async () => {
  const res = await axiosClient.get("/profile/routine");
  return res.data;
};

// POST: Add new routine event(s)
export const addRoutineEvent = async (payload) => {
  const res = await axiosClient.post("/profile/routine", payload);
  return res.data;
};

// PUT: Update an existing event
export const updateRoutineEvent = async (id, payload) => {
  const res = await axiosClient.put(`/profile/routine/${id}`, payload);
  return res.data;
};

// DELETE: Remove an event
export const deleteRoutineEvent = async (id) => {
  const res = await axiosClient.delete(`/profile/routine/${id}`);
  return res.data;
};

// --- PREFERENCE ENDPOINTS ---

// GET: Fetch energy preferences
export const fetchPreferences = async () => {
  const res = await axiosClient.get("/profile/preferences");
  return res.data;
};

// POST: Upsert (Update or Create) a preference
export const updatePreference = async (payload) => {
  const res = await axiosClient.post("/profile/preferences", payload);
  return res.data;
};