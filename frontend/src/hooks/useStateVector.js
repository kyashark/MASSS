import { useState, useEffect, useCallback } from "react";
import { fetchStateVector } from "../api/rl_state";

const POLL_MS = 8000;

// Helper to match backend slot hours
const getCurrentSlot = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
};

export function useStateVector(initialSlot) {
  const [activeSlot, setActiveSlot] = useState(initialSlot || getCurrentSlot());
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [prevFatigue, setPrevFatigue] = useState(null);

  const fetchData = useCallback(async (slot) => {
    try {
      const res = await fetchStateVector(slot);
      setData(prev => {
        if (prev?.cognitive_fatigue != null) setPrevFatigue(prev.cognitive_fatigue);
        return res.data;
      });
      setStatus("live");
      setLastUpdate(new Date());
    } catch (err) {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchData(activeSlot);
    const id = setInterval(() => fetchData(activeSlot), POLL_MS);
    return () => clearInterval(id);
  }, [activeSlot, fetchData]);

  const switchSlot = useCallback((slot) => {
    if (slot === activeSlot) return;
    setActiveSlot(slot);
    // Instant UI update using cached values
    setData(prev => {
      if (!prev?.slot_fatigue?.[slot]) return prev;
      const f = prev.slot_fatigue[slot];
      setPrevFatigue(prev.cognitive_fatigue);
      return { ...prev, active_slot: slot, cognitive_fatigue: f };
    });
  }, [activeSlot]);

  return { data, activeSlot, status, lastUpdate, prevFatigue, switchSlot };
}