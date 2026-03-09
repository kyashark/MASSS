import React, { useEffect, useRef, useState } from "react";
import { useStateVector } from "../../hooks/useStateVector";

const SLOTS = ["Morning", "Afternoon", "Evening"];
const SLOT_META = {
  Morning:   { icon: "☀️", hours: "06:00–12:00" },
  Afternoon: { icon: "🌤️", hours: "12:00–18:00" },
  Evening:   { icon: "🌙", hours: "18:00–24:00" },
};

// Helper Functions for Dynamic Coloring
const fatigueColor = (f) =>
  f == null ? "text-slate-400" : f < 0.4 ? "text-emerald-500" : f < 0.7 ? "text-amber-500" : "text-red-500";

const fatigueBg = (f) =>
  f == null ? "bg-slate-400" : f < 0.4 ? "bg-emerald-500" : f < 0.7 ? "bg-amber-500" : "bg-red-500";

// ── Sub-Components ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, decimals = 2, suffix = "" }) {
  const [display, setDisplay] = useState(value ?? 0);
  const prev = useRef(value ?? 0);
  useEffect(() => {
    if (value == null) return;
    const start = prev.current, end = value, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / 750, 1);
      setDisplay(start + (end - start) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = end;
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{display.toFixed(decimals)}{suffix}</span>;
}

function Bar({ value, colorClass, h = "h-[7px]", customGrad = false }) {
  const [w, setW] = useState(0);
  useEffect(() => { 
    const id = setTimeout(() => setW((value ?? 0) * 100), 80); 
    return () => clearTimeout(id); 
  }, [value]);

  return (
    <div className={`${h} w-full rounded-full bg-slate-100 overflow-hidden`}>
      <div 
        className={`h-full rounded-full transition-all duration-[850ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${!customGrad ? colorClass : ""}`}
        style={{ 
            width: `${w}%`, 
            background: customGrad ? "linear-gradient(90deg, #3B82F6, #8B5CF6)" : undefined,
            boxShadow: !customGrad ? '0 0 9px rgba(0,0,0,0.05)' : 'none'
        }}
      />
    </div>
  );
}

function FocusHistory({ history }) {
  if (!history?.length) return null;
  return (
    <div className="mt-4">
      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-2">
        SLIDING WINDOW · W_t = e^(−0.5·Δt)
      </div>
      <div className="flex gap-[5px] items-end h-[42px]">
        {history.map((r, i) => {
          const isNewest = i === history.length - 1;
          const decay = Math.exp(-0.5 * (history.length - 1 - i));
          const colClass = r >= 4 ? "bg-emerald-500 text-emerald-500" : r >= 3 ? "bg-amber-500 text-amber-500" : "bg-red-500 text-red-500";
          return (
            <div key={i} className="flex flex-col items-center gap-[2px]">
              <span className={`text-[8px] font-mono ${colClass.split(' ')[1]} ${isNewest ? 'opacity-100' : 'opacity-60'}`}>
                {r.toFixed(1)}
              </span>
              <div 
                className={`rounded-[3px] transition-all duration-500 ${colClass.split(' ')[0]} ${isNewest ? 'w-[11px] shadow-[0_0_7px_rgba(16,185,129,0.4)]' : 'w-[8px]'}`}
                style={{ 
                    height: `${Math.max(4, Math.round((r / 5) * 30))}px`,
                    opacity: Math.max(0.2, decay)
                }} 
              />
            </div>
          );
        })}
        <span className="text-[8px] font-mono text-slate-300 ml-1 self-center">← newest</span>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function StateVectorCard({ initialSlot, onSlotChange }) {
  const { data, activeSlot, status, lastUpdate, prevFatigue, switchSlot } = useStateVector(initialSlot);

  function handleSlotSwitch(slot) { 
    switchSlot(slot); 
    onSlotChange?.(slot); 
  }

  const fatigue = data?.cognitive_fatigue ?? 0;
  const fTextClass = fatigueColor(fatigue);
  const fBgClass = fatigueBg(fatigue);
  const cogLabel = data?.cognitive_label ?? "—";
  const workload = data?.workload_intensity ?? 0;
  const trend = data?.trend ?? "Neutral";
  const slotFatigue = data?.slot_fatigue ?? {};
  const isLive = data?.is_live_slot;
  const delta = prevFatigue != null ? fatigue - prevFatigue : null;

  return (
    <div className="relative">
      {/* Global Fonts and Keyframes remain in style tag as Tailwind doesn't handle them natively without config */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        @keyframes sv-live  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes sv-in    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes sv-delta { 0%{transform:scale(0.7);opacity:0} 60%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
        .animate-sv-in { animation: sv-in 0.45s ease both; }
        .animate-sv-live { animation: sv-live 2s infinite; }
        .animate-sv-delta { animation: sv-delta 0.4s ease both; }
      `}</style>

      <div className="animate-sv-in bg-blue-200 border border-slate-200 rounded-[14px] p-5 pb-4 w-full max-w-[320px] shadow-sm font-['DM_Sans'] text-slate-800">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-slate-400 text-[10px] font-semibold mb-1 uppercase tracking-tighter">What AI Sees</div>
            <div className="text-amber-500 text-[9px] font-mono font-bold tracking-[2px] mb-1 uppercase">Current State Vector</div>
            <div className="flex items-center gap-[6px]">
              <div className="font-['Syne'] text-[15px] font-extrabold tracking-tight">{activeSlot}</div>
              {isLive && (
                <span className="animate-sv-live text-[7px] text-emerald-500 border border-emerald-100 px-1 py-[1px] rounded-[4px] bg-emerald-50/30 font-bold uppercase">
                  Active Influence
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-[3px]">
            <div className="flex items-center gap-[5px]">
              <div className={`w-[6px] h-[6px] rounded-full ${
                status === "live" ? "bg-emerald-500 shadow-[0_0_7px_#10B981] animate-sv-live" : 
                status === "error" ? "bg-red-500" : "bg-amber-500"
              }`} />
              <span className="text-[9px] font-mono text-slate-400">
                {status === "live" ? "live" : status === "error" ? "offline" : "connecting…"}
              </span>
            </div>
            {lastUpdate && <span className="text-[8px] font-mono text-slate-400">{lastUpdate.toLocaleTimeString()}</span>}
          </div>
        </div>

        {/* Slot Switcher */}
        <div className="flex gap-[6px] mb-[18px]">
          {SLOTS.map(slot => {
            const sf = slotFatigue[slot], active = activeSlot === slot, dcText = fatigueColor(sf);
            const dcBg = fatigueBg(sf);
            return (
              <button 
                key={slot} 
                onClick={() => handleSlotSwitch(slot)} 
                className={`flex-1 p-[9px_4px_8px] rounded-[9px] border transition-all duration-200 hover:-translate-y-[1px] ${
                  active ? 'bg-amber-50 border-amber-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-[16px] mb-[2px]">{SLOT_META[slot].icon}</div>
                <div className={`text-[9px] font-mono ${active ? 'text-amber-500 font-bold' : 'text-slate-500'}`}>{slot}</div>
                <div className="text-[8px] font-mono text-slate-400 mb-[5px]">{SLOT_META[slot].hours}</div>
                <div className={`w-[6px] h-[6px] rounded-full mx-auto ${dcBg} ${active ? 'shadow-[0_0_7px_rgba(245,158,11,0.5)]' : 'opacity-30'}`} />
              </button>
            );
          })}
        </div>

        {/* dim_554: Cognitive Fatigue */}
        <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-[12px_14px] mb-3 transition-all duration-500">
          <div className="flex justify-between items-center mb-[10px]">
            <span className="text-[11px] text-slate-500">
                Cognitive Fatigue 
            </span>
            <div className="flex items-center gap-[7px]">
              {delta != null && Math.abs(delta) > 0.005 && (
                <span className="animate-sv-delta text-[9px] font-mono px-[6px] py-[1px] rounded-[4px] border border-opacity-30 flex items-center gap-1 ${
                    delta > 0 ? 'text-red-500 bg-red-50 border-red-500' : 'text-emerald-500 bg-emerald-50 border-emerald-500'
                }">
                  {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}
                </span>
              )}
              <span className={`text-[10px] font-mono px-2 py-[2px] rounded-[5px] border border-opacity-20 font-bold bg-opacity-10 ${fTextClass} ${fBgClass.replace('bg-', 'bg-opacity-10 border-')}`}>
                {cogLabel}
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-[6px] mb-[10px]">
            <span className={`font-['Syne'] text-[34px] font-extrabold leading-none transition-colors duration-500 ${fTextClass}`}>
              <AnimatedNumber value={fatigue} decimals={2} />
            </span>
            <span className="text-[11px] text-slate-400 font-mono">/ 1.00</span>
          </div>
          <Bar value={fatigue} colorClass={fBgClass} h="h-[8px]" />
        </div>

        {/* Post-Class Fatigue Banner — only renders when a class ended recently */}
        {data?.post_class_fatigue > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] mb-3"
            style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.20)" }}>
            <span style={{ fontSize: 13 }}>🎓</span>
            <div className="flex-1">
              <div className="text-[9px] font-mono text-red-400 tracking-widest uppercase font-bold">
                Post-Class Fatigue Active
              </div>
              <div className="text-[8px] font-mono text-slate-400 mt-[2px]">
                {data.class_event_name ?? "Recent class"}
                {" · "} Boosted by {(data.post_class_fatigue * 0.40 * 100).toFixed(0)}%
              </div>
            </div>
            <span className="text-[12px] font-mono text-red-400 font-bold">
              +{(data.post_class_fatigue * 0.40 * 100).toFixed(0)}%
            </span>
          </div>
        )}

        {/* dim_555: Academic Pressure */}
        <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-[12px_14px] mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-slate-500">
                Work Intensity
            </span>
            <span className="font-mono text-[14px] font-bold text-slate-800">
              <AnimatedNumber value={workload * 100} decimals={0} suffix="%" />
            </span>
          </div>
          <Bar value={workload} customGrad={true} h="h-[7px]" />
        </div>

        {/* Sliding Window History */}
        <FocusHistory history={data?.focus_history} />

        {/* Footer info */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex justify-between">
          {/* <span className="text-[8px] font-mono text-slate-400 uppercase tracking-tight">λ=0.5 · window=5 · context=true</span> */}
          <span className="text-[8px] font-mono text-slate-400 uppercase font-bold tracking-tight">
            {isLive ? "Real-time Tracking" : "Historical View"}
          </span>
        </div>
      </div>
    </div>
  );
}