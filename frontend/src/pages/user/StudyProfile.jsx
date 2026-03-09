import React, { useState, useEffect } from 'react';
import { fetchRoutine, fetchPreferences } from '../../api/profile';
import RoutineForm from "../../components/profile/RoutineForm.jsx"; ;
import WeeklySchedule from '../../components/profile//WeeklySchedule';
import SlotPreferences from '../../components/profile//SlotPreferences';

const StudyProfile = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [routineData, prefData] = await Promise.all([
          fetchRoutine(),
          fetchPreferences(),
        ]);
        setEvents(routineData);
        setPreferences(prefData);
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAdd = (newEvents) =>
    setEvents(prev => [...prev, ...newEvents]);

  const handleUpdate = (updated) =>
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));

  const handleDelete = (id) =>
    setEvents(prev => prev.filter(e => e.id !== id));

  const handleStartEdit = (event) => {
    setEditTarget(event);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrefChange = (slot, payload) => {
    setPreferences(prev => {
      const filtered = prev.filter(p => p.slot_name !== slot);
      return [...filtered, { ...payload, user_id: 0, id: 0, inferred_energy_score: 0.5 }];
    });
  };

  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "60vh", fontFamily: "DM Mono, monospace",
      color: "#94a3b8", fontSize: 13,
    }}>
      Loading profile…
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 99px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 99px; background: currentColor; cursor: pointer; }
      `}</style>

      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "32px 24px",
        fontFamily: "'DM Sans', sans-serif", minHeight: "100vh",
        background: "#f8fafc",
      }}>
        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: "DM Mono, monospace", fontSize: 10, color: "#6366f1",
            fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6,
          }}>
            Student Profile
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>
            Weekly Schedule & Energy
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>
            Manage your fixed commitments. The RL engine reads this to predict post-class fatigue.
          </p>
        </div>

        {/* 3-column layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 300px",
          gap: 20,
          alignItems: "start",
        }}>
          <RoutineForm
            editTarget={editTarget}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onCancelEdit={() => setEditTarget(null)}
          />

          <WeeklySchedule
            events={events}
            onEdit={handleStartEdit}
            onDelete={handleDelete}
          />

          <SlotPreferences
            preferences={preferences}
            onChange={handlePrefChange}
          />
        </div>
      </div>
    </>
  );
};

export default StudyProfile;