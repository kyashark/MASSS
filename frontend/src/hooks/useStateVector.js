import { useState, useEffect, useCallback } from "react";
import { fetchStateVector } from "../api/rl_state";

const POLL_MS = 8000;

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

  // --- NEW: Step 11 - Slot Labels State ---
  const [slotLabels, setSlotLabels] = useState({
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
  });

  const fetchData = useCallback(async (slot) => {
    try {
      const res = await fetchStateVector(slot);
      const stateData = res.data;

      setData(prev => {
        if (prev?.cognitive_fatigue != null) setPrevFatigue(prev.cognitive_fatigue);
        return stateData;
      });

      // --- NEW: Step 11 - Update labels if they exist in the response ---
      if (stateData?.slot_labels) {
        setSlotLabels(stateData.slot_labels);
      }

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
    
    setData(prev => {
      if (!prev?.slot_fatigue?.[slot]) return prev;
      const f = prev.slot_fatigue[slot];
      setPrevFatigue(prev.cognitive_fatigue);
      return { ...prev, active_slot: slot, cognitive_fatigue: f };
    });
  }, [activeSlot]);

  // --- NEW: Return slotLabels for components to use ---
  return { 
    data, 
    activeSlot, 
    status, 
    lastUpdate, 
    prevFatigue, 
    switchSlot,
    slotLabels 
  };
}