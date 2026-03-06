// src/hooks/useActionDistribution.js

import { useState, useEffect, useCallback } from "react";
import { fetchActionDistribution } from "../api/rl_state";

const POLL_MS = 8000;

/**
 * Hook for the Action Probability Distribution card.
 *
 * @param {string} activeSlot - "Morning" | "Afternoon" | "Evening"
 * @returns {{
 *   data:       object|null,
 *   prevData:   object|null,   <- previous fetch, used to show delta badges
 *   status:     "loading"|"live"|"error",
 *   lastUpdate: Date|null,
 *   refetch:    () => void,
 * }}
 */
export function useActionDistribution(activeSlot = "Morning") {
  const [data,       setData]       = useState(null);
  const [prevData,   setPrevData]   = useState(null);
  const [status,     setStatus]     = useState("loading");
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async (slot) => {
    try {
      const res = await fetchActionDistribution(slot);
      setData(prev => {
        if (prev) setPrevData(prev);
        return res.data;
      });
      setStatus("live");
      setLastUpdate(new Date());
    } catch (err) {
      console.error("[useActionDistribution] fetch failed:", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    setStatus("loading");
    fetchData(activeSlot);
    const id = setInterval(() => fetchData(activeSlot), POLL_MS);
    return () => clearInterval(id);
  }, [activeSlot, fetchData]);

  const refetch = useCallback(() => fetchData(activeSlot), [activeSlot, fetchData]);

  return { data, prevData, status, lastUpdate, refetch };
}