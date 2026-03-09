// src/hooks/useSessionReward.js

import { useEffect, useRef, useState } from "react";
import axiosClient from "../api/axiosClient";

const POLL_MS  = 10_000;   // sessions complete infrequently — 10s is enough
const USER_ID  = 1;

export function useSessionReward() {
  const [data,     setData]     = useState(null);
  const [prevData, setPrevData] = useState(null);
  const [status,   setStatus]   = useState("loading");   // loading | live | error
  const [lastUpdate, setLastUpdate] = useState(null);
  const timerRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await axiosClient.get(`/rl/session/${USER_ID}`);
      const next = res.data;

      // Only count as "new session" if session_id changed
      setData(prev => {
        if (prev && prev.session_id !== next.session_id) {
          setPrevData(prev);
        }
        return next;
      });

      setStatus("live");
      setLastUpdate(new Date());
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  return { data, prevData, status, lastUpdate };
}