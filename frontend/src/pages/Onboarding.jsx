import { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";

const SLOT_ORDER = ["morning", "afternoon", "evening"];

const SLOT_ICONS = {
  morning: "☀️",
  afternoon: "🌤️",
  evening: "🌙",
};

const CHRONOTYPES = [
  {
    id: "morning_bird",
    label: "Morning Bird",
    icon: "☀️",
    description: "I focus best before noon",
  },
  {
    id: "balanced",
    label: "Balanced",
    icon: "⚖️",
    description: "I study equally well throughout the day",
  },
  {
    id: "night_owl",
    label: "Night Owl",
    icon: "🌙",
    description: "I focus best in the evening",
  },
];

// ── Step 1: Chronotype ────────────────────────────────────────────────────────
function ChronotypeStep({ selected, onSelect }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">When do you study best?</h2>
      <p className="text-gray-400 text-sm">
        We'll pre-configure your study slots based on this.
      </p>
      <div className="grid gap-3">
        {CHRONOTYPES.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`p-4 rounded-xl text-left border-2 transition-all ${
              selected === c.id
                ? "border-teal-400 bg-teal-900/30"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-500"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{c.icon}</span>
              <div>
                <div className="font-semibold text-white">{c.label}</div>
                <div className="text-sm text-gray-400">{c.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Routine ───────────────────────────────────────────────────────────
function RoutineStep({ events, onAdd, onRemove }) {
  const [form, setForm] = useState({
    name: "",
    activity_type: "class",
    days: [],
    start_time: "09:00",
    end_time: "11:00",
  });

  const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  const handleAdd = () => {
    if (!form.name || form.days.length === 0) return;
    onAdd({ ...form });
    setForm({ name: "", activity_type: "class", days: [], start_time: "09:00", end_time: "11:00" });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Your weekly commitments</h2>
      <p className="text-gray-400 text-sm">
        Add classes, work, or other fixed events. Optional — skip if you prefer.
      </p>

      <div className="bg-gray-800 rounded-xl p-4 space-y-3">
        <input
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
          placeholder="Event name (e.g. Physics Lecture)"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <div className="flex gap-2">
          <select
            className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            value={form.activity_type}
            onChange={(e) => setForm((f) => ({ ...f, activity_type: e.target.value }))}
          >
            <option value="class">Class</option>
            <option value="work">Work</option>
            <option value="habit">Habit</option>
          </select>
          <input type="time" className="bg-gray-700 text-white rounded-lg px-2 py-2 text-sm"
            value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
          <span className="text-gray-400 self-center">–</span>
          <input type="time" className="bg-gray-700 text-white rounded-lg px-2 py-2 text-sm"
            value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {DAYS.map((day, i) => (
            <button key={day} onClick={() => toggleDay(day)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                form.days.includes(day)
                  ? "bg-teal-500 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}>
              {DAY_LABELS[i]}
            </button>
          ))}
        </div>
        <button onClick={handleAdd}
          className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors">
          + Add Event
        </button>
      </div>

      {events.length > 0 && (
        <div className="space-y-2">
          {events.map((e, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
              <div>
                <span className="text-white text-sm font-medium">{e.name}</span>
                <span className="text-gray-400 text-xs ml-2">
                  {e.start_time}–{e.end_time} · {e.days.join(", ")}
                </span>
              </div>
              <button onClick={() => onRemove(i)} className="text-gray-500 hover:text-red-400 text-sm">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Custom Slots ──────────────────────────────────────────────────────
function SlotsStep({ slots, onUpdateSlot }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Configure your study slots</h2>
      <p className="text-gray-400 text-sm">
        Set the name, time window, and capacity for each of your 3 study periods.
        These are pre-filled based on your chronotype — adjust as needed.
      </p>

      <div className="space-y-4">
        {SLOT_ORDER.map((slotName) => {
          const slot = slots.find((s) => s.slot_name === slotName);
          if (!slot) return null;

          return (
            <div key={slotName} className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2">
                <span className="text-xl">{SLOT_ICONS[slotName]}</span>
                <input
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium"
                  value={slot.slot_label}
                  onChange={(e) =>
                    onUpdateSlot(slotName, "slot_label", e.target.value)
                  }
                  placeholder="Slot name"
                />
              </div>

              {/* Time Range */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-12">From</span>
                <input
                  type="time"
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm"
                  value={slot.start_time}
                  onChange={(e) =>
                    onUpdateSlot(slotName, "start_time", e.target.value)
                  }
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="time"
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm"
                  value={slot.end_time}
                  onChange={(e) =>
                    onUpdateSlot(slotName, "end_time", e.target.value)
                  }
                />
              </div>

              {/* Capacity Slider */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Max sessions</span>
                  <span className="text-teal-400 font-bold">{slot.max_pomodoros}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={slot.max_pomodoros}
                  onChange={(e) =>
                    onUpdateSlot(slotName, "max_pomodoros", parseInt(e.target.value))
                  }
                  className="w-full accent-teal-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Onboarding Component ─────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [chronotype, setChronotype] = useState("");
  const [routineEvents, setRoutineEvents] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // When chronotype selected, fetch defaults and pre-populate slots
  const handleChronotypeSelect = async (value) => {
    setChronotype(value);
    try {
      const res = await axiosClient.get(`/onboarding/slot-defaults/${value}`);
      setSlots(res.data.slots);
    } catch {
      // Use hardcoded fallback if endpoint fails
      setSlots([
        { slot_name: "morning",   slot_label: "Morning",   start_time: "08:00", end_time: "12:00", max_pomodoros: 4 },
        { slot_name: "afternoon", slot_label: "Afternoon", start_time: "13:00", end_time: "17:00", max_pomodoros: 4 },
        { slot_name: "evening",   slot_label: "Evening",   start_time: "19:00", end_time: "22:00", max_pomodoros: 4 },
      ]);
    }
  };

  const updateSlot = (slotName, field, value) => {
    setSlots((prev) =>
      prev.map((s) => (s.slot_name === slotName ? { ...s, [field]: value } : s))
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await axiosClient.post("/onboarding/complete", {
        chronotype,
        routine_events: routineEvents,
        slots,
      });
      navigate("/user/home");
    } catch (err) {
      console.error("Onboarding error:", err);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return chronotype !== "";
    if (step === 2) return true; // routine is optional
    if (step === 3) return slots.length === 3 && slots.every(
      (s) => s.slot_label && s.start_time && s.end_time
    );
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n}
              className={`h-1 flex-1 rounded-full transition-colors ${
                n <= step ? "bg-teal-400" : "bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-72">
          {step === 1 && (
            <ChronotypeStep selected={chronotype} onSelect={handleChronotypeSelect} />
          )}
          {step === 2 && (
            <RoutineStep
              events={routineEvents}
              onAdd={(e) => setRoutineEvents((prev) => [...prev, e])}
              onRemove={(i) => setRoutineEvents((prev) => prev.filter((_, idx) => idx !== i))}
            />
          )}
          {step === 3 && (
            <SlotsStep slots={slots} onUpdateSlot={updateSlot} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors">
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors">
              Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canProceed() || loading}
              className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-semibold transition-colors">
              {loading ? "Setting up..." : "Finish Setup"}
            </button>
          )}
        </div>

        {step === 2 && (
          <button
            onClick={() => setStep(3)}
            className="w-full mt-2 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
            Skip this step
          </button>
        )}
      </div>
    </div>
  );
}