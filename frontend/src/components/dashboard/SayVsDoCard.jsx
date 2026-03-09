// src/components/SayVsDoCard/SayVsDoCard.jsx

import { useState } from "react";
import { useGapAnalysis } from "../../hooks/useGapAnalysis";

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_COLOR = { HIGH: "text-red-500", MEDIUM: "text-amber-500", LOW: "text-slate-400" };
const END_TYPE_META  = {
  COMPLETED: { label: "Done",    color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
  STOPPED:   { label: "Stopped", color: "text-amber-500",   bg: "bg-amber-50",   border: "border-amber-100" },
  ABORTED:   { label: "Abort",   color: "text-red-500",     bg: "bg-red-50",     border: "border-red-100" },
  SKIPPED:   { label: "Skip",    color: "text-slate-500",   bg: "bg-slate-50",   border: "border-slate-100" },
};
const COMPONENT_META = {
  slot_energy_bonus: { label: "Slot Energy",  color: "bg-emerald-400", text: "text-emerald-600" },
  focus_reward:      { label: "Focus",        color: "bg-amber-400",   text: "text-amber-600" },
  completion_bonus:  { label: "Completion",   color: "bg-violet-400",  text: "text-violet-600" },
  deadline_bonus:    { label: "Deadline",     color: "bg-orange-400",  text: "text-orange-600" },
  momentum_bonus:    { label: "Momentum",     color: "bg-sky-400",     text: "text-sky-600" },
  fatigue_penalty:   { label: "Fatigue",      color: "bg-red-400",     text: "text-red-600" },
  delay_penalty:     { label: "Delay",        color: "bg-red-500",     text: "text-red-700" },
};

// ── Primitives ────────────────────────────────────────────────────────────────

function Tag({ label, colorClass }) {
  return (
    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-white shadow-sm ${colorClass}`}>
      {label}
    </span>
  );
}

function StatBox({ label, value, colorClass, bgClass, sub }) {
  return (
    <div className={`flex-1 p-2.5 rounded-xl border border-black/5 shadow-sm ${bgClass}`}>
      <div className="text-[7px] font-mono font-bold text-slate-400 mb-0.5 uppercase tracking-tighter">{label}</div>
      <div className={`text-[14px] font-mono font-black ${colorClass}`}>{value}</div>
      {sub && <div className="text-[7px] font-mono text-slate-400 mt-0.5 italic">{sub}</div>}
    </div>
  );
}

// ── RewardBar (comparison) ────────────────────────────────────────────────────

function RewardBar({ component, followedVal, overrideVal }) {
  const meta   = COMPONENT_META[component] ?? { label: component, color: "bg-slate-400", text: "text-slate-500" };
  const maxAbs = Math.max(Math.abs(followedVal), Math.abs(overrideVal), 0.1);
  const fPct   = Math.min(Math.abs(followedVal) / maxAbs * 100, 100);
  const oPct   = Math.min(Math.abs(overrideVal) / maxAbs * 100, 100);

  if (followedVal === 0 && overrideVal === 0) return null;

  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">{meta.label}</span>
        <div className="flex gap-3">
          <span className={`text-[8px] font-mono font-black ${meta.text}`}>
            {followedVal >= 0 ? "+" : ""}{followedVal}
          </span>
          <span className="text-[8px] font-mono font-bold text-slate-300">
            {overrideVal >= 0 ? "+" : ""}{overrideVal}
          </span>
        </div>
      </div>
      {/* Followed bar */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[7px] font-mono font-black text-emerald-500 w-3">AI</span>
        <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full ${meta.color} transition-all duration-700`} style={{ width: `${fPct}%` }} />
        </div>
      </div>
      {/* Override bar */}
      <div className="flex items-center gap-2">
        <span className="text-[7px] font-mono font-black text-red-400 w-3 text-center">↻</span>
        <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-slate-300 opacity-40 transition-all duration-700" style={{ width: `${oPct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── AlignmentRow ──────────────────────────────────────────────────────────────

function AlignmentRow({ item }) {
  const isFollowed = item.alignment === "followed";
  const etMeta     = END_TYPE_META[item.end_type] ?? { label: item.end_type, color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100" };
  const reward     = item.total_reward;
  const rColor     = reward >= 15 ? "text-emerald-500" : reward >= 5 ? "text-amber-500" : "text-red-500";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className={`w-8 h-8 rounded-lg border flex flex-col items-center justify-center gap-0.5 shrink-0 shadow-sm ${isFollowed ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
        <span className={`text-[10px] font-bold ${isFollowed ? 'text-emerald-500' : 'text-red-500'}`}>{isFollowed ? "✓" : "↻"}</span>
        {item.agent_rank && <span className={`text-[6px] font-mono font-black ${isFollowed ? 'text-emerald-400' : 'text-red-400'}`}>#{item.agent_rank}</span>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono font-bold text-slate-700 truncate mb-1">{item.task_name}</div>
        <div className="flex gap-1.5">
          <Tag label={item.slot} colorClass="text-slate-400 border-slate-100" />
          <Tag label={item.priority} colorClass={`${PRIORITY_COLOR[item.priority] || 'text-slate-400'} border-slate-100`} />
          <Tag label={etMeta.label} colorClass={`${etMeta.color} ${etMeta.border}`} />
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-[7px] font-mono font-bold text-slate-300 uppercase tracking-tighter mb-0.5">
           {item.started_at ? new Date(item.started_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
        </div>
        <div className={`text-[12px] font-mono font-black ${rColor}`}>
          {reward >= 0 ? "+" : ""}{reward}
        </div>
      </div>
    </div>
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────

export default function SayVsDoCard({ activeSlot = "Morning" }) {
  const { data, status, refetch } = useGapAnalysis(activeSlot);
  const [tab, setTab] = useState("overview");

  const stats      = data?.gap_stats;
  const comparison = data?.reward_comparison;
  const history    = data?.alignment_history ?? [];

  const delta      = stats?.reward_delta ?? 0;
  const advantage  = stats?.agent_advantage ?? false;
  const deltaColorClass = advantage ? "text-emerald-500" : delta < 0 ? "text-red-500" : "text-amber-500";
  const deltaBgClass    = advantage ? "bg-emerald-50 border-emerald-100" : delta < 0 ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100";

  return (
    <div className="relative font-['DM_Sans']">
      <style>{`
        @keyframes sv-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      `}</style>

      <div className="animate-[sv-in_0.45s_ease_both] bg-emerald-100 border border-slate-200 rounded-[14px] p-5 pb-4 w-full max-w-[400px] shadow-sm text-slate-800">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[9px] font-mono font-bold tracking-[2px] text-indigo-500 mb-1 uppercase">SAY VS DO GAP</div>
            <div className="font-['Syne'] text-[15px] font-extrabold tracking-tight">Following the Agent?</div>
            <div className="text-[9px] font-mono text-slate-400 mt-[2px]">last {data?.total_sessions ?? "—"} sessions · policy alignment</div>
          </div>

          {stats && (
            <div className={`p-2.5 rounded-xl border shadow-inner text-center min-w-[80px] ${deltaBgClass}`}>
              <div className="text-[7px] font-mono font-bold text-slate-400 mb-0.5 uppercase">REWARD DELTA</div>
              <div className={`text-[16px] font-mono font-black ${deltaColorClass}`}>{delta >= 0 ? "+" : ""}{delta}</div>
              <div className={`text-[6px] font-mono font-black uppercase ${deltaColorClass}`}>
                {advantage ? "agent leads" : delta < 0 ? "student leads" : "parity"}
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100 mb-4" />

        {/* Loading / Error States */}
        {status === "loading" && (
          <div className="text-center py-10">
            <div className="w-5 h-5 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
            <div className="text-[9px] font-mono text-slate-400 italic">Auditing Action-to-Reward mapping...</div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-8">
            <div className="text-[11px] font-mono text-red-500 mb-3 font-semibold uppercase">History Parsing Error</div>
            <button onClick={refetch} className="px-5 py-2 rounded-lg bg-red-50 border border-red-200 text-red-500 font-mono text-[10px] font-bold hover:bg-red-100 transition-colors uppercase">Re-run Analysis</button>
          </div>
        )}

        {status === "live" && data && (
          <>
            {data.total_sessions === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-50 rounded-xl">
                 <p className="text-[10px] font-mono text-slate-300 italic">No session history detected. Loop idle.</p>
              </div>
            ) : (
              <>
                {/* Summary Strip */}
                <div className="flex gap-2 mb-4">
                  <StatBox label="FOLLOW RATE" value={`${stats.follow_rate}%`} colorClass="text-indigo-500" bgClass="bg-indigo-50" sub={`${stats.follow_count}/${data.total_sessions} sess`} />
                  <StatBox label="AVG REWARD ✓" value={stats.avg_reward_followed} colorClass="text-emerald-500" bgClass="bg-emerald-50" sub="AI followed" />
                  <StatBox label="AVG REWARD ↻" value={stats.avg_reward_override} colorClass="text-red-400" bgClass="bg-red-50" sub="Overridden" />
                </div>

                {/* Callout */}
                <div className={`p-3 rounded-xl border mb-4 flex items-center justify-between shadow-sm ${advantage ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <div>
                    <div className={`text-[9px] font-mono font-black mb-0.5 ${advantage ? 'text-emerald-600' : 'text-red-600'}`}>
                      {advantage ? "✓ AI RECOMMENDATIONS OUTPERFORM OVERRIDES" : "↻ HUMAN INTUITION LEADS CURRENT CYCLE"}
                    </div>
                    <div className="text-[8px] font-mono text-slate-400">
                       Delta captures +{Math.abs(delta)} average reward per study session.
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5 mb-4 bg-slate-50 p-1 rounded-xl">
                  {["overview", "breakdown", "history"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all uppercase tracking-tighter ${
                        tab === t ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[220px]">
                  {tab === "overview" && (
                    <div className="animate-[sv-in_0.3s_ease_both] space-y-5">
                      {/* Focus Quality */}
                      <div>
                        <div className="text-[8px] font-mono font-black text-slate-400 mb-3 uppercase tracking-widest italic">Focus Quality Comparison</div>
                        {[
                          { l: "When AI followed", v: stats.avg_focus_followed, c: "bg-emerald-400", t: "text-emerald-600" },
                          { l: "When overridden",   v: stats.avg_focus_override, c: "bg-red-400",     t: "text-red-500" },
                        ].map((row) => (
                          <div key={row.l} className="mb-2">
                            <div className="flex justify-between mb-1">
                              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">{row.l}</span>
                              <span className={`text-[8px] font-mono font-black ${row.t}`}>{row.v}/5.0</span>
                            </div>
                            <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                              <div className={`h-full rounded-full ${row.c} opacity-70`} style={{ width: `${(row.v / 5) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Completion Rate */}
                      <div className="flex gap-2">
                        {[
                          { l: "AI Followed", v: stats.completion_followed, c: "text-emerald-500", bg: "bg-emerald-50" },
                          { l: "Overridden",  v: stats.completion_override, c: "text-red-500",     bg: "bg-red-50" },
                        ].map((row) => (
                          <div key={row.l} className={`flex-1 p-3 rounded-xl border border-black/5 text-center shadow-sm ${row.bg}`}>
                            <div className={`text-lg font-mono font-black ${row.c}`}>{row.v}%</div>
                            <div className="text-[7px] font-mono font-bold text-slate-400 uppercase mt-1">{row.l} Done</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tab === "breakdown" && comparison && (
                    <div className="animate-[sv-in_0.3s_ease_both]">
                      <div className="text-[8px] font-mono font-black text-slate-400 mb-4 uppercase tracking-widest italic flex items-center gap-2">
                        Avg Reward Source: <span className="text-emerald-500 underline underline-offset-2">■ AI</span> vs <span className="text-slate-300">■ Override</span>
                      </div>
                      <div className="space-y-1">
                        {comparison.components.map(c => (
                          <RewardBar key={c} component={c} followedVal={comparison.followed[c] ?? 0} overrideVal={comparison.override[c] ?? 0} />
                        ))}
                      </div>
                      <div className="mt-5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center shadow-inner">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase italic">Total Net Average</span>
                        <div className="flex gap-5">
                          <span className="text-sm font-mono font-black text-emerald-500">+{stats.avg_reward_followed}</span>
                          <span className="text-sm font-mono font-black text-red-400">+{stats.avg_reward_override}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === "history" && (
                    <div className="animate-[sv-in_0.3s_ease_both]">
                      <div className="max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                        {history.length === 0 ? (
                          <div className="text-center py-10 italic text-[10px] text-slate-300">Log empty</div>
                        ) : (
                          history.map(item => <AlignmentRow key={item.session_id} item={item} />)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Footer */}
        {/* <div className="mt-5 pt-3 border-t border-slate-50 flex justify-between">
          <span className="text-[7px] font-mono font-bold text-slate-300 uppercase tracking-tighter">Retroactive alignment · top-3 priority check</span>
          <span className="text-[7px] font-mono font-bold text-slate-300 uppercase tracking-tighter">Poll 20S</span>
        </div> */}
      </div>
    </div>
  );
}