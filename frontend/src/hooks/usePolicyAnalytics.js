// src/hooks/usePolicyAnalytics.js

import { useCallback, useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

const USER_ID    = 1;
const POLL_EVERY = 30_000;   // 30s — policy data is slow moving

export function usePolicyAnalytics(activeSlot = "morning") {
  const [data,   setData]   = useState(null);
  const [status, setStatus] = useState("loading");

  const fetch = useCallback(async () => {
    try {
      const res = await axiosClient.get(
        `/rl/policy/${USER_ID}?active_slot=${activeSlot}`
      );
      setData(res.data);
      setStatus("live");
    } catch {
      setStatus("error");
    }
  }, [activeSlot]);

  useEffect(() => {
    setStatus("loading");
    fetch();
  }, [activeSlot]);

  useEffect(() => {
    const id = setInterval(fetch, POLL_EVERY);
    return () => clearInterval(id);
  }, [fetch]);

  return { data, status, refetch: fetch };
}