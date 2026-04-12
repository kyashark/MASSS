import React from 'react';
import { Zap, Check, Star } from 'lucide-react';
import { updatePreference } from '../../api/profile';
import { SLOTS, SLOT_LABELS } from '../../constants/enums';

const SLOT_NAMES = SLOTS;

const SLOT_META = {
  morning:   { icon: "☀️", hours: "06:00 – 12:00", color: "#f59e0b" },
  afternoon: { icon: "🌤️", hours: "12:00 – 18:00", color: "#6366f1" },
  evening:   { icon: "🌙", hours: "18:00 – 24:00", color: "#8b5cf6" },
};

const SlotPreferences = ({ preferences, onChange }) => {
  const getPref = (slot, field) => {
    const found = preferences.find(p => p.slot_name === slot);
    return found ? found[field] : (field === 'max_pomodoros' ? 4 : false);
  };

  const handleChange = async (slot, field, value) => {
    const payload = {
      slot_name: slot,
      max_pomodoros: field === 'max_pomodoros' ? parseInt(value) : getPref(slot, 'max_pomodoros'),
      is_preferred: field === 'is_preferred' ? value : getPref(slot, 'is_preferred'),
    };
    // Optimistic update
    onChange(slot, payload);
    try {
      await updatePreference(payload);
    } catch (err) {
      console.error("Failed to update preference", err);
    }
  };

  return (
    <div style={{
      background: "#fff", border: "1.5px solid #e2e8f0",
      borderRadius: 16, padding: "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      position: "sticky", top: 24,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: "#fffbeb",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Zap size={15} color="#f59e0b" />
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
            Energy Buckets
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "DM Mono, monospace" }}>
            1 session = 25 min
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {SLOT_NAMES.map(slot => {
          const maxPomo = getPref(slot, 'max_pomodoros');
          const isPref = getPref(slot, 'is_preferred');
          const meta = SLOT_META[slot];
          const fillPct = (maxPomo / 12) * 100;

          return (
            <div key={slot} style={{
              padding: "16px", borderRadius: 12,
              border: isPref ? `1.5px solid ${meta.color}40` : "1.5px solid #f1f5f9",
              background: isPref ? `${meta.color}06` : "#f8fafc",
              transition: "all 0.2s",
            }}>
              {/* Slot header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{meta.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
                      {SLOT_LABELS[slot] || slot}
                    </div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: "#94a3b8" }}>
                      {meta.hours}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 22, color: meta.color, lineHeight: 1 }}>
                  {maxPomo}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 99, background: "#e2e8f0", overflow: "hidden", marginBottom: 8 }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  width: `${fillPct}%`, background: meta.color,
                  transition: "width 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                }} />
              </div>

              {/* Range slider */}
              <input
                type="range" min="0" max="12" step="1"
                value={maxPomo}
                onChange={e => handleChange(slot, 'max_pomodoros', e.target.value)}
                style={{ width: "100%", accentColor: meta.color, cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "DM Mono, monospace", fontSize: 9, color: "#cbd5e1", marginTop: 2 }}>
                <span>0</span><span>Sessions</span><span>12</span>
              </div>

              {/* Peak energy toggle */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                  <div
                    onClick={() => handleChange(slot, 'is_preferred', !isPref)}
                    style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: isPref ? `2px solid ${meta.color}` : "2px solid #cbd5e1",
                      background: isPref ? meta.color : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    {isPref && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#475569" }}>
                    Mark as <span style={{ fontWeight: 700, color: meta.color }}>Peak Energy</span> slot
                  </span>
                  {isPref && <Star size={11} color={meta.color} fill={meta.color} style={{ marginLeft: "auto" }} />}
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* RL note */}
      <div style={{ marginTop: 16, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: 9, color: "#94a3b8", lineHeight: 1.5 }}>
          🤖 These preferences feed into the RL engine's slot capacity map (dim_551–553).
          Peak Energy slots receive a higher slot_bias weight in Card 2.
        </div>
      </div>
    </div>
  );
};

export default SlotPreferences;