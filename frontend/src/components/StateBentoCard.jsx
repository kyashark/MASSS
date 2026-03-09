import React, { useEffect, useState } from "react";

const getCurrentSlot = () => {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "Morning";
  if (h >= 12 && h < 18) return "Afternoon";
  return "Evening";
};

const SLOT_META = {
  Morning:   { icon: "☀️" },
  Afternoon: { icon: "🌤️" },
  Evening:   { icon: "🌙" },
};

const StateBentoCard = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const slot = getCurrentSlot();
  const slotMeta = SLOT_META[slot];

  return (
    <div className="w-full flex items-center justify-between p-5 bg-[#0f172a] rounded-[24px] text-[#e2e8f0]">
      
      {/* LEFT SIDE: Big Topic */}
      <div>
        <h1 className="m-0 text-[24px] font-[800] font-mono tracking-[-0.02em] text-[#f8fafc]">
          AI Scheduler Insight
        </h1>
      </div>

      {/* RIGHT SIDE: Clock & Date */}
      <div className="text-right">
        <div className="flex items-center justify-end gap-[6px] mb-1">
          <span className="text-[11px] font-mono text-[#94a3b8] uppercase tracking-[1px]">
            {slotMeta.icon} {slot}
          </span>
        </div>
        
        <div className="text-[28px] font-[700] font-mono">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}
        </div>
        
        <div className="text-[11px] font-mono text-[#475569] mt-[2px]">
          {now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>

    </div>
  );
};

export default StateBentoCard;