// src/components/ActionProbCard/ActionProbCard.jsx
import { useEffect, useRef, useState } from "react";
import { useActionDistribution } from "../../hooks/useActionDistribution";

// ── constants ──────────────────────────────────────────────────────────────
const MONO = "font-mono";
const DISPLAY = "font-['Syne']";
const SANS = "font-['DM_Sans']";

const PRIORITY_COLOR = { HIGH: "text-red-500", MEDIUM: "text-amber-500", LOW: "text-slate-400" };
const DIFF_LABEL = ["", "Easy", "Easy", "Medium", "Hard", "Hard"];
const DIFF_COLOR_BG = ["", "bg-emerald-500", "bg-emerald-500", "bg-amber-500", "bg-orange-500", "bg-red-500"];
const DIFF_COLOR_TEXT = ["", "text-emerald-500", "text-emerald-500", "text-amber-500", "text-orange-500", "text-red-500"];

const SIGNAL_META = {
  slot_bias: { label: "Slot Bias", desc: "Student's historical energy in this time slot" },
  category_bias: { label: "Category Bias", desc: "Completion rate for this subject category" },
  urgency: { label: "Urgency", desc: "Deadline proximity score" },
  difficulty_fit: { label: "Difficulty Fit", desc: "Task difficulty vs current cognitive energy" },
};

// ── helpers ────────────────────────────────────────────────────────────────
function probColorBg(p) {
  return p >= 35 ? "bg-amber-500" : p >= 20 ? "bg-slate-400" : "bg-slate-700";
}

// ── animated bar width ─────────────────────────────────────────────────────
function AnimBar({ value, bgColor, h = "h-[6px]", delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setW(value), 80 + delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return (
    <div className={`${h} w-full rounded-full bg-slate-100 overflow-hidden`}>
      <div
        className={`h-full rounded-full transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${bgColor}`}
        style={{ 
          width: `${w}%`, 
          transitionDelay: `${delay}ms`,
          boxShadow: '0 0 8px rgba(0,0,0,0.05)'
        }}
      />
    </div>
  );
}

// ── animated number ────────────────────────────────────────────────────────
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

// ── delta badge — shows prob change from previous fetch ───────────────────
function DeltaBadge({ curr, prev }) {
  if (prev == null) return null;
  const d = curr - prev;
  if (Math.abs(d) < 1) return null;
  return (
    <span className={`text-[8px] font-mono px-[5px] py-[1px] rounded-[3px] border animate-ap-pop ${
      d > 0 ? "text-emerald-500 bg-emerald-50 border-emerald-200" : "text-red-500 bg-red-50 border-red-200"
    }`}>
      {d > 0 ? "▲" : "▼"}{Math.abs(d)}%
    </span>
  );
}

// ── signal breakdown row ───────────────────────────────────────────────────
function SignalRow({ sigKey, value, delay }) {
  const meta = SIGNAL_META[sigKey];
  const colorBg = value >= 0.65 ? "bg-emerald-500" : value >= 0.40 ? "bg-amber-500" : "bg-red-500";
  const colorText = value >= 0.65 ? "text-emerald-500" : value >= 0.40 ? "text-amber-500" : "text-red-500";
  return (
    <div className="mb-[5px]">
      <div className="flex justify-between mb-[3px]">
        <span className="text-[9px] font-mono text-slate-500">{meta.label}</span>
        <span className={`text-[9px] font-mono font-semibold ${colorText}`}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <AnimBar value={value * 100} bgColor={colorBg} h="h-[4px]" delay={delay} />
    </div>
  );
}

// ── single action row ──────────────────────────────────────────────────────
function ActionRow({ action, prevAction, expanded, onToggle, index }) {
  const pColorClass = PRIORITY_COLOR[action.priority] || "text-slate-400";
  const dColorText = DIFF_COLOR_TEXT[action.difficulty] || "text-slate-400";
  const dLabel = DIFF_LABEL[action.difficulty] || "—";
  const barBg = action.is_selected ? "bg-amber-500" : probColorBg(action.probability);

  return (
    <div 
      className="mb-2 animate-ap-slide"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        onClick={onToggle}
        className={`flex items-center gap-[10px] p-[10px_12px] rounded-[9px] cursor-pointer border transition-all duration-200 ${
          action.is_selected
            ? "bg-amber-50/50 border-amber-200 shadow-sm"
            : "bg-white border-slate-100 hover:border-slate-200"
        }`}
      >
        {/* probability pill */}
        <div className={`min-w-[42px] text-center p-[3px_6px] rounded-[6px] border ${
          action.is_selected ? "bg-amber-100/50 border-amber-300" : "bg-slate-50 border-slate-100"
        }`}>
          <span className={`${DISPLAY} text-[15px] font-extrabold ${
            action.is_selected ? "text-amber-500" : "text-slate-400"
          }`}>
            <AnimNum value={action.probability} decimals={0} suffix="%" />
          </span>
        </div>

        {/* bar + name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[6px] mb-1">
            <span className="text-[11px] text-slate-800 font-medium truncate">
              {action.task_name}
            </span>
            {action.is_selected && (
              <span className="text-[8px] font-mono text-amber-600 bg-amber-100 px-[5px] py-[1px] rounded-[3px] border border-amber-200 whitespace-nowrap animate-ap-pop font-bold">
                SELECTED
              </span>
            )}
            <DeltaBadge curr={action.probability} prev={prevAction?.probability} />
          </div>
          <AnimBar value={action.probability} bgColor={barBg} h="h-[5px]" delay={index * 60} />
        </div>

        {/* meta tags */}
        <div className="flex flex-col items-end gap-[3px] shrink-0">
          <span className={`text-[8px] font-mono font-bold uppercase ${pColorClass}`}>{action.priority}</span>
          <span className={`text-[8px] font-mono font-bold ${dColorText}`}>{dLabel} {action.difficulty}/5</span>
          <span className="text-[8px] font-mono text-slate-300">
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* expanded signal breakdown */}
      {expanded && (
        <div className="mt-[-4px] p-[12px] rounded-b-[9px] bg-slate-50 border border-slate-100 border-t-0 animate-ap-expand shadow-inner">
          <div className="text-[8px] font-mono text-amber-600 font-bold tracking-widest mb-2 uppercase">
            Signal Breakdown · π(a|s)
          </div>
          {Object.entries(action.signals).map(([key, val], i) => (
            <SignalRow key={key} sigKey={key} value={val} delay={i * 40} />
          ))}
          <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between">
            <span className="text-[8px] font-mono text-slate-400 italic">
              raw score (pre-softmax)
            </span>
            <span className="text-[9px] font-mono text-slate-600 font-bold">
              {action.raw_score?.toFixed(3)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActionProbCard({ activeSlot = "Morning" }) {
  const { data, prevData, status, lastUpdate } = useActionDistribution(activeSlot);
  const [expandedId, setExpandedId] = useState(null);

  function toggleExpand(taskId) {
    setExpandedId(prev => prev === taskId ? null : taskId);
  }

  useEffect(() => {
    if (data?.selected_action && expandedId === null) {
      setExpandedId(data.selected_action.task_id);
    }
  }, [data?.selected_action?.task_id]);

  const actions = data?.actions ?? [];
  const prevMap = Object.fromEntries((prevData?.actions ?? []).map(a => [a.task_id, a]));

  return (
    <div className="relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        @keyframes ap-in     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes ap-slide  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
        @keyframes ap-pop    { 0%{transform:scale(0.75);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes ap-expand { from{opacity:0;transform:scaleY(0.9)} to{opacity:1;transform:none} }
        @keyframes ap-live   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .animate-ap-in { animation: ap-in 0.45s ease both; }
        .animate-ap-slide { animation: ap-slide 0.4s ease both; }
        .animate-ap-pop { animation: ap-pop 0.35s ease both; }
        .animate-ap-expand { animation: ap-expand 0.25s ease both; }
        .animate-ap-live { animation: ap-live 2.5s infinite; }
      `}</style>

      <div className="animate-ap-in bg-white border border-slate-200 rounded-[14px] p-5 pb-4 w-full max-w-[360px] shadow-sm font-['DM_Sans'] text-slate-800">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[9px] font-mono font-bold tracking-[2px] text-amber-500 mb-1 uppercase">
              Action Probability Distribution
            </div>
            <div className="font-['Syne'] text-[15px] font-extrabold tracking-tight">
              π(a|s) · {activeSlot}
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-[3px]">
              {data?.total_candidates ?? "—"} candidates · softmax T={data?.temperature ?? "—"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-[3px]">
            <div className="flex items-center gap-[5px]">
              <div className={`w-[6px] h-[6px] rounded-full ${
                status === "live" ? "bg-emerald-500 shadow-[0_0_7px_#10B981] animate-ap-live" : 
                status === "error" ? "bg-red-500" : "bg-amber-500"
              }`} />
              <span className="text-[9px] font-mono text-slate-400">
                {status === "live" ? "live" : status === "error" ? "offline" : "connecting…"}
              </span>
            </div>
            {lastUpdate && (
              <span className="text-[8px] font-mono text-slate-400">{lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>
        </div>

        {/* ── Context strip ───────────────────────── */}
        <div className="flex gap-2 mb-4">
          {[
            { label: "Slot Bias", value: data?.slot_bias, unit: "%", mult: 100 },
            { label: "Fatigue", value: data?.cognitive_fatigue, unit: "%", mult: 100 },
          ].map(({ label, value, unit, mult }) => {
            const pct = (value ?? 0) * mult;
            const colText = label === "Fatigue"
              ? (pct < 40 ? "text-emerald-500" : pct < 70 ? "text-amber-500" : "text-red-500")
              : "text-amber-500";
            const colBg = label === "Fatigue"
              ? (pct < 40 ? "bg-emerald-50/50 border-emerald-100" : pct < 70 ? "bg-amber-50/50 border-amber-100" : "bg-red-50/50 border-red-100")
              : "bg-amber-50/50 border-amber-100";
            
            return (
              <div key={label} className={`flex-1 p-[8px_10px] rounded-[8px] border ${colBg}`}>
                <div className="text-[8px] font-mono text-slate-500 mb-1 uppercase font-bold">{label}</div>
                <div className={`font-['Syne'] text-[18px] font-extrabold leading-tight ${colText}`}>
                  <AnimNum value={pct} decimals={0} suffix={unit}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Selected action highlight ─────────────────────────────────── */}
        {data?.selected_action && (
          <div className="p-[10px_12px] rounded-[9px] mb-3.5 bg-amber-50/50 border border-amber-200 animate-ap-pop">
            <div className="text-[8px] font-mono text-amber-600 font-bold tracking-widest mb-1.5 uppercase">
              AI Selected Action
            </div>
            <div className="flex justify-between items-center">
              <span className="font-['Syne'] text-[16px] font-extrabold text-slate-900">
                {data.selected_action.task_name}
              </span>
              <span className="font-['Syne'] text-[22px] font-extrabold text-amber-500">
                <AnimNum value={data.selected_action.probability} decimals={0} suffix="%"/>
              </span>
            </div>
            <div className="flex gap-[6px] mt-[6px]">
              <span className="text-[9px] font-mono text-slate-500 bg-white border border-slate-100 px-[7px] py-[2px] rounded-[4px] font-bold">
                {data.selected_action.category}
              </span>
              <span className={`text-[9px] font-mono bg-white border border-slate-100 px-[7px] py-[2px] rounded-[4px] font-bold ${DIFF_COLOR_TEXT[data.selected_action.difficulty]}`}>
                {DIFF_LABEL[data.selected_action.difficulty]} {data.selected_action.difficulty}/5
              </span>
              <span className={`text-[9px] font-mono bg-white border border-slate-100 px-[7px] py-[2px] rounded-[4px] font-bold ${PRIORITY_COLOR[data.selected_action.priority]}`}>
                {data.selected_action.priority}
              </span>
            </div>
          </div>
        )}

        <div className="h-[1px] bg-slate-100 mb-3" />
        <div className="text-[8px] font-mono text-slate-400 font-bold tracking-widest mb-2.5 uppercase italic">
          Candidate Actions · Expand for π(a|s) breakdown
        </div>

        {/* ── Action rows ───────────────────────────────────────────────── */}
{/* --- Action rows (Updated for Empty State) --- */}
<div className="space-y-1">
  {actions.length === 0 ? (
    <div className="text-center py-10 px-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl animate-pulse">
      <div className="text-[20px] mb-2">📥</div>
      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
        {status === "loading" 
          ? "Calculating optimal policy..." 
          : data?.message || "Your task list is empty."}
      </p>
      {status !== "loading" && (
        <span className="text-[9px] text-slate-400 font-mono mt-1 block italic uppercase">
          (Awaiting environment input)
        </span>
      )}
    </div>
  ) : (
    actions.map((action, i) => (
      <ActionRow
        key={action.task_id}
        action={action}
        prevAction={prevMap[action.task_id]}
        expanded={expandedId === action.task_id}
        onToggle={() => toggleExpand(action.task_id)}
        index={i}
      />
    ))
  )}
</div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
{/* --- Footer (Updated with Confidence Label) --- */}
<div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
  <div className="flex flex-col gap-0.5">
    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-tight">
      weights: slot(0.30) · cat(0.25) · urgency(0.25) · fit(0.20)
    </span>
    {/* Temperature / Confidence Logic */}
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] font-mono text-slate-400 uppercase font-bold tracking-tight">
        Confidence: 
      </span>
      <span className={`text-[8px] font-mono font-bold px-1 rounded ${
        data?.temperature > 1.2 ? "bg-blue-50 text-blue-500" : "bg-emerald-50 text-emerald-600"
      }`}>
        {data?.temperature > 1.2 ? "Exploring Options" : "High Confidence"}
      </span>
    </div>
  </div>
  <span className="text-[8px] font-mono text-slate-400 uppercase font-bold">poll 8s</span>
</div>
      </div>
    </div>
  );
}