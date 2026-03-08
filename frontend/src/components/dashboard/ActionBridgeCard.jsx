// src/components/ActionBridgeCard/ActionBridgeCard.jsx

import { useRecommendation } from "../../hooks/useRecommendation";

const PRIORITY_COLOR = { HIGH: "text-red-500", MEDIUM: "text-amber-500", LOW: "text-slate-400" };
const DIFF_LABEL = ["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"];
const DIFF_COLOR = ["", "text-emerald-500", "text-emerald-500", "text-amber-500", "text-orange-500", "text-red-500"];
const SIGNAL_META = {
  completion_proximity: { label: "Completion", color: "bg-amber-500", text: "text-amber-600" },
  slot_bias: { label: "Slot Energy", color: "bg-emerald-500", text: "text-emerald-600" },
  momentum: { label: "Momentum", color: "bg-violet-500", text: "text-violet-600" },
  urgency: { label: "Urgency", color: "bg-orange-500", text: "text-orange-600" },
  category_bias: { label: "Category", color: "bg-sky-500", text: "text-sky-600" },
};

// ── sub-components ────────────────────────────────────────────────────────────

function SignalBar({ sigKey, value }) {
  const meta = SIGNAL_META[sigKey] ?? { label: sigKey, color: "bg-slate-400", text: "text-slate-500" };
  const pct = Math.round(value * 100);
  return (
    <div className="mb-2">
      <div className="flex justify-between mb-1">
        <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">{meta.label}</span>
        <span className={`text-[8px] font-mono font-bold ${meta.text}`}>{pct}%</span>
      </div>
      <div className="h-[3px] rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${meta.color} opacity-70 transition-all duration-700 ease-in-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Tag({ label, colorClass }) {
  return (
    <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border bg-white shadow-sm ${colorClass}`}>
      {label}
    </span>
  );
}

function ContextPill({ label, value, colorClass, bgClass }) {
  return (
    <div className={`flex-1 p-2.5 rounded-xl border ${bgClass} shadow-sm`}>
      <div className="text-[7px] font-mono font-bold text-slate-400 mb-0.5 uppercase tracking-wider">{label}</div>
      <div className={`text-[12px] font-mono font-black ${colorClass}`}>{value}</div>
    </div>
  );
}

// ── main card ─────────────────────────────────────────────────────────────────

export default function ActionBridgeCard({ activeSlot = "Morning", onLaunchSession }) {
  const { rec, status, refetch } = useRecommendation(activeSlot);

  const isCrunch = rec?.is_crunch ?? false;
  
  const buildTaskForPomo = () => ({
    id: rec.task_id,
    name: rec.task_name,
    status: rec.status,
    sessions_count: rec.sessions_count,
    estimated_pomodoros: rec.estimated_pomodoros,
  });

  return (
    <div className="relative font-['DM_Sans']">
      <style>{`
        @keyframes ab-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes ab-crunch { 0%,100%{box-shadow:0 0 10px rgba(239,68,68,0.1)} 50%{box-shadow:0 0 20px rgba(239,68,68,0.2)} }
      `}</style>

      <div className={`animate-[ab-in_0.4s_ease_both] bg-white border rounded-[14px] p-5 pb-4 w-full max-w-[380px] shadow-sm text-slate-800 ${isCrunch ? 'border-red-200 ring-1 ring-red-50 animate-[ab-crunch_2.5s_infinite]' : 'border-slate-200'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[9px] font-mono font-bold tracking-[2px] text-amber-500 mb-1 uppercase">AI-ACTION BRIDGE</div>
            <div className="font-['Syne'] text-[15px] font-extrabold tracking-tight">Top Recommendation</div>
            <div className="text-[9px] font-mono text-slate-400 mt-[2px]">
              {activeSlot} slot · <span className="italic">π(a|s) policy selection</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'live' ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]' : 'bg-slate-300'}`} />
            <span className="text-[9px] font-mono font-bold text-amber-600 uppercase">
              {status === "loading" ? "..." : status === "error" ? "ERR" : "LIVE"}
            </span>
          </div>
        </div>

        <div className="h-px bg-slate-100 mb-4" />

        {/* Loading/Error States */}
        {status === "loading" && (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-amber-100 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
            <div className="text-[9px] font-mono text-slate-400 italic">Computing context-aware policy...</div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-6">
            <div className="text-[11px] font-mono text-red-500 mb-3 font-semibold underline decoration-2 underline-offset-4">Inference Engine Connection Failed</div>
            <button onClick={refetch} className="px-5 py-2 rounded-lg bg-red-50 border border-red-200 text-red-500 font-mono text-[10px] font-bold hover:bg-red-100 transition-colors uppercase tracking-wider">Retry Link</button>
          </div>
        )}

        {status === "live" && !rec && (
          <div className="text-center py-8 text-[10px] font-mono text-slate-400 italic border-2 border-dashed border-slate-50 rounded-xl">
            No actionable tasks found for {activeSlot}.
          </div>
        )}

        {/* Main Content */}
        {status === "live" && rec && (
          <>
            {isCrunch && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                <span className="text-base">🔥</span>
                <div>
                  <div className="text-[9px] font-mono font-black text-red-600 tracking-wider">CRUNCH MODE ACTIVE</div>
                  <div className="text-[8px] text-red-400 font-medium">Exam pressure detected · Reward weights x1.5</div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="text-[8px] font-mono font-black text-amber-500 tracking-[1.5px] mb-2 uppercase italic">Selected Action · {rec.probability}% Confidence</div>
              <div className="font-['Syne'] text-[17px] font-extrabold text-slate-800 leading-tight mb-3">
                {rec.task_name}
              </div>

              <div className="flex gap-1.5 flex-wrap">
                <Tag label={rec.module} colorClass="text-slate-500 border-slate-200" />
                <Tag label={rec.category} colorClass="text-slate-500 border-slate-200" />
                <Tag label={rec.priority} colorClass={`${PRIORITY_COLOR[rec.priority]} border-slate-100`} />
                <Tag label={`${DIFF_LABEL[rec.difficulty]} ${rec.difficulty}/5`} colorClass={`${DIFF_COLOR[rec.difficulty]} border-slate-100`} />
                {rec.days_until != null && (
                  <Tag 
                    label={rec.days_until <= 0 ? "OVERDUE" : `${rec.days_until}d left`} 
                    colorClass={rec.days_until <= 1 ? "text-red-500 border-red-100" : rec.days_until <= 3 ? "text-orange-500 border-orange-100" : "text-slate-400 border-slate-200"} 
                  />
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex justify-between mb-1.5">
                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-tighter">Session Progress</span>
                <span className="text-[9px] font-mono font-black text-slate-600 uppercase">
                  {rec.sessions_count} / {rec.estimated_pomodoros} Done
                </span>
              </div>
              <div className="h-[4px] rounded-full bg-white border border-slate-100 overflow-hidden shadow-inner">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min((rec.sessions_count / Math.max(rec.estimated_pomodoros, 1)) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* RL Signals */}
            {rec.signals && Object.keys(rec.signals).length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 mb-4">
                <div className="text-[8px] font-mono font-black text-slate-400 tracking-[1.5px] mb-3 uppercase italic">RL Policy Weights</div>
                {Object.entries(rec.signals).map(([k, v]) => (
                  <SignalBar key={k} sigKey={k} value={v} />
                ))}
              </div>
            )}

            {/* Context Strip */}
            <div className="flex gap-2 mb-5">
              <ContextPill label="ACTIVE SLOT" value={rec.slot} colorClass="text-emerald-600" bgClass="bg-emerald-50 border-emerald-100" />
              <ContextPill 
                label="FATIGUE" 
                value={`${Math.round(rec.cognitive_fatigue * 100)}%`} 
                colorClass={rec.cognitive_fatigue < 0.4 ? "text-emerald-600" : rec.cognitive_fatigue < 0.7 ? "text-amber-600" : "text-red-600"} 
                bgClass={rec.cognitive_fatigue < 0.4 ? "bg-emerald-50 border-emerald-100" : rec.cognitive_fatigue < 0.7 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"} 
              />
              <ContextPill 
                label="INTENSITY" 
                value={`${Math.round(rec.work_intensity * 100)}%`} 
                colorClass={isCrunch ? "text-red-600" : "text-slate-600"} 
                bgClass={isCrunch ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"} 
              />
            </div>

            {/* Launch Button */}
            <button
              onClick={() => onLaunchSession?.(buildTaskForPomo())}
              className="w-full py-4 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-['Syne'] text-[15px] font-black shadow-[0_10px_20px_-5px_rgba(245,158,11,0.4)] hover:shadow-[0_12px_24px_-5px_rgba(245,158,11,0.5)] active:scale-[0.98] transition-all group overflow-hidden relative"
            >
              <span className="relative z-10">▶ Start Session</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>
          </>
        )}

        {/* Footer */}
        {/* <div className="mt-5 pt-3 border-t border-slate-50 flex justify-between">
          <span className="text-[7px] font-mono font-bold text-slate-300 uppercase tracking-tighter italic">Initializes existing PomoSession controller</span>
          <span className="text-[7px] font-mono font-bold text-slate-300 uppercase tracking-tighter italic">State-to-Action mapping active</span>
        </div> */}
      </div>
    </div>
  );
}