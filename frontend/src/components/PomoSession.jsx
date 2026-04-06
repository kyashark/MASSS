// components/PomoSession.jsx

import React, { useState, useEffect } from "react";
import { Play, Pause, Square, X, RotateCcw, FastForward, Armchair, Coffee } from "lucide-react";
import { startSession, endSession } from "../api/sessions";
import { updateTaskStatus } from "../api/tasks";
import SessionSidebar from "./SessionSideBar";
import SessionFeedbackForm from "./SessionFeedbackForm";

const PomoSession = ({ 
  task, 
  onClose, 
  onComplete, 
  onUpdateTask,
  initialSessionCount, 
  totalSessionOverride 
}) => {
  // --- STATES ---
  const [mode, setMode] = useState("LOBBY"); // LOBBY, RUNNING, PAUSED, FEEDBACK, BREAK, BREAK_PROMPT
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- CONFIG ---
  const workDuration = 5;      // Debug
  const shortBreak = 2;        // Debug
  const longBreak = 4;         // Debug
  // const workDuration = 25 * 60;   
  // const shortBreak = 5 * 60;      
  // const longBreak = 10 * 60;      

  // --- SESSION COUNT LOGIC ---
  const [completedSessions, setCompletedSessions] = useState(
    initialSessionCount !== undefined ? initialSessionCount : (task.sessions_count || 0)
  );

  const currentWorkSessionNum = completedSessions + 1;

  // ✅ UPDATED: Show the Maximum estimate (Full Project Scope) instead of just the Daily Plan
  const totalSessions = Math.max(
      task.estimated_pomodoros || 0, 
      totalSessionOverride || 0, 
      currentWorkSessionNum
  );

  const isOvertime = currentWorkSessionNum > totalSessions;

  // --- ACTIONS ---

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const session = await startSession(task.id);
      setSessionId(session.id);
      setMode("RUNNING");
      // Only set to IN_PROGRESS if not already (avoids unneccesary API calls)
      if (task.status !== "IN_PROGRESS") {
        await updateTaskStatus(task.id, "IN_PROGRESS");
      }
    } catch (err) {
      alert("Failed to start session.");
    } finally {
      setIsStarting(false);
    }
  };

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
    handleStart(); // Immediately start new session
  };

  // --- TIMER EFFECT ---
  useEffect(() => {
    if (mode !== "RUNNING" && mode !== "BREAK") return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;

        // Auto-stop: check inside the setter so we always have the real value
        if (mode === "RUNNING" && next >= workDuration) {
          setMode("FEEDBACK");
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Break Logic
  const nextBreakIsLong = (completedSessions + 1) % 4 === 0;
  const isBreakMode = mode === "BREAK";
  const breakTimeTotal = nextBreakIsLong ? longBreak : shortBreak; 

  // --- FEEDBACK HANDLERS ---

  // 1. CONTINUE 
  const handleContinue = async (rating) => {
    setLoading(true);
    try {
      // This triggers the backend 'Auto-Adjust Estimate' logic
      await endSession(sessionId, {
        end_type: "COMPLETED",
        focus_rating: rating
      });

      setCompletedSessions(prev => prev + 1);
      
      // UI logic to show the break prompt
      setMode("BREAK_PROMPT"); 
    } catch (err) { 
      console.error("End session error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  // 2. COMPLETE TASK 
  const handleCompleteTask = async (rating) => {
    setLoading(true);
    try {
        await endSession(sessionId, {
            is_completed: true,
            focus_rating: rating,
            end_type: "COMPLETED"
        });
        await updateTaskStatus(task.id, "COMPLETED");
        if (onComplete) onComplete(task.id);
        onClose();
    } catch (err) { console.error(err); }
  };

  // 3. STOP FOR NOW 
  const handleStopForNow = async (rating) => {
    setLoading(true);
    try {
        await endSession(sessionId, {
            is_completed: false, // Incomplete session
            focus_rating: rating,
            end_type: "STOPPED"
        });
        await updateTaskStatus(task.id, "IN_PROGRESS");
        if (onUpdateTask) onUpdateTask();
        onClose();
    } catch (err) { console.error(err); }
  };

  // 4. DISCARD (UPDATED: Resets to Lobby instead of closing)
  const handleDiscard = async () => {
    setLoading(true);
    try {
      if (sessionId) {
        // No extra_sessions field here anymore
        await endSession(sessionId, { end_type: "ABORTED", focus_rating: 1 });
      }
      
      // If sessions were completed before, keep it IN_PROGRESS, else PENDING
      const newStatus = completedSessions > 0 ? "IN_PROGRESS" : "PENDING";
      await updateTaskStatus(task.id, newStatus);
      
      if (onUpdateTask) onUpdateTask();
      setSessionId(null);
      setSeconds(0);
      setMode("LOBBY");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- BREAK PROMPT HANDLERS ---
  const handleAcceptBreak = () => {
      setSeconds(0);
      setMode("BREAK");
  };

  const handleSkipBreak = () => {
      setSeconds(0);
      handleStart(); 
  };

  return (
    <div className={`fixed inset-0 z-[100] text-white flex font-sans transition-colors duration-1000 ${isBreakMode ? "bg-slate-900" : "bg-gray-900"}`}>
      
      {/* SIDEBAR */}
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
        {/* Only allow closing via X if not in Feedback mode (force feedback decision) */}
        {mode !== "FEEDBACK" && (
            <button 
            onClick={() => mode === "LOBBY" ? onClose() : handleStop()} 
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full"
            >
            <X size={24} />
            </button>
        )}

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
                    ? (nextBreakIsLong ? "Long Break • Recharge" : "Short Break • Breathe") 
                    : task.name}
            </h2>
            
            {/* THE CLOCK */}
            <div className={`text-[140px] font-mono font-bold leading-none tabular-nums tracking-tighter drop-shadow-2xl 
                ${isBreakMode ? "text-blue-100" : "text-white"}`}>
              {isBreakMode 
                  ? formatTime(breakTimeTotal - seconds)
                  : formatTime(seconds)
              }
            </div>

            <div className="flex items-center gap-8 mt-16 justify-center">
              {isBreakMode ? (
                  <button 
                      onClick={handleSkipBreak} 
                      className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-3 transition-all hover:scale-105 shadow-lg shadow-blue-900/50"
                  >
                      <FastForward size={24} fill="currentColor"/> Skip Break & Start Work
                  </button>
              ) : (
                  <>
                    <button onClick={handleRestart} className="p-4 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-all" title="Restart Session"><RotateCcw size={28} /></button>
                    <button
                      onClick={() => setMode(mode === "RUNNING" ? "PAUSED" : "RUNNING")}
                      className="w-24 h-24 flex items-center justify-center rounded-full bg-white text-gray-900 hover:scale-105 transition-all shadow-2xl shadow-white/10"
                    >
                      {mode === "RUNNING" ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={handleStop} className="p-4 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Stop & Log"><Square size={28} fill="currentColor" /></button>
                  </>
              )}
            </div>
          </div>
        )}

        {/* --- FEEDBACK FORM --- */}
        {mode === "FEEDBACK" && (
            <SessionFeedbackForm 
                onContinue={handleContinue}
                onCompleteTask={handleCompleteTask}
                onStopForNow={handleStopForNow}
                onDiscard={handleDiscard}
                loading={loading} // Pass loading state if you want to show spinners
            />
        )}

        {/* --- BREAK PROMPT --- */}
        {mode === "BREAK_PROMPT" && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-gray-800 p-8 rounded-2xl max-w-sm w-full text-center border border-gray-700 shadow-2xl animate-in zoom-in-95">
                    <h2 className="text-2xl font-bold text-white mb-2">Great Job!</h2>
                    <p className="text-gray-400 mb-6">
                        You've finished session {completedSessions}.<br/>
                        Time for a <span className={nextBreakIsLong ? "text-red-400 font-bold" : "text-blue-400 font-bold"}>
                            {nextBreakIsLong ? "15 min Long Break" : "5 min Short Break"}
                        </span>?
                    </p>
                    <div className="space-y-3">
                        <button onClick={handleAcceptBreak} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform">
                            Accept Break
                        </button>
                        <button onClick={handleSkipBreak} className="w-full py-3 bg-gray-700 text-gray-300 font-medium rounded-xl hover:bg-gray-600 transition-colors">
                            Skip & Start Next Session
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default PomoSession;