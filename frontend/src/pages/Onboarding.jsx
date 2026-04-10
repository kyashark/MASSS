import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

// ── Step Data ─────────────────────────────────────────────────────────────────

const CHRONOTYPES = [
  {
    id: "MORNING_BIRD",
    label: "Morning Bird",
    icon: "☀️",
    description: "I focus best before noon",
    slots: { morning: 6, afternoon: 3, evening: 1 },
  },
  {
    id: "BALANCED",
    label: "Balanced",
    icon: "⚖️",
    description: "I study equally well throughout the day",
    slots: { morning: 4, afternoon: 4, evening: 4 },
  },
  {
    id: "NIGHT_OWL",
    label: "Night Owl",
    icon: "🌙",
    description: "I focus best in the afternoon and evening",
    slots: { morning: 1, afternoon: 4, evening: 6 },
  },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ACTIVITY_TYPES = ["Class", "Work", "Habit", "Sleep"];

// ── Sub Components ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i < current ? "bg-gray-900" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// ── Step 1: Chronotype ────────────────────────────────────────────────────────

function ChronotypeStep({ value, onChange }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        When do you study best?
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        This sets your initial energy profile. You can change it later.
      </p>

      <div className="space-y-3">
        {CHRONOTYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => onChange(type)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              value?.id === type.id
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{type.icon}</span>
              <div>
                <div className="font-semibold text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-500">{type.description}</div>
              </div>
              {value?.id === type.id && (
                <div className="ml-auto w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Weekly Routine ────────────────────────────────────────────────────

function RoutineStep({ events, onChange }) {
  const [form, setForm] = useState({
    name: "",
    activity_type: "Class",
    days: [],
    start_time: "09:00",
    end_time: "10:00",
  });

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const addEvent = () => {
    if (!form.name || form.days.length === 0) return;
    onChange([...events, { ...form, id: Date.now() }]);
    setForm({
      name: "",
      activity_type: "Class",
      days: [],
      start_time: "09:00",
      end_time: "10:00",
    });
  };

  const removeEvent = (id) => {
    onChange(events.filter((e) => e.id !== id));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Add your weekly schedule
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Classes, work, and fixed commitments. The AI uses this to avoid
        scheduling tasks during your busy times.
      </p>

      {/* Add Event Form */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="e.g. Physics Lecture"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900"
          />

          <select
            value={form.activity_type}
            onChange={(e) =>
              setForm({ ...form, activity_type: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white"
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={form.start_time}
              onChange={(e) =>
                setForm({ ...form, start_time: e.target.value })
              }
              className="px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
            />
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
            />
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex gap-1.5 flex-wrap">
          {DAYS.map((day, i) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                form.days.includes(day)
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-300"
              }`}
            >
              {DAYS_SHORT[i]}
            </button>
          ))}
        </div>

        <button
          onClick={addEvent}
          disabled={!form.name || form.days.length === 0}
          className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-opacity"
        >
          Add Event
        </button>
      </div>

      {/* Event List */}
      {events.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-4">
          No events added yet. You can skip this and add them later.
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {event.name}
                </div>
                <div className="text-xs text-gray-500">
                  {event.days.join(", ")} · {event.start_time}–{event.end_time}
                </div>
              </div>
              <button
                onClick={() => removeEvent(event.id)}
                className="text-gray-400 hover:text-red-500 text-xs font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Capacity ──────────────────────────────────────────────────────────

function CapacityStep({ capacity, onChange }) {
  const slots = [
    { key: "morning", label: "Morning", icon: "☀️", hours: "6am – 12pm" },
    { key: "afternoon", label: "Afternoon", icon: "🌤️", hours: "12pm – 6pm" },
    { key: "evening", label: "Evening", icon: "🌙", hours: "6pm – 12am" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Set your daily capacity
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        How many 25-minute study sessions can you do per slot?
        The AI will not schedule more than this.
      </p>

      <div className="space-y-6">
        {slots.map((slot) => (
          <div key={slot.key}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{slot.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {slot.label}
                  </div>
                  <div className="text-xs text-gray-400">{slot.hours}</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {capacity[slot.key]}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all duration-300"
                style={{ width: `${(capacity[slot.key] / 12) * 100}%` }}
              />
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={capacity[slot.key]}
              onChange={(e) =>
                onChange({ ...capacity, [slot.key]: parseInt(e.target.value) })
              }
              className="w-full accent-gray-900"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 sessions</span>
              <span>12 sessions</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Onboarding Page ──────────────────────────────────────────────────────

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [chronotype, setChronotype] = useState(null);
  const [routineEvents, setRoutineEvents] = useState([]);
  const [capacity, setCapacity] = useState({
    morning: 4,
    afternoon: 4,
    evening: 4,
  });

  const TOTAL_STEPS = 3;

  // When chronotype is selected, update capacity defaults
  const handleChronotypeChange = (selected) => {
    setChronotype(selected);
    setCapacity(selected.slots);
  };

  const handleNext = () => {
    if (step === 1 && !chronotype) {
      setError("Please select when you study best.");
      return;
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    setError("");

    try {
      await axiosClient.post("/onboarding/complete", {
        chronotype: chronotype.id,
        routine_events: routineEvents.map((e) => ({
          name: e.name,
          activity_type: e.activity_type,
          days: e.days,
          start_time: e.start_time,
          end_time: e.end_time,
        })),
        capacity: {
          morning: capacity.morning,
          afternoon: capacity.afternoon,
          evening: capacity.evening,
        },
      });

      navigate("/user/home");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await axiosClient.post("/onboarding/skip");
      navigate("/user/home");
    } catch {
      navigate("/user/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">
              Step {step} of {TOTAL_STEPS}
            </div>
            <div className="text-lg font-bold text-gray-900">
              Let's set up your profile
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip setup
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} total={TOTAL_STEPS} />

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {step === 1 && (
            <ChronotypeStep
              value={chronotype}
              onChange={handleChronotypeChange}
            />
          )}
          {step === 2 && (
            <RoutineStep
              events={routineEvents}
              onChange={setRoutineEvents}
            />
          )}
          {step === 3 && (
            <CapacityStep
              capacity={capacity}
              onChange={setCapacity}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              className="px-8 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-black transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="px-8 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Finish Setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;