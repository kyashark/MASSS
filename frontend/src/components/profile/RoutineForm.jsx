import React, { useState, useEffect } from 'react';
import { Edit2, Plus, Save, X } from 'lucide-react';
import { addRoutineEvent, updateRoutineEvent } from '../../api/profile';

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ACTIVITY_TYPES = ["Class", "Sleep", "Habit", "Work"];
const EMPTY_FORM = {
  name: '', activity_type: 'Class',
  start_time: '09:00', end_time: '10:00', days: []
};

const RoutineForm = ({ editTarget, onAdd, onUpdate, onCancelEdit }) => {
  const isEditing = !!editTarget;
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editTarget) {
      setForm({
        name: editTarget.name,
        activity_type: editTarget.activity_type,
        start_time: editTarget.start_time.slice(0, 5),
        end_time: editTarget.end_time.slice(0, 5),
        days: [editTarget.day_of_week],
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editTarget]);

  const toggleDay = (day) => {
    if (isEditing) return;
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing && form.days.length === 0) {
      alert("Select at least one day.");
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        const updated = await updateRoutineEvent(editTarget.id, {
          name: form.name,
          activity_type: form.activity_type,
          start_time: form.start_time,
          end_time: form.end_time,
        });
        onUpdate(updated);
        onCancelEdit();
      } else {
        const newEvents = await addRoutineEvent(form);
        onAdd(newEvents);
        setForm(EMPTY_FORM);
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "9px 11px", borderRadius: 9,
    border: "1.5px solid #e2e8f0", fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", outline: "none",
    boxSizing: "border-box", color: "#0f172a", background: "#fff",
  };

  const labelStyle = {
    fontSize: 10, fontFamily: "DM Mono, monospace", color: "#64748b",
    fontWeight: 600, textTransform: "uppercase", letterSpacing: 1,
    display: "block", marginBottom: 5,
  };

  return (
    <div style={{
      background: "#fff",
      border: isEditing ? "1.5px solid #6366f1" : "1.5px solid #e2e8f0",
      borderRadius: 16, padding: "24px",
      boxShadow: isEditing ? "0 0 0 4px rgba(99,102,241,0.06)" : "0 1px 3px rgba(0,0,0,0.06)",
      transition: "all 0.2s",
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: isEditing ? "#eef2ff" : "#f0fdf4",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isEditing ? <Edit2 size={15} color="#6366f1" /> : <Plus size={15} color="#10b981" />}
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
            {isEditing ? `Editing: ${editTarget?.name}` : "Add New Event"}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "DM Mono, monospace" }}>
            {isEditing ? editTarget?.day_of_week : "Recurring weekly event"}
          </div>
        </div>
        {isEditing && (
          <button onClick={onCancelEdit} style={{
            marginLeft: "auto", background: "none", border: "none",
            cursor: "pointer", color: "#94a3b8", padding: 4, borderRadius: 6,
            display: "flex", alignItems: "center",
          }}>
            <X size={16} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Name + Type */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Activity Name</label>
            <input
              type="text" placeholder="e.g. Calculus Lecture"
              value={form.name} required
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select
              value={form.activity_type}
              onChange={e => setForm({ ...form, activity_type: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Times */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {["start_time", "end_time"].map(field => (
            <div key={field}>
              <label style={labelStyle}>{field === "start_time" ? "Start Time" : "End Time"}</label>
              <input
                type="time" value={form[field]} required
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                style={{ ...inputStyle, fontFamily: "DM Mono, monospace" }}
              />
            </div>
          ))}
        </div>

        {/* Day selector — always visible, interactive in add, read-only in edit */}
        <div>
          <label style={labelStyle}>
            Repeats On{" "}
            {isEditing && (
              <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                · day cannot be changed
              </span>
            )}
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DAYS.map((day, i) => {
              const selected = form.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => !isEditing && toggleDay(day)}
                  style={{
                    padding: "5px 10px", borderRadius: 20, fontSize: 11,
                    fontFamily: "DM Mono, monospace", fontWeight: 600,
                    border: selected ? "1.5px solid #6366f1" : "1.5px solid #e2e8f0",
                    background: selected ? "#6366f1" : "#f8fafc",
                    color: selected ? "#fff" : "#64748b",
                    cursor: isEditing ? "default" : "pointer",
                    opacity: isEditing && !selected ? 0.35 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {DAYS_SHORT[i]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={saving} style={{
          padding: "10px 18px", borderRadius: 10, border: "none",
          background: isEditing ? "#6366f1" : "#10b981",
          color: "#fff", fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 7, opacity: saving ? 0.7 : 1, transition: "opacity 0.2s",
        }}>
          {saving ? "Saving…"
            : isEditing ? <><Save size={15} /> Save Changes</>
            : <><Plus size={15} /> Add to Schedule</>}
        </button>

      </form>
    </div>
  );
};

export default RoutineForm;