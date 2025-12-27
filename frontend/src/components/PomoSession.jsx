import React, { useState, useEffect } from "react";
// Added new icons: Armchair, FastForward, Trash2, Clock
import { Play, Pause, Square, X, Star, CheckCircle, RotateCcw, Ban, ArrowLeft, Coffee, Armchair, FastForward, Trash2, Clock } from "lucide-react";
import { startSession, endSession } from "../api/sessions";
import { updateTaskStatus } from "../api/tasks";
import SessionSidebar from "./SessionSidebar";

const PomoSession = ({ task, onClose, onComplete, onUpdateTask }) => {
  // --- STATES ---
  // MODES: LOBBY | RUNNING | PAUSED | FEEDBACK | BREAK
  const [mode, setMode] = useState("LOBBY"); 
  const [seconds, setSeconds] = useState(0); 
  const [sessionId, setSessionId] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  
  // Feedback Data
  const [focusRating, setFocusRating] = useState(0);
  const [loading, setLoading] = useState(false);

  // Time Config
  const workDuration = 25 * 60; 
  const shortBreak = 5 * 60;    
  const longBreak = 15 * 60;

  // Session Logic
  // Track completed sessions locally to handle breaks correctly
  const [completedSessions, setCompletedSessions] = useState(task.sessions_count || 0);
  
  const currentWorkSessionNum = completedSessions + 1;
  const totalSessions = Math.max(task.estimated_pomodoros, currentWorkSessionNum);
  const isOvertime = currentWorkSessionNum > task.estimated_pomodoros;

  // --- ACTIONS ---

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const session = await startSession(task.id);
      setSessionId(session.id);
      setMode("RUNNING");
      // Ensure task is marked IN_PROGRESS when we start
      await updateTaskStatus(task.id, "IN_PROGRESS");
    } catch (err) {
      alert("Failed to start.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleResume = () => setMode("RUNNING");
  const handleStop = () => setMode("FEEDBACK");

  const handleRestart = async () => {
    if (!confirm("Restart timer? This session will be discarded.")) return;
    if (sessionId) {
      await endSession(sessionId, { 
        is_completed: false, 
        focus_rating: 1, 
        end_type: "ABORTED" 
      });
    }
    setSeconds(0);
    handleStart(); 
  };

  // TIMER
  useEffect(() => {
    let interval = null;
    if (mode === "RUNNING" || mode === "BREAK") {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode]);

  // Format MM:SS
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Break Logic
  const getBreakDuration = () => (completedSessions > 0 && completedSessions % 4 === 0) ? longBreak : shortBreak;
  const isBreakMode = mode === "BREAK";
  const breakTimeTotal = getBreakDuration();

  // --- SUBMIT LOGIC ---
  const handleSubmit = async (action) => {
    // action types: "DONE_TASK", "PAUSE_TASK", "DISCARD_SESSION", "START_BREAK", "SKIP_BREAK"
    
    if (!["SKIP_BREAK", "DISCARD_SESSION", "START_BREAK"].includes(action) && !focusRating && mode === "FEEDBACK") {
        alert("Please rate your focus!");
        return;
    }
    setLoading(true);

    try {
      // 1. Logic for Saving the WORK Session
      if (mode === "FEEDBACK") {
          const isTimerFinished = seconds >= workDuration;
          
          let endType = "STOPPED"; // Default (Partial work)
          if (isTimerFinished) endType = "COMPLETED";
          if (action === "DISCARD_SESSION") endType = "ABORTED"; 

          await endSession(sessionId, {
            is_completed: isTimerFinished,
            focus_rating: focusRating || 1,
            end_type: endType
          });

          // Increment count locally if valid work done
          if (action !== "DISCARD_SESSION" && isTimerFinished) {
              setCompletedSessions(prev => prev + 1);
          }
      }

      // 2. Navigation Logic
      if (action === "DONE_TASK") {
          await updateTaskStatus(task.id, "COMPLETED");
          if (onComplete) onComplete(task.id);
          onClose();
      }
      else if (action === "PAUSE_TASK") {
          // "Stop for now" -> Task remains IN_PROGRESS
          await updateTaskStatus(task.id, "IN_PROGRESS");
          if (onUpdateTask) onUpdateTask(); 
          onClose();
      }
      else if (action === "DISCARD_SESSION") {
          // "Retry Later" -> Task remains IN_PROGRESS, close window
          await updateTaskStatus(task.id, "IN_PROGRESS");
          onClose();
      }
      else if (action === "START_BREAK") {
          setSeconds(0);
          setMode("BREAK");
      } 
      else if (action === "SKIP_BREAK") {
          setSeconds(0);
          handleStart(); // Start next session immediately
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] text-white flex font-sans transition-colors duration-1000 ${isBreakMode ? "bg-slate-900" : "bg-gray-900"}`}>
      
      {/* SIDEBAR (Added prop for currentWorkSessionNum) */}
      <SessionSidebar
        totalSessions={totalSessions}
        currentSessionNum={currentWorkSessionNum}
        mode={mode}
      />
      
      <div className="flex-1 flex flex-col items-center justify-center relative">
        
        {/* HEADER */}
        <div className="absolute top-6 left-6 text-xl font-bold tracking-widest opacity-50 flex items-center gap-2">
          {isBreakMode ? <><Armchair size={24}/> BREAK TIME</> : <><Coffee size={24}/> FOCUS MODE</>}
        </div>
        
        {/* CLOSE BUTTON */}
        <button 
          onClick={() => mode === "LOBBY" ? onClose() : handleStop()} 
          className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full"
        >
          <X size={24} />
        </button>

        {/* --- LOBBY --- */}
        {mode === "LOBBY" && (
          <div className="text-center space-y-8 animate-in zoom-in duration-300">
            <div>
              <h2 className="text-gray-400 uppercase tracking-widest text-sm mb-2">Ready?</h2>
              <h1 className="text-4xl font-bold max-w-2xl">{task.name}</h1>
              <p className="mt-2 text-gray-500 font-medium">
                {isOvertime ? <span className="text-orange-400">Overtime Session</span> : `Session ${currentWorkSessionNum} of ${totalSessions}`}
              </p>
            </div>
            
            <button 
              onClick={handleStart}
              disabled={isStarting}
              className={`px-10 py-5 bg-white text-black font-bold text-xl rounded-full transition-all ${isStarting ? "opacity-50" : "hover:scale-105 shadow-xl shadow-white/10"}`}
            >
              {isStarting ? "STARTING..." : <span className="flex items-center gap-3"><Play size={24} fill="currentColor"/> START SESSION</span>}
            </button>
          </div>
        )}

        {/* --- TIMER (WORK OR BREAK) --- */}
        {(mode === "RUNNING" || mode === "PAUSED" || mode === "BREAK") && (
          <div className="text-center z-10 w-full max-w-4xl">
            <h2 className={`font-medium tracking-wide uppercase mb-6 ${isBreakMode ? "text-blue-300" : "text-gray-400"}`}>
                {isBreakMode 
                   ? (breakTimeTotal === longBreak ? "Long Break • Recharge" : "Short Break • Breathe") 
                   : task.name}
            </h2>
            
            {/* THE CLOCK */}
            <div className={`text-[140px] font-mono font-bold leading-none tabular-nums tracking-tighter drop-shadow-2xl 
                ${isBreakMode ? "text-blue-100" : "text-white"}`}>
              {isBreakMode 
                  ? formatTime(breakTimeTotal - seconds) // Count DOWN for break
                  : formatTime(seconds) // Count UP for work
              }
            </div>

            <div className="flex items-center gap-8 mt-16 justify-center">
              {isBreakMode ? (
                  <button 
                      onClick={() => handleSubmit("SKIP_BREAK")} 
                      className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-3 transition-all hover:scale-105 shadow-lg shadow-blue-900/50"
                  >
                      <FastForward size={24} fill="currentColor"/> Skip Break & Start Work
                  </button>
              ) : (
                  <>
                    <button onClick={handleRestart} className="p-4 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-all"><RotateCcw size={28} /></button>
                    <button
                      onClick={() => setMode(mode === "RUNNING" ? "PAUSED" : "RUNNING")}
                      className="w-24 h-24 flex items-center justify-center rounded-full bg-white text-gray-900 hover:scale-105 transition-all shadow-2xl shadow-white/10"
                    >
                      {mode === "RUNNING" ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={handleStop} className="p-4 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Square size={28} fill="currentColor" /></button>
                  </>
              )}
            </div>
          </div>
        )}

        {/* --- FEEDBACK --- */}
        {mode === "FEEDBACK" && (
          <div className="bg-gray-800 p-8 rounded-3xl max-w-lg w-full shadow-2xl animate-in fade-in slide-in-from-bottom-10 border border-gray-700 relative">
            
            <button onClick={handleResume} className="absolute top-4 left-4 text-gray-400 hover:text-white flex items-center gap-1 text-sm font-medium">
              <ArrowLeft size={16} /> Resume
            </button>

            <h2 className="text-2xl font-bold mb-2 text-center mt-4">Session Paused</h2>
            <p className="text-gray-400 text-center mb-6">Rate your focus level</p>
            
            {/* RATING */}
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setFocusRating(star)} className={`p-2 transition-all ${focusRating >= star ? "text-yellow-400 scale-110" : "text-gray-600 hover:text-gray-400"}`}>
                    <Star size={36} fill={focusRating >= star ? "currentColor" : "none"} />
                  </button>
              ))}
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3">
              
              {/* 1. START BREAK (If completed) */}
              <button onClick={() => handleSubmit("START_BREAK")} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                  <Coffee size={20} /> Take Break ({breakTimeTotal === longBreak ? "15m" : "5m"})
              </button>

              <div className="grid grid-cols-2 gap-3">
                 {/* 2. DONE */}
                 <button onClick={() => handleSubmit("DONE_TASK")} className="py-4 border border-green-600/50 text-green-400 hover:bg-green-600/10 rounded-xl font-bold flex items-center justify-center gap-2">
                   <CheckCircle size={20} /> Finished
                 </button>
                 
                 {/* 3. STOP FOR NOW */}
                 <button onClick={() => handleSubmit("PAUSE_TASK")} className="py-4 border border-gray-600 text-gray-400 hover:bg-gray-700 rounded-xl font-medium flex items-center justify-center gap-2">
                   <Clock size={20} /> Pause
                 </button>
              </div>

              {/* 4. DISCARD */}
              <button onClick={() => handleSubmit("DISCARD_SESSION")} className="w-full py-3 mt-2 text-red-400 hover:bg-red-900/10 rounded-xl font-medium flex items-center justify-center gap-2 text-sm">
                 <Trash2 size={16} /> Discard Session & Retry Later
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PomoSession;