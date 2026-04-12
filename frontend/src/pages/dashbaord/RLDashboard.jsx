// src/pages/ItemDashboard/ItemDashboard.jsx
import { useState } from "react";
import StateVectorCard from "../../components/dashboard/StateVectorCard";
import ActionProbCard from "../../components/dashboard/ActionProbCard";
import SessionRewardCard from "../../components/dashboard/SessionRewardCard";
import ActionBridgeCard from "../../components/dashboard/ActionBridgeCard";
import PomoSession from "../../components/PomoSession";
import PolicyAnalyticsCard from "../../components/dashboard/PolicyAnalyticsCard";
import SayVsDoCard from "../../components/dashboard/SayVsDoCard";
import { SLOTS, SLOT_LABELS } from "../../constants/enums";

// Detailed Research Data from Version 2
const PHASES = [
  {
    num: "01",
    tag: "OBSERVE",
    title: "What does the AI see right now?",
    subtitle: "State Vector s",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    plain:
      "Before making any decision, the AI reads your current situation — your slot capacity, cognitive fatigue, work intensity, and pending task features",
    technical:
      "605-dimensional observation vector. Encodes 50 tasks × 12 features + 5 environment signals (slot energy, fatigue, work_intensity). Fed to PPO policy network.",
  },
  {
    num: "02",
    tag: "DECIDE",
    title: "Which task should you work on?",
    subtitle: "Policy π(a|s)",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    plain:
      "The AI weighs your energy and task proximity to completion. It picks the action most likely to produce a productive session based on learned weights.",
    technical:
      "Softmax distribution (τ=0.6). Weights: completion_proximity (10.0), slot_bias (0-1.5), momentum (+5.0), urgency (1.0).",
  },
  {
    num: "03",
    tag: "LEARN",
    title: "Did the recommendation help?",
    subtitle: "Reward r(s,a)",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    plain:
      "After every session, the AI scores the outcome. High focus or completing urgent tasks earns higher rewards, training the AI to improve over time.",
    technical:
      "Reward r(s,a) = slot_energy_bonus + (W_FOCUS × rating) + (W_COMPLETION × urgency) - delay_penalty.",
  },
];

export default function ItemDashboard() {
  const [activeSlot, setActiveSlot] = useState("morning");
  const [pomodoroTask, setPomodoroTask] = useState(null);
  const [expanded, setExpanded] = useState({ 0: false, 1: false, 2: false });

  return (
    <div className="min-h-screen bg-slate-100 p-6 lg:p-10 font-['DM_Sans'] text-slate-900">
      {/* ── HEADER SECTION ────────────────────────────────────────── */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[15px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              RL ENGINE
            </span>
          </div>
          <h1 className="font-['Syne'] text-4xl lg:text-5xl font-extrabold tracking-tighter text-slate-800">
            AI Scheduler <span className="text-indigo-600">Dashboard</span>
          </h1>
        </div>

        {/* Slot Switcher from Version 2 Logic */}
        <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
          {SLOTS.map((slot) => (
            <button
              key={slot}
              onClick={() => setActiveSlot(slot)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSlot === slot
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {SLOT_LABELS[slot]}
            </button>
          ))}
        </div>
      </header>

      {/* ── PHASE 1: PERCEPTION ───────────────────────────────────── */}
      <section className="mb-12 ">
        <PhaseHeader
          data={PHASES[0]}
          isExpanded={expanded[0]}
          onToggle={() => togglePhase(0)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12  mt-6">
          {/* Left Column: Visual State Vector Summary */}
          <div className="lg:col-span-3">
            <StateVectorCard
              initialSlot={activeSlot}
              onSlotChange={setActiveSlot}
              activeSlot={activeSlot}
            />
          </div>

          {/* Right Column: Signal Deep Dive */}
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4 ">
            {/* Environmental Signal: Cognitive Fatigue */}
<SignalExplainCard
  title="🧠 Cognitive Fatigue"
  dim="dim_603"
  color="indigo"
  desc={
    <>
      <p className="text-[12px]">
        Measures <b>mental tiredness</b> using the student's last{" "}
        <b>5 focus ratings</b> and today's <b>schedule context</b>.
        Recent sessions influence the signal more using an{" "}
        <b>exponential time-decay</b> formula.
      </p>

      {/* STEP 1 */}
      <p className="mt-4 font-semibold text-slate-800 text-[12px]">
        Step 1 — Time Decay
      </p>
      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 my-2">
        <p className="text-sm font-mono text-indigo-900 text-center">
          W<sub>t</sub> = e<sup>-λ·Δt</sup> &nbsp; (λ = 0.5)
        </p>
      </div>

      <ul className="list-disc list-inside mt-1 mb-4 text-xs text-slate-600 space-y-1">
        <li>
          <b>W<sub>t</sub></b> – session weight (0.0–1.0)
        </li>
        <li>
          <b>λ (Lambda)</b> – decay rate (0.5)
        </li>
        <li>
          <b>Δt</b> – age of session in days
        </li>
      </ul>

      {/* STEP 2 */}
      <p className="font-semibold text-slate-800 text-[12px]">
        Step 2 — Weighted Average
      </p>
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 my-2 font-mono text-[11px] text-slate-700">
        fatigue<sub>raw</sub> = Σ(rating × weight) / Σ(weight)
      </div>

      {/* STEP 3 */}
      <p className="font-semibold text-slate-800 text-[12px]">
        Step 3 — Normalization
      </p>
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 my-2 font-mono text-[11px] text-slate-700">
        normalized = (fatigue<sub>raw</sub> − 1.0) / 4.0
      </div>

      {/* STEP 4 */}
      <p className="font-semibold text-slate-800 text-[12px]">
        Step 4 — Session Fatigue Signal
      </p>
      <div className="bg-green-50 p-3 rounded-lg border border-slate-200 my-2 font-mono text-[11px] text-slate-700">
      
          session_fatigue = 1.0 − normalized
     
        <p className="text-[10px] opacity-80">
          (1.0 = maximum exhaustion)
        </p>
      </div>

      {/* STEP 5 */}
      <p className="font-semibold text-slate-800 mt-4 text-[12px]">
        Step 5 — Schedule Aware Boost
      </p>

      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 my-2 space-y-1 font-mono text-[11px] text-indigo-900">
        <p>post_class = decay × duration_weight × activity_weight</p>
      </div>

      <ul className="list-disc list-inside mt-1 mb-3 text-xs text-slate-600 space-y-1">
        <li>
          <b>decay</b> = e<sup>−0.8 · hours_ago</sup> (fades over 3 hrs)
        </li>
        <li>
          <b>duration_weight</b> – 1hr = 0.33 · 3hr = 1.0
        </li>
        <li>
          <b>activity_weight</b> – CLASS 1.0 · WORK 0.7 · HABIT 0.3
        </li>
      </ul>

      {/* STEP 6 */}
      <p className="font-semibold text-slate-800 text-[12px]">
        Step 6 — Final Composite Signal
      </p>

      <div className="bg-indigo-600 text-white p-2 rounded-lg mt-2 text-center">
        <p className="text-sm font-mono">
          Final Fatigue Signal = min(1.0, session_fatigue + post_class × 0.40)
        </p>
      </div>

      <div className="bg-slate-100 text-slate-600 p-2 rounded-lg text-center text-[10px] font-mono italic mt-2">
        Combines behavioral fatigue with real-time schedule context
      </div>

      <div className="bg-slate-100 text-slate-600 p-2 rounded-lg text-center text-[10px] font-mono italic mt-2">
        Signal fires before any session starts — proactive signal for the RL state vector
      </div>
    </>
  }
/>

            {/* Environmental Signal: Work Intensity */}
            <SignalExplainCard
              // icon="🚀"
              title="🚀 Work Intensity"
              dim="dim_604"
              color="orange"
              desc={
                <>
                  <p className="text-[12px]">
                    Measures <b>overall workload pressure</b> based on
                    deadlines, remaining tasks, and difficulty.
                  </p>

                  <p className="mt-4 font-semibold text-slate-800 text-[12px]">
                    Work Intensity Formula
                  </p>
                  <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100 my-2">
                    <p className="text-[11px] font-mono text-orange-900 text-left">
                      WorkIntensity = (0.40 × Urgency) + (0.40 × Density) +
                      (0.20 × Difficulty)
                    </p>
                  </div>

                  <p className="font-semibold text-slate-800 text-[12px]">
                    Components
                  </p>
                  <ul className="list-disc list-inside mt-2 mb-4 text-xs text-slate-600 space-y-3">
                    <li>
                      <b>Urgency</b> – Based on task deadlines or exam due
                      dates. Fallback logic uses exam dates for tasks without
                      direct deadlines.
                    </li>
                    <li>
                      <div className="inline-block align-top">
                        <b>Density</b> – Measures remaining workload volume:
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1 font-mono text-[10px] text-slate-700">
                          Density = (RemainingPomodoros × 0.5) / 40
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 italic">
                          (0.5 = 30 min sessions | 40 = Weekly hour capacity)
                        </p>
                      </div>
                    </li>
                    <li>
                      <b>Difficulty</b> – Average difficulty of all pending
                      tasks (AvgDifficulty / 5).
                    </li>
                  </ul>

                  <p className="font-semibold text-slate-800 text-[12px]">
                    Crunch Mode
                  </p>
                  <div className="bg-orange-400 text-white p-3 rounded-lg mt-2 mb-4 text-sm font-mono">
                    <ul className="space-y-1 text-xs">
                      <li className="flex justify-between">
                        <span>Trigger Threshold</span>{" "}
                        <span className="font-bold">&gt; 0.80</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Reward Multiplier</span>{" "}
                        <span className="font-bold">1.5x</span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-[13px] text-slate-600 leading-relaxed italic border-t border-slate-100 pt-3">
                    In Crunch Mode, the AI prioritizes high-impact exam tasks
                    and reduces fatigue penalties to ensure critical goals are
                    met.
                  </p>
                </>
              }
            />

            {/* Task Processing Explanation */}
            <div className="md:col-span-2 bg-white border border-slate-300 p-5 rounded-2xl">
              <h4 className="text-slate-700 font-bold text-xs uppercase mb-2 tracking-wider">
                Neural Input Architecture: 605 Dimensions
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] leading-tight">
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">
                    1. Task Matrix (600)
                  </p>
                  <p className="text-slate-500">
                    Top 50 tasks × 12 features each. Includes One-Hot categories
                    and deadline urgency.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">
                    2. Slot Capacity (3)
                  </p>
                  <p className="text-slate-500">
                    Physical availability constraints for Morning, Afternoon,
                    and Evening (normalized /8).
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">
                    3. Global Context (2)
                  </p>
<p className="text-slate-500">
  Live Cognitive Fatigue (session history + class schedule) 
  and Work Intensity signals that modulate reward expectations.
</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PHASE 2: INFERENCE ────────────────────────────────────── */}
      <section className="mb-12">
        <PhaseHeader
          data={PHASES[1]}
          isExpanded={expanded[1]}
          onToggle={() => togglePhase(1)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Left Card */}
          <div className="lg:col-span-3">
            <ActionProbCard activeSlot={activeSlot} />
          </div>

          <div className="lg:col-span-6">
            <SignalExplainCard
              // icon="🎯"
              title="🎯 Action Probability Distribution π(a|s)"
              color="purple"
              desc={
                <>
                  <p className="text-[12px]">
                    This card shows how the trained <b>PPO policy</b> decides
                    the next task. The model converts the current{" "}
                    <b>605-dimension study state</b> into a probability
                    distribution over all possible actions.
                  </p>

                  <div className="mt-4 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                    <p className="font-bold text-purple-700 text-[10px] uppercase mb-1 text-[11px]">
                      AI Decision Flow
                    </p>
                    <p className="text-[11px] text-purple-900/70 font-mono text-[11px]">
                      605D State → Task Evaluation (5 Signals) → Policy Network
                      → Softmax → Ranked Tasks → Recommendation
                    </p>
                  </div>

                  <p className="mt-4 font-semibold text-slate-800 text-[12px]">
                    Task Evaluation (5 Decision Signals)
                  </p>
                  <ul className="list-disc list-inside mt-2 mb-4 text-slate-600 space-y-1 text-[12px]">
                    <li>
                      Completion Proximity – How close the task is to done (30%)
                    </li>
                    <li>
                      Slot Energy Bias – Matches your current energy level (30%)
                    </li>
                    <li>
                      Task Momentum – Rewards continuing tasks already in
                      progress (20%)
                    </li>
                    <li>
                      Deadline Urgency – Tasks with upcoming deadlines (10%)
                    </li>
                    <li>
                      Category Bias – Your recent success in this subject (10%)
                    </li>
                  </ul>

                  <p className="font-semibold text-slate-800 text-[12px]">
                    Policy Network
                  </p>
                  <p className="text-slate-600 mb-4 text-[12px]">
                    The neural network evaluates all actions (50 tasks) and
                    outputs raw scores called logits (z).
                  </p>

                  <p className="font-semibold text-slate-800 text-[12px]">
                    Softmax Probability Conversion
                  </p>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 my-2 text-center font-mono text-slate-700">
                    P(aᵢ) = e<sup>zᵢ</sup> / Σ e<sup>zⱼ</sup>
                  </div>
                  <ul className="list-disc list-inside mt-2 mb-4 text-slate-600 text-[12px]">
                    <li>
                      Softmax converts task scores into probabilities π(a|s).
                    </li>
                    <li>
                      All probabilities sum to <b>1</b>.
                    </li>
                    <li>
                      Higher probability → task expected to give higher reward.
                    </li>
                  </ul>

                  <p className="font-semibold text-slate-800 text-[12px]">
                    Example Output
                  </p>
                  <div className="bg-white border border-slate-100 rounded-lg p-3 mt-2 mb-4">
                    <ul className="space-y-1 text-[12px] font-mono">
                      <li className="flex justify-between">
                        <span>Draft Technical Report</span>{" "}
                        <span className="text-purple-600 font-bold">54%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Write Unit Tests</span>{" "}
                        <span className="text-slate-500">31%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Review Research Paper</span>{" "}
                        <span className="text-slate-500">9%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Break</span>{" "}
                        <span className="text-slate-400">6%</span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-[12px]">
                    Tasks are ranked by probability, and the highest probability
                    becomes the AI’s recommended next action. This visualization
                    makes the PPO decision process transparent.
                  </p>
                </>
              }
            />
          </div>

          {/* Right Card */}
          <div className="lg:col-span-3">
            <ActionBridgeCard
              activeSlot={activeSlot}
              onLaunchSession={(task) => setPomodoroTask(task)}
            />
          </div>
        </div>
      </section>

      {/* ── PHASE 3: EVALUATION ───────────────────────────────────── */}
      <section className="mb-12">
        <PhaseHeader
          data={PHASES[2]}
          isExpanded={expanded[2]}
          onToggle={() => togglePhase(2)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          <div className="lg:col-span-3">
            <SessionRewardCard />
          </div>
          <div className="lg:col-span-9">
            <SignalExplainCard
              icon="⭐"
              title="Session Reward"
              color="yellow"
              desc={
                <>
                  <p className="text-[12px]">
                    This card shows your <b>retroactive reward</b>—the AI's way
                    of grading your Pomodoro session. It helps the system learn
                    your productivity patterns.
                  </p>

                  <div className="mt-4 p-3 bg-yellow-50/50 rounded-xl border border-yellow-100">
                    <p className="font-bold text-yellow-700 text-[11px] uppercase mb-1">
                      Reward Breakdown
                    </p>
                    <ul className="grid grid-cols-2 gap-1 text-[11px] text-yellow-900/70 font-mono">
                      <li>• Completion</li>
                      <li>• Focus</li>
                      <li>• Energy</li>
                      <li>• Fatigue</li>
                    </ul>
                  </div>

                  <p className="mt-4 font-semibold text-slate-800 text-[12px]">
                    Relevant Formula
                  </p>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 my-2 text-center font-mono text-slate-700 text-[12px]">
                    TotalReward = (W<sub>comp</sub> × Completed) + (W
                    <sub>focus</sub> × Rating) + (W<sub>slot</sub> × Energy) −
                    (W<sub>fatigue</sub> × Penalty)
                  </div>

                  <p className="mt-4 font-semibold text-slate-800 text-[12px]">
                    Crunch Mode Multiplier
                  </p>
                  <ul className="list-disc list-inside mt-2 mb-4 text-slate-600 space-y-1 text-[12px]">
                    <li>If Academic Pressure &gt; 80%, reward × 1.5</li>
                    <li>Prioritizes urgent, high-stakes tasks (e.g., exams)</li>
                  </ul>

                  <p className="font-semibold text-slate-800 text-[12px]">
                    Dashboard Insights
                  </p>
                  <ul className="list-disc list-inside mt-2 mb-4 text-slate-600 space-y-1 text-[12px]">
                    <li>
                      Only active reward components are shown; zeros are hidden
                      for clarity.
                    </li>
                    <li>
                      Completion usually dominates the reward (e.g., 59% from
                      completion bonus).
                    </li>
                    <li>
                      Focus feedback reinforces quality of work as part of the
                      learning signal.
                    </li>
                    <li>
                      Max reward: 39 in Crunch Mode. Min reward: negative if
                      overdue or fatigued.
                    </li>
                    <li>
                      Immediate feedback loop: rewards are shown right after
                      session ends to guide the AI’s future decisions.
                    </li>
                  </ul>
                </>
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          <div className="lg:col-span-3">
            <SayVsDoCard activeSlot={activeSlot} />
          </div>
          <div className="lg:col-span-9">
            <SignalExplainCard
              icon="📊"
              title="AI vs. Your Choices"
              color="teal"
              desc={
                <>
                  <p className="text-[12px]">
                    Tracks <b>Behavioral Alignment</b>: Does following the AI’s
                    top recommendation produce better results than selecting
                    your own task?
                  </p>

                  <p className="mt-4 font-semibold text-slate-800 text-[12px]">
                    Relevant Formula
                  </p>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 my-2 text-center font-mono text-slate-700 text-[12px]">
                    Reward Delta = Avg(Followed Reward) − Avg(Overridden Reward)
                  </div>

                  <div className="mt-4 space-y-3">
                    <ul className="list-disc list-inside text-slate-600 text-[12px] space-y-1">
                      <li>
                        <span className="font-semibold text-slate-800">
                          Positive Delta (+)
                        </span>{" "}
                        – The AI’s recommendations outperform manual choices.
                      </li>
                      <li>
                        <span className="font-semibold text-slate-800">
                          Negative Delta (-)
                        </span>{" "}
                        – Your choices performed better; the AI uses this as a{" "}
                        <i>training signal</i> to improve.
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                    <p className="font-bold text-teal-700 text-[11px] uppercase mb-1">
                      How the AI Learns (PPO)
                    </p>
                    <p className="text-[11px] text-teal-900/70 leading-relaxed">
                      Each time you <b>Override</b> the AI, the policy network
                      records your state, chosen action, and resulting reward.
                      If your choice leads to high completion and focus, the AI
                      updates its probabilities to favor similar tasks in the
                      future—adapting to your personal productivity patterns.
                    </p>
                  </div>

                  <p className="mt-4 text-slate-600 leading-relaxed text-[12px]">
                    This visualization makes the Reinforcement Learning process
                    transparent by showing exactly where the model's predictions
                    differ from your actual behavior.
                  </p>
                </>
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
           <div className="lg:col-span-4">
            <PolicyAnalyticsCard activeSlot={activeSlot} />
           </div>
           <div className="lg:col-span-8">
  <SignalExplainCard
  icon="📈"
  title="28-Day Slot Drift"
  color="violet"
  desc={
    <>
      <p className="text-[12px]">
        Tracks how well the AI learns your <b>Peak Productivity Slots</b> by comparing predicted performance vs. actual results over the last 28 days.
      </p>

      <p className="mt-4 font-semibold text-slate-800 text-[12px]">
        Computation Logic
      </p>
      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 my-2 text-center font-mono text-slate-700 text-[11px]">
        Score = (0.4C + 0.3Q + 0.15S + 0.15F) + Context Energy
      </div>
      <p className="text-[11px] text-slate-500 italic px-1">
        <b>Drift (Δ):</b> The gap between what the AI <i>expected</i> and what actually <i>happened</i>.
      </p>

      <div className="mt-4">
        <p className="font-semibold text-slate-800 text-[12px]">Example Trends</p>
        <ul className="list-disc list-inside mt-2 text-slate-600 space-y-1 text-[12px]">
          <li>Morning ↓ 3.3 – Declining; AI may schedule fewer tasks</li>
          <li>Afternoon → 3.3 – No change; insufficient evidence</li>
          <li>Evening ↑ 3.4 – Improving; AI marks this as a peak slot</li>
        </ul>
        
        <div className="mt-3 pt-2 border-t border-slate-100 space-y-1 text-[11px] italic text-slate-400">
          <p>• <b>Legend:</b> ↑ improving | ↓ declining | → no change</p>
          <p>• <b>Stages:</b> Early → Adapting → Strong Learning</p>
          <p>• Flat lines indicate low usage (&lt;5%) and slower adaptation.</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-violet-50/50 rounded-xl border border-violet-100">
        <p className="font-bold text-violet-700 text-[11px] uppercase mb-1">
          The Learning Loop
        </p>
        <p className="text-[11px] text-violet-900/70 leading-relaxed">
          The <b>Value Function</b> evaluates each slot. If your focus drops, the "Drift" signals the AI to stop being biased toward old habits and adapt to your new routine.
        </p>
      </div>
    </>
  }
/>
           </div>
          
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="mt-20 pt-10 border-t border-slate-200 flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {["PPO", "FastAPI", "PostgreSQL", "React"].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-mono text-slate-500"
            >
              {tech}
            </span>
          ))}
        </div>
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest italic">
          MDP Loop Verified · Proximal Policy Optimization Active
        </p>
      </footer>

      {/* ── OVERLAYS ─────────────────────────────────────────────── */}
      {pomodoroTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-300">
            <PomoSession
              task={pomodoroTask}
              onClose={() => setPomodoroTask(null)}
              onComplete={() => setPomodoroTask(null)}
              onUpdateTask={() => setPomodoroTask(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── HELPER COMPONENTS ──────────────────────────────────────────────

function PhaseHeader({ data, isExpanded, onToggle }) {
  return (
    <div
      className={`rounded-3xl border transition-all duration-300 bg-white ${isExpanded ? "shadow-xl" : "shadow-sm"}`}
    >
      <div className="flex items-center gap-4 p-5 lg:p-6">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${data.bgColor} ${data.color}`}
        >
          {data.num}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${data.color} ${data.bgColor} ${data.borderColor}`}
            >
              Phase {data.num} · {data.tag}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {data.subtitle}
            </span>
          </div>
          <h2 className="font-['Syne'] text-xl font-bold text-slate-800">
            {data.title}
          </h2>
        </div>
        <button
          onClick={onToggle}
          className="px-4 py-2 rounded-xl text-[10px] font-black border border-slate-200 hover:bg-slate-50 transition-colors uppercase tracking-widest"
        >
          {isExpanded ? "Close Info" : "Explain AI"}
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-slate-100">
          <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100">
            <h5 className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">
              Plain English
            </h5>
            <p className="text-sm text-slate-600 leading-relaxed">
              {data.plain}
            </p>
          </div>
          <div className="p-6 bg-slate-50/50">
            <h5
              className={`text-[10px] font-black uppercase mb-2 tracking-widest ${data.color}`}
            >
              Technical Architecture
            </h5>
            <p className="text-[11px] font-mono text-slate-500 leading-relaxed">
              {data.technical}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SignalExplainCard({ icon, title, dim, color, desc }) {
  return (
    <div className="px-6 py-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex gap-4 items-start">
      <div className="text-xl">{icon}</div>{" "}
      {/* Re-enabled icon for better visual context */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-slate-800">{title}</span>
          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded bg-${color}-50 text-${color}-600 border border-${color}-100 uppercase`}
          >
            {dim}
          </span>
        </div>
        {/* Changed from <p> to <div> to allow complex children */}
        <div className="leading-normal text-slate-600">{desc}</div>
      </div>
    </div>
  );
}

function WeightRow({ label, sig, weight, color }) {
  const colorClasses = {
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    indigo: "text-indigo-600",
    orange: "text-orange-600",
  };
  return (
    <div className="flex justify-between items-center py-1 border-b border-amber-900/5">
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-slate-700">{label}</span>
        <span className="text-[8px] font-mono text-slate-400">{sig}</span>
      </div>
      <span className={`text-xs font-black font-mono ${colorClasses[color]}`}>
        {weight}
      </span>
    </div>
  );
}
