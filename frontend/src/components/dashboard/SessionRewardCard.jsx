// src/components/SessionRewardCard/SessionRewardCard.jsx

import { useEffect, useRef, useState } from "react";
import { useSessionReward } from "../../hooks/useSessionReward";

const PRIORITY_COLOR = { HIGH: "text-red-400", MEDIUM: "text-amber-400", LOW: "text-slate-400" };
const DIFF_LABEL = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"];
const DIFF_COLOR = ["", "text-emerald-400", "text-emerald-400", "text-amber-400", "text-orange-500", "text-red-400"];

const END_TYPE_META = {
  COMPLETED: { label: "COMPLETED", color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", icon: "✓" },
  STOPPED:   { label: "STOPPED",   color: "text-amber-500",  bg: "bg-amber-50",   border: "border-amber-200",   icon: "⏸" },
  ABORTED:   { label: "ABORTED",   color: "text-red-500",    bg: "bg-red-50",     border: "border-red-200",     icon: "✕" },
  SKIPPED:   { label: "SKIPPED",   color: "text-slate-400",  bg: "bg-slate-50",   border: "border-slate-200",   icon: "⏭" },
};

const COMPONENT_META = {
  slot_energy_bonus: { label: "Slot Energy Bonus", step: "step 3", color: "bg-emerald-400", text: "text-emerald-600", max: 1.5 },
  focus_reward:      { label: "Focus Reward",      step: "step 4", color: "bg-violet-400",  text: "text-violet-600",  max: 10.0 },
  completion_bonus:  { label: "Completion Bonus",  step: "step 6", color: "bg-amber-500",   text: "text-amber-600",   max: 15.0 },
  deadline_bonus:    { label: "Deadline Bonus",    step: "step 7a",color: "bg-orange-500",  text: "text-orange-600",  max: 7.5 },
  momentum_bonus:    { label: "Momentum Bonus",    step: "step 8", color: "bg-sky-400",     text: "text-sky-600",     max: 5.0 },
  fatigue_penalty:   { label: "Fatigue Penalty",   step: "step 5", color: "bg-red-400",     text: "text-red-600",     max: 2.0, negative: true },
  delay_penalty:     { label: "Delay Penalty",     step: "step 7b",color: "bg-red-400",     text: "text-red-600",     max: 10.0, negative: true },
};

// --- Helpers ---

function AnimNum({ value, decimals = 2, suffix = "" }) {
  const [d, setD] = useState(value ?? 0);
  const prev = useRef(value ?? 0);
  useEffect(() => {
    if (value == null) return;
    const s = prev.current, e = value, t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / 700, 1);
      setD(s + (e - s) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = e;
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{d.toFixed(decimals)}{suffix}</span>;
}

function AnimBar({ value, max, color, negative = false, delay = 0 }) {
  const pct = Math.min((Math.abs(value) / max) * 100, 100);
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setW(pct), 100 + delay);
    return () => clearTimeout(id);
  }, [pct, delay]);

  return (
    <div className="h-[5px] rounded-full bg-slate-100 overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-700 ease-out ${color} ${negative ? 'opacity-80' : ''}`}
        style={{ width: `${w}%`, transitionDelay: `${delay}ms` }}
      />
    </div>
  );
}

function RewardRow({ compKey, value, delay }) {
  const meta = COMPONENT_META[compKey];
  if (!meta) return null;
  const alwaysOn = ["slot_energy_bonus", "focus_reward"];
  if (value === 0 && !alwaysOn.includes(compKey)) return null;

  const isNeg = meta.negative || value < 0;
  const sign = value >= 0 ? "+" : "";

  return (
    <div className="mb-2.5 animate-ap-slide" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex justify-between items-start mb-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-semibold text-slate-600 uppercase tracking-tighter">{meta.label}</span>
            <span className="text-[8px] font-mono text-slate-400 bg-slate-50 px-1 border border-slate-100 rounded">{meta.step}</span>
          </div>
        </div>
        <span className={`font-['Syne'] text-[13px] font-extrabold ${isNeg ? 'text-red-500' : meta.text}`}>
          {sign}<AnimNum value={value} decimals={2} />
        </span>
      </div>
      <AnimBar value={value} max={meta.max} color={meta.color} negative={isNeg} delay={delay} />
    </div>
  );
}

function FocusDots({ rating }) {
  const filled = Math.round(rating ?? 0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${
          i <= filled 
            ? (filled >= 4 ? "bg-emerald-400" : filled >= 3 ? "bg-amber-400" : "bg-red-400")
            : "bg-slate-200"
        }`} />
      ))}
    </div>
  );
}

// --- Main Component ---

export default function SessionRewardCard() {
  const { data, prevData, status, lastUpdate } = useSessionReward();

  const bd = data?.reward_breakdown ?? {};
  const isCrunch = data?.is_crunch ?? false;
  const endMeta = END_TYPE_META[data?.end_type] ?? END_TYPE_META.COMPLETED;
  const isNew = prevData && prevData.session_id !== data?.session_id;
  const total = bd.total ?? 0;

  const totalColorClass = total >= 15 ? "text-emerald-500" : total >= 5 ? "text-amber-500" : "text-red-500";
  const totalBgClass = total >= 15 ? "bg-emerald-50 border-emerald-100" : total >= 5 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100";

  return (
    <div className="relative font-['DM_Sans']">
      <style>{`
        @keyframes ap-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes ap-slide { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
        @keyframes ap-pop { 0%{transform:scale(0.9);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes ap-live { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <div className={`animate-ap-in bg-emerald-100 border rounded-[14px] p-5 pb-4 w-full max-w-[380px] shadow-sm text-slate-800 ${isCrunch ? 'border-red-200' : 'border-slate-200'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[9px] font-mono font-bold tracking-[2px] text-emerald-500 mb-1 uppercase">AI SESSION REWARD</div>
            <div className="font-['Syne'] text-[15px] font-extrabold tracking-tight">Reward Breakdown · r(s,a)</div>
            <div className="text-[9px] font-mono text-slate-400 mt-[3px]">Mapped to reward.py · live engine</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${status === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-[9px] font-mono text-slate-400 uppercase">{status === 'live' ? 'live' : 'offline'}</span>
            </div>
            {lastUpdate && <span className="text-[8px] font-mono text-slate-300">{lastUpdate.toLocaleTimeString()}</span>}
          </div>
        </div>

        {isNew && (
          <div className="mb-3 p-2 bg-emerald-50 border border-emerald-100 rounded-lg animate-bounce text-center">
            <span className="text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-widest">↻ New Session Feedback Detected</span>
          </div>
        )}

        {!data?.session_id && status !== "loading" ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
            <p className="text-slate-400 text-[11px] font-mono">Waiting for session data...</p>
          </div>
        ) : (
          <>
            {/* Task Info Area */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl mb-4">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate-800 truncate mb-1.5">{data?.task_name}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[8px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 uppercase font-bold">{data?.module}</span>
                    <span className={`text-[8px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded uppercase font-bold ${PRIORITY_COLOR[data?.priority]}`}>{data?.priority}</span>
                  </div>
                </div>
                <div className={`flex flex-col items-center p-2 rounded-lg border ${endMeta.bg} ${endMeta.border} min-w-[70px] shadow-sm`}>
                  <span className={`text-sm font-bold ${endMeta.color}`}>{endMeta.icon}</span>
                  <span className={`text-[8px] font-mono font-black tracking-tighter ${endMeta.color}`}>{endMeta.label}</span>
                </div>
              </div>

              {/* Mini Stats Grid */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/50">
                {[
                  { l: 'SLOT', v: data?.slot },
                  { l: 'TIME', v: `${data?.duration_minutes}m` },
                  { l: 'FOCUS', v: <FocusDots rating={data?.focus_rating}/> },
                  { l: 'PROG', v: `${data?.sessions_done}/${data?.sessions_estimated}` }
                ].map((s, i) => (
                  <div key={i}>
                    <div className="text-[7px] font-mono text-slate-400 mb-0.5">{s.l}</div>
                    <div className="text-[9px] font-bold text-slate-600">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Crunch Mode Alert */}
            {isCrunch && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 animate-pulse">
                <span className="text-base">🔥</span>
                <div>
                  <div className="text-[9px] font-mono font-bold text-red-600 tracking-wider">CRUNCH MODE ACTIVE</div>
                  <div className="text-[8px] text-red-400">Urgency Multiplier ×{data?.urgency_multiplier?.toFixed(1)} Applied</div>
                </div>
              </div>
            )}

            {/* Total Reward Large Display */}
            <div className={`p-4 rounded-xl border flex justify-between items-center mb-5 ${totalBgClass} shadow-inner`}>
              <div>
                <div className="text-[9px] font-mono font-bold text-slate-500 tracking-[1px]">TOTAL REWARD · r(s,a)</div>
                <div className="text-[8px] text-slate-400 italic">Cumulative session signal</div>
              </div>
              <div className={`font-['Syne'] text-[32px] font-extrabold ${totalColorClass}`}>
                <AnimNum value={total} />
              </div>
            </div>

            {/* Components Breakdown */}
            <div className="space-y-1">
              <div className="text-[8px] font-mono text-slate-400 font-bold uppercase tracking-widest mb-3 italic">Active Reward Components</div>
              {["slot_energy_bonus", "focus_reward", "completion_bonus", "deadline_bonus", "momentum_bonus"].map((k, i) => (
                <RewardRow key={k} compKey={k} value={bd[k] ?? 0} delay={i * 60} />
              ))}

              {/* Active Penalties */}
              {(bd.fatigue_penalty !== 0 || bd.delay_penalty !== 0) && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[8px] font-mono text-red-400 font-bold uppercase mb-2">Active Penalties</div>
                  {["fatigue_penalty", "delay_penalty"].map((k, i) => (
                    <RewardRow key={k} compKey={k} value={bd[k] ?? 0} delay={i * 60} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer Weights */}
            {/* <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
              <span className="text-[7px] font-mono text-slate-400 uppercase tracking-tight font-medium">
                W_COMP(10) · W_FOCUS(2) · SLOT(1.5) · W_DELAY(1)
              </span>
              <span className="text-[7px] font-mono text-slate-300 font-bold">POLL 10S</span>
            </div> */}
          </>
        )}
      </div>
    </div>
  );
}