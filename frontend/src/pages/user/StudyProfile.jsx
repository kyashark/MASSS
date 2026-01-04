import React, { useState, useEffect } from 'react';
import { 
  Calendar, Zap, Trash2, Plus, Save, 
  BookOpen, Moon, Briefcase, Activity, Edit2, X 
} from 'lucide-react';

// Import the API functions we just created
import { 
  fetchRoutine, addRoutineEvent, updateRoutineEvent, 
  deleteRoutineEvent, fetchPreferences, updatePreference 
} from '../../api/profile'; 

// --- Constants ---
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ACTIVITY_TYPES = ["Class", "Sleep", "Habit", "Work"];
const SLOT_NAMES = ["Morning", "Afternoon", "Evening"];

const StudentProfile = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [preferences, setPreferences] = useState([]);
  
  // --- Form State ---
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null); 
  const [formData, setFormData] = useState({
    name: '',
    activity_type: 'Class',
    start_time: '09:00',
    end_time: '10:00',
    days: [] 
  });

  // --- 1. DATA FETCHING ---
  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch both routine and preferences in parallel
      const [routineData, prefData] = await Promise.all([
        fetchRoutine(),
        fetchPreferences()
      ]);
      setEvents(routineData);
      setPreferences(prefData);
    } catch (error) {
      console.error("Failed to load profile data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- 2. FORM HANDLERS ---

  // Handle Day Selection (Only allowed in Add mode)
  const handleDayToggle = (day) => {
    if (isEditing) return; 
    setFormData(prev => {
      const isSelected = prev.days.includes(day);
      return { 
        ...prev, 
        days: isSelected ? prev.days.filter(d => d !== day) : [...prev.days, day] 
      };
    });
  };

  // Populate Form for Editing
  const startEdit = (event) => {
    setIsEditing(true);
    setEditId(event.id);
    setFormData({
      name: event.name,
      activity_type: event.activity_type,
      start_time: event.start_time.slice(0, 5), // Ensure HH:MM format
      end_time: event.end_time.slice(0, 5),
      days: [event.day_of_week] // Visual only, cannot change day in edit
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: '', activity_type: 'Class', start_time: '09:00', end_time: '10:00', days: [] });
  };

  // Submit (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // --- UPDATE ---
        const updatedEvent = await updateRoutineEvent(editId, {
          name: formData.name,
          activity_type: formData.activity_type,
          start_time: formData.start_time,
          end_time: formData.end_time
        });
        
        // Update local state without reloading
        setEvents(prev => prev.map(ev => ev.id === editId ? updatedEvent : ev));
        cancelEdit();
      } else {
        // --- ADD ---
        if (formData.days.length === 0) return alert("Select at least one day.");
        
        const newEvents = await addRoutineEvent(formData);
        
        // Add new events to local list
        setEvents(prev => [...prev, ...newEvents]);
        cancelEdit();
      }
    } catch (err) {
      console.error("Failed to save routine", err);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await deleteRoutineEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  // --- 3. PREFERENCE HANDLERS ---

  const getPrefValue = (slotName, field) => {
    const found = preferences.find(p => p.slot_name === slotName);
    if (found) return found[field];
    return field === 'max_pomodoros' ? 4 : false; 
  };

  const handlePreferenceChange = async (slotName, field, value) => {
    // 1. Get current values to preserve the other field
    const currentMax = getPrefValue(slotName, 'max_pomodoros');
    const currentPreferred = getPrefValue(slotName, 'is_preferred');

    const payload = {
      slot_name: slotName,
      max_pomodoros: field === 'max_pomodoros' ? parseInt(value) : currentMax,
      is_preferred: field === 'is_preferred' ? value : currentPreferred
    };

    // 2. Optimistic UI Update (Update state before API returns)
    setPreferences(prev => {
      const filtered = prev.filter(p => p.slot_name !== slotName);
      return [...filtered, { ...payload, user_id: 0, id: 0 }];
    });

    // 3. API Call
    try {
      await updatePreference(payload);
    } catch (err) {
      console.error("Failed to update preference", err);
      // Ideally rollback state here if it fails
    }
  };

  // --- UI HELPERS ---
  const getIconForType = (type) => {
    switch(type) {
      case 'Class': return <BookOpen size={16} className="text-blue-500" />;
      case 'Sleep': return <Moon size={16} className="text-purple-500" />;
      case 'Work': return <Briefcase size={16} className="text-orange-500" />;
      default: return <Activity size={16} className="text-green-500" />;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
        <p className="text-gray-600">Manage your weekly commitments and energy levels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Routine Form & List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* EDITOR / ADD FORM */}
          <div className={`bg-white p-6 rounded-xl shadow-sm border ${isEditing ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-200'}`}>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              {isEditing ? <Edit2 className="text-blue-600" size={20}/> : <Plus className="text-green-600" size={20}/>}
              {isEditing ? "Edit Event" : "Add New Event"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase">Activity Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Calculus Lecture" 
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase">Type</label>
                    <select 
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.activity_type}
                      onChange={e => setFormData({...formData, activity_type: e.target.value})}
                    >
                    {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-bold uppercase">Start Time</label>
                  <input 
                    type="time" 
                    className="w-full border p-2 rounded"
                    value={formData.start_time}
                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                    required 
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-bold uppercase">End Time</label>
                  <input 
                    type="time" 
                    className="w-full border p-2 rounded"
                    value={formData.end_time}
                    onChange={e => setFormData({...formData, end_time: e.target.value})}
                    required 
                  />
                </div>
              </div>

              {!isEditing && (
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase block mb-2">Repeats On</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                          ${formData.days.includes(day) 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" className={`flex-1 py-2 rounded-lg text-white font-medium flex justify-center items-center gap-2 
                    ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                  {isEditing ? <Save size={18} /> : <Plus size={18} />} 
                  {isEditing ? "Save Changes" : "Add to Schedule"}
                </button>
                
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={cancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center gap-1"
                  >
                    <X size={16} /> Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* WEEKLY SCHEDULE LIST */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                 <Calendar className="text-gray-500" size={20} /> Weekly Routine
            </h2>
            <div className="space-y-6">
              {DAYS.map(day => {
                const dayEvents = events.filter(e => e.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
                if (dayEvents.length === 0) return null;

                return (
                  <div key={day} className="border-b last:border-0 pb-4 last:pb-0">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{day}</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {dayEvents.map(event => (
                        <div key={event.id} className="group flex items-center justify-between bg-gray-50 hover:bg-blue-50 p-3 rounded-lg border border-gray-100 transition-colors">
                          <div className="flex items-center gap-4">
                            {getIconForType(event.activity_type)}
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{event.name}</p>
                              <p className="text-xs text-gray-500 font-mono">
                                {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => startEdit(event)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-full transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(event.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-full transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {events.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                    <p>No classes or activities added yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Preferences */}
        {/* <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <div className="mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="text-yellow-500" /> Energy Buckets
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                    Set your session capacity (1 Session = 25m).
                </p>
            </div>

            <div className="space-y-6">
              {SLOT_NAMES.map(slot => {
                const maxPomo = getPrefValue(slot, 'max_pomodoros');
                const isPref = getPrefValue(slot, 'is_preferred');

                return (
                  <div key={slot} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-bold text-gray-700">{slot}</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {maxPomo}
                      </span>
                    </div>
                    
                    <input 
                      type="range" min="0" max="12" step="1"
                      value={maxPomo}
                      onChange={(e) => handlePreferenceChange(slot, 'max_pomodoros', e.target.value)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0</span>
                        <span>Sessions</span>
                        <span>12</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                        <input 
                            type="checkbox"
                            checked={isPref}
                            onChange={(e) => handlePreferenceChange(slot, 'is_preferred', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                        />
                        Mark as <span className="font-semibold text-yellow-600">Peak Energy</span>
                        </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div> */}

      </div>
    </div>
  );
};

export default StudentProfile;