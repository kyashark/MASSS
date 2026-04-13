// src/components/PolicyAnalyticsCard/PolicyAnalyticsCard.jsx

import { useState } from "react";
import { usePolicyAnalytics } from "../../hooks/usePolicyAnalytics";
import { SLOT_LABELS } from "../../constants/enums";

const SLOT_COLOR = {
  morning:   "text-amber-500",
  afternoon: "text-sky-500",
  evening:   "text-violet-500",
};

const SLOT_BG = {
  morning:   "bg-amber-500",
  afternoon: "bg-sky-500",
  evening:   "bg-violet-500",
};

const TREND_ICON  = { up: "↑", down: "↓", flat: "→" };
const TREND_LABEL = { up: "UP", down: "DOWN", flat: "FLAT" };
const TREND_TEXT  = { up: "text-emerald-500", down: "text-red-500", flat: "text-slate-400" };
const TREND_BG    = { up: "bg-emerald-50", down: "bg-red-50", flat: "bg-slate-50" };
const TREND_BORDER= { up: "border-emerald-100", down: "border-red-100", flat: "border-slate-100" };

const VERDICT_META = {
  decisive:    { label: "Decisive",    color: "text-emerald-500", bg: "bg-emerald-50",  border: "border-emerald-100", desc: "Agent strongly prefers one task" },
  moderate:    { label: "Moderate",    color: "text-amber-500",   bg: "bg-amber-50",    border: "border-amber-100",   desc: "Agent has reasonable confidence" },
  uncertain:   { label: "Uncertain",   color: "text-red-500",     bg: "bg-red-50",      border: "border-red-100",     desc: "Agent still exploring options" },
  unavailable: { label: "Unavailable", color: "text-slate-400",   bg: "bg-slate-50",    border: "border-slate-100",   desc: "Could not load distribution" },
};

const LEARNING_META = {
  strong_learning:    { label: "Strong Learning",   color: "text-emerald-500", bg: "bg-emerald-50",  border: "border-emerald-200", icon: "🧠" },
  adapting:           { label: "Adapting",          color: "text-amber-500",   bg: "bg-amber-50",    border: "border-amber-200",   icon: "📈" },
  early_stage:        { label: "Early Stage",       color: "text-slate-400",   bg: "bg-slate-50",    border: "border-slate-200",   icon: "🌱" },
  insufficient_data:  { label: "Need More Data",    color: "text-slate-500",   bg: "bg-slate-50",    border: "border-slate-200",   icon: "⏳" },
};

// ── Sparkline (pure SVG) ──────────────────────────────────────────────────────
function Sparkline({ checkpoints, color, width = 340, height = 52 }) {
  const points = checkpoints.filter(c => c.n_sessions > 0);
  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center font-mono text-[8px] text-slate-300 italic bg-slate-50 rounded-lg border border-slate-100" style={{ width, height }}>
        Awaiting session history...
      </div>
    );
  }

  const pad = 4;
  const W = width - pad * 2;
  const H = height - pad * 2;
  const n = points.length;
  const xOf = (i) => pad + (i / (n - 1)) * W;
  const yOf = (v) => pad + (1 - v) * H;

  const polyline = points.map((p, i) => `${xOf(i)},${yOf(p.score)}`).join(" ");
  const areaPath = [
    `M ${xOf(0)},${yOf(points[0].score)}`,
    ...points.map((p, i) => `L ${xOf(i)},${yOf(p.score)}`),
    `L ${xOf(n - 1)},${pad + H}`,
    `L ${xOf(0)},${pad + H}`,
    "Z",
  ].join(" ");

  const lastX = xOf(n - 1);
  const lastY = yOf(points[n - 1].score);

  return (
    <svg width={width} height={height} className="overflow-visible">
      {[0.25, 0.5, 0.75].map(v => (
        <line key={v} x1={pad} y1={yOf(v)} x2={pad + W} y2={yOf(v)} className="stroke-slate-100" strokeWidth={1} />
      ))}
      <path d={areaPath} fill={color} className="opacity-10" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={3} fill={color} />
      {points.map((p, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(p.score)} r={1.5} fill={color} className="opacity-40" />
      ))}
    </svg>
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────
export default function PolicyAnalyticsCard({ activeSlot = "morning" }) {
  const { data, status, refetch } = usePolicyAnalytics(activeSlot);
  const [tab, setTab] = useState("drift");

  const summary = data?.summary;
  const lMeta = LEARNING_META[summary?.learning_signal ?? "insufficient_data"];
  const confidence = data?.policy_confidence;
  const vMeta = VERDICT_META[confidence?.verdict ?? "unavailable"];

  return (
    <div className="relative font-['DM_Sans']">
      <style>{`
        @keyframes pa-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      `}</style>

      <div className="animate-[pa-in_0.45s_ease_both] bg-violet-100 border border-slate-200 rounded-[14px] p-5 pb-4 w-full max-w-[400px] shadow-sm text-slate-800">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[9px] font-mono font-bold tracking-[2px] text-indigo-500 mb-1 uppercase">POLICY ANALYTICS</div>
            <div className="font-['Syne'] text-[15px] font-extrabold tracking-tight">Is the Agent Learning?</div>
            <div className="text-[9px] font-mono text-slate-400 mt-[2px]">28-day drift · {SLOT_LABELS[activeSlot] || activeSlot} slot</div>
          </div>

          {summary && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${lMeta.bg} ${lMeta.border}`}>
              <span className="text-xs">{lMeta.icon}</span>
              <span className={`text-[8px] font-mono font-black tracking-wider uppercase ${lMeta.color}`}>{lMeta.label}</span>
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100 mb-4" />

        {/* Loading/Error */}
        {status === "loading" && (
          <div className="text-center py-10">
            <div className="w-6 h-6 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
            <div className="text-[9px] font-mono text-slate-400 italic uppercase tracking-widest">Parsing Neural Weights...</div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-8">
            <div className="text-[11px] font-mono text-red-500 mb-3 font-semibold">Data Stream Synchronization Failed</div>
            <button onClick={refetch} className="px-5 py-2 rounded-lg bg-red-50 border border-red-200 text-red-500 font-mono text-[10px] font-bold hover:bg-red-100 transition-colors uppercase">Retry Sync</button>
          </div>
        )}

        {status === "live" && data && (
          <>
            {/* Summary Strip */}
            <div className="flex gap-2 mb-4">
              {[
                { l: "SESSIONS", v: summary?.total_sessions ?? 0, c: "text-indigo-500", bg: "bg-indigo-50" },
                { l: "BEST SLOT", v: summary?.best_slot ?? "—", c: SLOT_COLOR[summary?.best_slot] ?? "text-slate-500", bg: "bg-slate-50" },
                // { l: "CONFIDENCE", v: `${confidence?.gap ?? 0}%`, c: vMeta.color, bg: vMeta.bg },
                { l: "CONFIDENCE", v: `${confidence?.gap ?? 0}%`, c: vMeta?.color ?? "text-slate-500", bg: vMeta?.bg ?? "bg-slate-50" },
                { l: "IMPROVING", v: `${summary?.improving_slots ?? 0}/3`, c: summary?.improving_slots >= 2 ? "text-emerald-500" : "text-amber-500", bg: summary?.improving_slots >= 2 ? "bg-emerald-50" : "bg-amber-50" },
              ].map((s) => (
                <div key={s.l} className={`flex-1 p-2 rounded-xl border border-black/5 shadow-sm ${s.bg}`}>
                  <div className="text-[7px] font-mono font-bold text-slate-400 mb-0.5 uppercase tracking-tighter">{s.l}</div>
                  <div className={`text-[11px] font-mono font-black ${s.c}`}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 mb-4 bg-slate-50 p-1 rounded-xl">
              {["drift", "confidence", "categories"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all uppercase tracking-tighter ${
                    tab === t ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t === "drift" ? "Slot Drift" : t === "confidence" ? "Policy Gap" : "Subjects"}
                </button>
              ))}
            </div>

            {/* Tab content wrappers all use the same consistent padding and style */}
            <div className="min-h-[220px]">
              {/* Tab A: Slot Drift */}
              {tab === "drift" && (
                <div className="animate-[pa-in_0.3s_ease_both]">
                  <div className="text-[8px] font-mono font-black text-slate-400 mb-3 uppercase tracking-widest italic text-center">Energy score (1–5) · 28-Day Learning Curve</div>
                  {Object.entries(data.slot_drift).map(([slot, info]) => (
                    <div key={slot} className="mb-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${SLOT_BG[slot]}`} />
                          <span className="text-[10px] font-mono font-bold text-slate-600">{SLOT_LABELS[slot] || slot}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-mono font-bold ${TREND_TEXT[info.trend]}`}>{TREND_ICON[info.trend]} {TREND_LABEL[info.trend] || info.trend}</span>
                          <span className={`text-[12px] font-mono font-black ${SLOT_COLOR[slot]}`}>{info.current.toFixed(1)}/5.0</span>
                        </div>
                      </div>
                      <Sparkline checkpoints={info.checkpoints} color={info.color} />
                    </div>
                  ))}
                </div>
              )}

              {/* Tab B: Policy Confidence */}
{tab === "confidence" && confidence && (
  <div className="animate-[pa-in_0.3s_ease_both] space-y-4">
    <div className={`p-4 rounded-xl border flex justify-between items-center ${vMeta?.bg ?? 'bg-slate-50'} ${vMeta?.border ?? 'border-slate-200'} shadow-inner`}>
      <div>
        <div className={`text-[11px] font-mono font-black ${vMeta?.color ?? 'text-slate-500'}`}>{vMeta?.label ?? 'Loading...'}</div>
        <div className="text-[8px] font-mono text-slate-400">{vMeta?.desc ?? 'Calculating metrics...'}</div>
      </div>
                    <div className={`font-['Syne'] text-[28px] font-black ${vMeta?.color ?? 'text-slate-500'}`}>{confidence.gap}%</div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { r: "Rank 1", n: confidence.rank1_name, p: confidence.rank1_prob, c: "text-emerald-500", bg: "bg-emerald-50" },
                      { r: "Rank 2", n: confidence.rank2_name, p: confidence.rank2_prob, c: "text-amber-500", bg: "bg-amber-50" },
                    ].map((rank) => (
                      <div key={rank.r} className={`p-2.5 rounded-xl border border-black/5 flex justify-between items-center ${rank.bg}`}>
                        <div className="min-w-0">
                          <div className="text-[7px] font-mono font-bold text-slate-400 uppercase">{rank.r}</div>
                          <div className="text-[11px] font-mono font-bold text-slate-600 truncate max-w-[200px]">{rank.n}</div>
                        </div>
                        <div className={`text-base font-mono font-black ${rank.c}`}>{rank.p}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab C: Category Drift */}
              {tab === "categories" && (
                <div className="animate-[pa-in_0.3s_ease_both]">
                  <div className="text-[8px] font-mono font-black text-slate-400 mb-3 uppercase tracking-widest italic text-center">Success Rate Delta: Early vs Recent</div>
                  <div className="space-y-1">
                    {data.category_drift.length === 0 ? (
                      <div className="text-center py-10 italic text-[10px] text-slate-300">History buffer currently empty</div>
                    ) : (
                      data.category_drift.map(item => (
                        <div key={item.category} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${TREND_BG[item.trend]} ${TREND_BORDER[item.trend]} ${TREND_TEXT[item.trend]}`}>
                            {TREND_ICON[item.trend]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-mono font-bold text-slate-600 truncate">{item.category}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="text-[6px] font-mono text-slate-300">EARLY</div>
                              <div className="text-[9px] font-mono text-slate-400">{item.early != null ? `${Math.round(item.early * 100)}%` : "—"}</div>
                            </div>
                            <div className="text-slate-200 text-[8px]">→</div>
                            <div className="text-right">
                              <div className="text-[6px] font-mono text-slate-300">NOW</div>
                              <div className="text-[9px] font-mono font-black text-slate-600">{item.recent != null ? `${Math.round(item.recent * 100)}%` : "—"}</div>
                            </div>
                            <div className={`min-w-[32px] text-right font-mono font-black text-[10px] ${TREND_TEXT[item.trend]}`}>
                              {item.delta != null ? `${item.delta > 0 ? "+" : ""}${Math.round(item.delta * 100)}%` : "—"}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Explainer Footer */}
            <div className="mt-4 p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-[8px] font-mono text-indigo-400 leading-relaxed italic">
              * The agent performs **Inference-Time Policy Evaluation**. Upward sparklines indicate the model has validated these parameters through a positive Reward Loop ($R_t$).
            </div>

            {/* Footer */}
            {/* <div className="mt-5 pt-3 border-t border-slate-50 flex justify-between">
              <span className="text-[7px] font-mono font-bold text-slate-300 uppercase tracking-tighter">Synced with analytics.py weights</span>
              <span className="text-[7px] font-mono font-bold text-slate-300 uppercase tracking-tighter">Poll 30S</span>
            </div> */}
          </>
        )}
      </div>
    </div>
  );
}