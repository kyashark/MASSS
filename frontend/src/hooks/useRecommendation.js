// src/hooks/useRecommendation.js
//
// Fetches the RL top recommendation for the active slot.
// No session state here — PomoSession owns all of that.

import { useCallback, useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

const USER_ID      = 1;
const POLL_EVERY   = 15_000;   // re-fetch every 15s (slot energy can shift)

export function useRecommendation(activeSlot = "morning") {
  const [rec,    setRec]    = useState(null);
  const [status, setStatus] = useState("loading");   // loading | live | error

  const fetch = useCallback(async () => {
    try {
      const res = await axiosClient.get(
        `/rl/bridge/recommend/${USER_ID}?active_slot=${activeSlot}`
      );
      setRec(res.data?.error ? null : res.data);
      setStatus("live");
    } catch {
      setStatus("error");
    }
  }, [activeSlot]);

  // initial fetch + re-fetch when slot changes
  useEffect(() => {
    setStatus("loading");
    fetch();
  }, [activeSlot]);

  // background polling
  useEffect(() => {
    const id = setInterval(fetch, POLL_EVERY);
    return () => clearInterval(id);
  }, [fetch]);

  return { rec, status, refetch: fetch };
}