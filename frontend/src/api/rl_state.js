// src/api/rlState.js
// Follows the same pattern as your other API files (tasks.js, sessions.js etc.)
// axiosClient already injects user_id=1 as query param automatically.
// NOTE: make sure your backend router is registered under /api prefix in main.py:
//   app.include_router(rl_router, prefix="/api")

import axiosClient from "./axiosClient";

/**
 * Fetches the RL state vector for the dashboard card.
 * @param {string} activeSlot - "Morning" | "Afternoon" | "Evening"
 * @returns {Promise<StateVectorResponse>}
 *
 * Response shape:
 * {
 *   cognitive_fatigue:  0.32,
 *   cognitive_label:    "FRESH",
 *   slot_fatigue:       { Morning: 0.32, Afternoon: 0.48, Evening: 0.61 },
 *   workload_intensity: 0.71,
 *   focus_history:      [3.0, 4.0, 5.0, 4.0, 1.0],
 *   energy_battery:     { Morning: {score:0.78, label:"HIGH"}, ... },
 *   category_strengths: { Coding: 0.75, Math: 0.60 },
 *   trend:              "Positive",
 *   active_slot:        "Morning"
 * }
 */
export const fetchStateVector = (activeSlot = "Morning") => {
  // user_id goes in the PATH (matches backend: /state-vector/{user_id})
  // axiosClient interceptor adds user_id as query param — we don't need that here,
  // so we read the same TEMP value directly.
  const userId = 1; // TEMP — replace with auth token user id when auth is ready
  return axiosClient.get(`/rl/state-vector/${userId}`, {
    params: { active_slot: activeSlot },
  });
};