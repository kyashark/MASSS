import React, { useState } from 'react';
import { Calendar, Edit2, Trash2, BookOpen, Moon, Briefcase, Activity } from 'lucide-react';
import { deleteRoutineEvent } from '../../api/profile';

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ACTIVITY_META = {
  Class:  { icon: BookOpen,  color: "#6366f1", bg: "#eef2ff" },
  Sleep:  { icon: Moon,      color: "#8b5cf6", bg: "#f5f3ff" },
  Work:   { icon: Briefcase, color: "#f59e0b", bg: "#fffbeb" },
  Habit:  { icon: Activity,  color: "#10b981", bg: "#ecfdf5" },
};

const WeeklySchedule = ({ events, onEdit, onDelete }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    setDeletingId(id);
    try {
      await deleteRoutineEvent(id);
      onDelete(id);
    } catch (err) {
      alert("Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{
      background: "#fff", border: "1.5px solid #e2e8f0",
      borderRadius: 16, padding: "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: "#f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Calendar size={15} color="#64748b" />
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
            Weekly Routine
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "DM Mono, monospace" }}>
            {events.length} event{events.length !== 1 ? "s" : ""} scheduled
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
          <Calendar size={32} color="#e2e8f0" style={{ margin: "0 auto 10px" }} />
          <p style={{ fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            No events yet. Add your first class or activity.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {DAYS.map(day => {
            const dayEvents = events
              .filter(e => e.day_of_week === day)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));
            if (dayEvents.length === 0) return null;

            return (
              <div key={day}>
                <div style={{
                  fontSize: 10, fontFamily: "DM Mono, monospace",
                  color: "#94a3b8", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: 2, marginBottom: 8,
                }}>
                  {day}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {dayEvents.map(event => {
                    const meta = ACTIVITY_META[event.activity_type] || ACTIVITY_META.Habit;
                    const Icon = meta.icon;
                    return (
                      <div key={event.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 14px", borderRadius: 10,
                        background: meta.bg, border: `1.5px solid ${meta.color}20`,
                        opacity: deletingId === event.id ? 0.4 : 1,
                        transition: "opacity 0.2s",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: `${meta.color}18`, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Icon size={14} color={meta.color} />
                          </div>
                          <div>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
                              {event.name}
                            </div>
                            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: "#64748b", marginTop: 1 }}>
                              {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
                              <span style={{
                                marginLeft: 8, padding: "1px 6px", borderRadius: 10,
                                background: `${meta.color}18`, color: meta.color,
                                fontSize: 9, fontWeight: 700,
                              }}>
                                {event.activity_type}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 4 }}>
                          {[
                            { icon: Edit2, hoverColor: "#6366f1", action: () => onEdit(event), title: "Edit" },
                            { icon: Trash2, hoverColor: "#ef4444", action: () => handleDelete(event.id), title: "Delete" },
                          ].map(({ icon: Icon2, hoverColor, action, title }) => (
                            <button key={title} onClick={action} title={title}
                              style={{ padding: 6, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = hoverColor; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
                            >
                              <Icon2 size={13} />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeeklySchedule;