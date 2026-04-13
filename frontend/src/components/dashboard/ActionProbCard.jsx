// src/components/ActionProbCard/ActionProbCard.jsx

import { useEffect, useRef, useState } from "react";
import { useActionDistribution } from "../../hooks/useActionDistribution";
import { SLOT_LABELS } from "../../constants/enums";

const PRIORITY_COLOR = { high: "text-red-500", medium: "text-amber-500", low: "text-slate-400" };
const DIFF_LABEL     = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"];
const DIFF_COLOR     = ["", "text-emerald-500", "text-emerald-500", "text-amber-500", "text-orange-500", "text-red-500"];

const SIGNAL_META = {
  completion_proximity: { label: "Completion Proximity", desc: "W_COMPLETION=10.0", color: "bg-amber-500", text: "text-amber-600" },
  slot_bias: { label: "Slot Energy Bias", desc: "W_FOCUS=2.0", color: "bg-emerald-500", text: "text-emerald-600" },
  momentum: { label: "Task Momentum", desc: "IN_PROGRESS +5.0", color: "bg-violet-500", text: "text-violet-600" },
  urgency: { label: "Deadline Urgency", desc: "W_DELAY=1.0", color: "bg-orange-500", text: "text-orange-600" },
  category_bias: { label: "Category Bias", desc: "Learned Rate", color: "bg-sky-500", text: "text-sky-600" },
};

function AnimNum({ value, decimals = 0, suffix = "" }) {
  const [d, setD] = useState(value ?? 0);
  const prev = useRef(value ?? 0);
  useEffect(() => {
    if (value == null) return;
    const s = prev.current, e = value, t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / 650, 1);
      setD(s + (e - s) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = e;
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{d.toFixed(decimals)}{suffix}</span>;
}

function AnimBar({ value, colorClass, h = "h-1.5", delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setW(value), 80 + delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return (
    <div className={`${h} rounded-full bg-slate-100 overflow-hidden`}>
      <div 
        className={`h-full rounded-full ${colorClass} transition-all duration-700 ease-out`}
        style={{ width: `${w}%`, transitionDelay: `${delay}ms` }} 
      />
    </div>
  );
}

function DeltaBadge({ curr, prev }) {
  if (prev == null) return null;
  const d = curr - prev;
  if (Math.abs(d) < 1) return null;
  const isPos = d > 0;
  return (
    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border animate-[ap-pop_0.35s_ease_both] ${
      isPos ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-red-600 bg-red-50 border-red-200"
    }`}>
      {isPos ? "▲" : "▼"}{Math.abs(d)}%
    </span>
  );
}

function SignalRow({ sigKey, value, delay }) {
  const meta = SIGNAL_META[sigKey];
  if (!meta) return null;
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between items-end mb-1">
        <div>
          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tighter">{meta.label}</span>
          <span className="text-[7px] font-mono text-slate-300 ml-2 uppercase italic">{meta.desc}</span>
        </div>
        <span className={`text-[10px] font-mono font-black ${meta.text}`}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <AnimBar value={value * 100} colorClass={meta.color} h="h-1" delay={delay} />
    </div>
  );
}

function ActionRow({ action, prevAction, expanded, onToggle, index }) {
  const pColor = PRIORITY_COLOR[action.priority] || "text-slate-400";
  const dColor = DIFF_COLOR[action.difficulty] || "text-slate-400";
  const dLabel = DIFF_LABEL[action.difficulty] || "—";
  const barClass = action.is_selected ? "bg-amber-500" : (action.probability >= 25 ? "bg-slate-400" : "bg-slate-200");
  const isMomentum = action.signals?.momentum >= 1.0;

  return (
    <div className="mb-2 last:mb-0 animate-[ap-slide_0.4s_ease_both]" style={{ animationDelay: `${index * 55}ms` }}>
      <div 
        onClick={onToggle} 
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
          action.is_selected ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
        }`}
      >
        <div className={`min-w-[42px] text-center py-1 rounded-lg border font-['Syne'] font-black text-sm ${
          action.is_selected ? "bg-white border-amber-300 text-amber-500" : "bg-slate-50 border-slate-100 text-slate-400"
        }`}>
          <AnimNum value={action.probability} decimals={0} suffix="%" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[140px] uppercase tracking-tight">
              {action.task_name}
            </span>
            {action.is_selected && (
              <span className="text-[7px] font-mono font-black bg-amber-500 text-white px-1.5 py-0.5 rounded shadow-sm animate-[ap-pop_0.4s_ease_both]">
                SELECTED
              </span>
            )}
            {isMomentum && (
              <span className="text-[7px] font-mono font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded border border-violet-200 uppercase">
                Momentum
              </span>
            )}
            <DeltaBadge curr={action.probability} prev={prevAction?.probability} />
          </div>
          <AnimBar value={action.probability} colorClass={barClass} delay={index * 55} />
        </div>

        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className={`text-[8px] font-mono font-black uppercase ${pColor}`}>{action.priority}</span>
          <span className={`text-[8px] font-mono font-bold uppercase ${dColor}`}>{dLabel}</span>
          <span className="text-[8px] text-slate-300 mt-0.5">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="mx-1 p-4 bg-slate-50 border-x border-b border-slate-100 rounded-b-xl animate-[ap-expand_0.25s_ease_both] shadow-inner">
          <div className="text-[8px] font-mono font-black text-amber-500 tracking-widest mb-4 uppercase italic">
            Neural Signal Weighting · π(a|s)
          </div>
          <div className="space-y-3">
            {Object.entries(action.signals).map(([key, val], i) => (
              <SignalRow key={key} sigKey={key} value={val} delay={i * 40} />
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center font-mono">
            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-tighter italic italic">Policy Logit Intensity</span>
            <span className="text-[10px] text-slate-600 font-black">
              {action.raw_score?.toFixed(3)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActionProbCard({ activeSlot = "morning" }) {
  const { data, prevData, status, lastUpdate } = useActionDistribution(activeSlot);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (data?.selected_action && expandedId === null) {
      setExpandedId(data.selected_action.task_id);
    }
  }, [data?.selected_action?.task_id]);

  const actions = data?.actions ?? [];
  const prevMap = Object.fromEntries((prevData?.actions ?? []).map(a => [a.task_id, a]));
  const isCrunch = data?.is_crunch ?? false;

  return (
    <div className="font-['DM_Sans']">
      <style>{`
        @keyframes ap-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes ap-slide { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
        @keyframes ap-pop { 0%{transform:scale(0.75);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes ap-expand { from{opacity:0;transform:scaleY(0.95);transform-origin:top} to{opacity:1;transform:none} }
        @keyframes ap-live { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div className={`animate-[ap-in_0.45s_ease_both] bg-orange-200 border rounded-[14px] p-5 pb-4 w-full max-w-[380px] shadow-sm text-slate-800 ${
        isCrunch ? "border-red-200 ring-1 ring-red-50 shadow-[0_10px_40px_-10px_rgba(239,68,68,0.1)]" : "border-slate-200"
      }`}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="text-[9px] font-mono font-bold tracking-[2px] text-amber-500 mb-1 uppercase">ACTION PROBABILITY DISTRIBUTION</div>
            <div className="font-['Syne'] text-[15px] font-extrabold tracking-tight text-slate-900 uppercase">π(a|s) · {SLOT_LABELS[activeSlot] || activeSlot} Cycle</div>
            <div className="text-[9px] font-mono text-slate-900 mt-1 uppercase tracking-tighter">
              {data?.total_candidates ?? "—"} Candidates · Softmax T={data?.temperature ?? "—"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full">
              <div className={`w-1.5 h-1.5 rounded-full ${
                status === "live" ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-[ap-live_2.5s_infinite]" : 
                status === "error" ? "bg-red-500" : "bg-amber-400"
              }`} />
              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                {status === "live" ? "live" : status === "error" ? "offline" : "syncing"}
              </span>
            </div>
            {lastUpdate && <span className="text-[7px] font-mono text-slate-300">{lastUpdate.toLocaleTimeString()}</span>}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="flex gap-2 mb-5">
          {[
            { label: "Slot Bias", val: data?.slot_bias, col: "text-amber-500", bg: "bg-amber-50" },
            { label: "Fatigue", val: data?.cognitive_fatigue, 
              col: (data?.cognitive_fatigue ?? 0) < 0.4 ? "text-emerald-500" : (data?.cognitive_fatigue ?? 0) < 0.7 ? "text-amber-500" : "text-red-500",
              bg: (data?.cognitive_fatigue ?? 0) < 0.4 ? "bg-emerald-50" : (data?.cognitive_fatigue ?? 0) < 0.7 ? "bg-amber-50" : "bg-red-50" 
            },
            { label: "Intensity", val: data?.work_intensity, col: isCrunch ? "text-red-500" : "text-slate-500", bg: isCrunch ? "bg-red-50" : "bg-slate-50" },
          ].map(({ label, val, col, bg }) => (
            <div key={label} className={`flex-1 p-2.5 rounded-xl border border-black/5 shadow-sm ${bg}`}>
              <div className="text-[7px] font-mono font-bold text-slate-400 mb-0.5 uppercase tracking-tighter">{label}</div>
              <div className={`font-['Syne'] text-[15px] font-black ${col} leading-none`}>
                <AnimNum value={(val ?? 0) * 100} decimals={0} suffix="%" />
              </div>
            </div>
          ))}
        </div>

        {/* Crunch Mode */}
        {isCrunch && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-[ap-pop_0.4s_ease_both]">
            <span className="text-base">🔥</span>
            <div>
              <div className="text-[9px] font-mono font-black text-red-600 tracking-wider uppercase">Crunch Mode Active</div>
              <div className="text-[8px] font-medium text-red-400 uppercase tracking-tighter">
                Work Intensity &gt; 0.8 · Completion Rew ×1.5
              </div>
            </div>
          </div>
        )}

        <div className="h-px bg-slate-100 mb-4" />
        <div className="text-[8px] font-mono font-black text-slate-900 tracking-[2px] mb-3 uppercase text-center italic">Candidate Action Space</div>

        {/* Action Rows Container */}
        <div className="space-y-2 mb-4">
          {actions.length === 0 ? (
            <div className="text-center py-10 italic text-[10px] text-slate-300 font-mono uppercase tracking-widest border border-dashed border-slate-100 rounded-xl">
              {status === "loading" ? "Initializing Inference Engine..." : "No candidates in current state."}
            </div>
          ) : (
            actions.map((action, i) => (
              <ActionRow
                key={action.task_id}
                action={action}
                prevAction={prevMap[action.task_id]}
                expanded={expandedId === action.task_id}
                onToggle={() => setExpandedId(prev => prev === action.task_id ? null : action.task_id)}
                index={i}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {/* <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
          <span className="text-[7px] font-mono font-bold text-slate-300 uppercase tracking-tighter italic">
            Softmax sampling active · Reward weighting v3.2
          </span>
          <span className="text-[8px] font-mono font-black text-slate-200">POLL 8S</span>
        </div> */}
      </div>
    </div>
  );
}