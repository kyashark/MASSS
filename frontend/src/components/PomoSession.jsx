import React, { useState, useEffect } from "react";
import { Play, Pause, Square, X, Star, CheckCircle, RotateCcw, Ban, ArrowLeft, Coffee, SkipForward } from "lucide-react";
import { startSession, endSession } from "../api/sessions";
import { updateTaskStatus } from "../api/tasks";
import SessionSidebar from "./SessionSideBar.jsx";


const PomoSession = ({ task, onClose, onComplete, onUpdateTask }) => {
  // --- STATES ---
  const [mode, setMode] = useState("LOBBY"); // Modes: LOBBY, RUNNING, PAUSED, FEEDBACK, BREAK_PROMPT, BREAK
  const [seconds, setSeconds] = useState(0); // Work Timer
  const [breakSeconds, setBreakSeconds] = useState(0); // Break Timer
  const [sessionId, setSessionId] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  
  // Feedback Data
  const [focusRating, setFocusRating] = useState(0);
  const [loading, setLoading] = useState(false);


  // Stats Logic
  const SESSION_DURATION = 25 * 60; // 25 Minutes
  const SHORT_BREAK = 5 * 60;       // 5 Minutes
  const LONG_BREAK = 15 * 60;       // 15 Minutes usually (after 4 sessions)

  // We track local completed sessions to calculate breaks dynamically
  // If task has previous sessions, we add to them.
  const [sessionsCompletedNow, setSessionsCompletedNow] = useState(0);
  
  const currentTotalSessions = (task.sessions_count || 0) + sessionsCompletedNow + 1; 
  const isOvertime = currentTotalSessions > task.estimated_pomodoros;
  const totalDisplaySessions = Math.max(task.estimated_pomodoros, currentTotalSessions);

  // --- ACTIONS ---

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const session = await startSession(task.id);
      setSessionId(session.id);
      setSeconds(0);
      setMode("RUNNING");
    } catch (err) {
      alert("Failed to start.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleResume = () => {
    setMode("RUNNING");
  };

  const handleStop = () => {
    setMode("FEEDBACK");
  };

  const handleRestart = async () => {
    if (!confirm("Restart timer? This session will be discarded.")) return;
    if (sessionId) {
      // Abort previous session in DB
      await endSession(sessionId, { 
        is_completed: false, 
        focus_rating: 1, 
        end_type: "ABORTED" 
      });
    }
    setSeconds(0);
    handleStart(); 
  };



    // WORK TIMER
// --- TIMERS ---
  useEffect(() => {
    let interval = null;

    // WORK TIMER
    if (mode === "RUNNING") {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    // BREAK TIMER
    else if (mode === "BREAK") {
      interval = setInterval(() => {
        setBreakSeconds((s) => {
          if (s <= 1) {
             // Break finished automatically
             // You might want to auto-start or go to lobby. 
             // Here we go to LOBBY to let user click start.
             setMode("LOBBY"); 
             return 0;
          }
          return s - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [mode]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- BREAK LOGIC ---
  const handleStartBreak = () => {
    // Determine break length: After every 4th session -> Long Break
    const isLongBreak = (currentTotalSessions - 1) % 4 === 0 && (currentTotalSessions - 1) !== 0;
    setBreakSeconds(isLongBreak ? LONG_BREAK : SHORT_BREAK);
    setMode("BREAK");
  };

  const handleSkipBreak = () => {
    // Skip immediately to starting next session
    handleStart();
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = async (action) => {
    // Basic validation
    if (action !== "CANCEL_TASK" && !focusRating) {
        alert("Please rate your focus!");
        return;
    }
    setLoading(true);

    try {
      const isTimerFinished = seconds >= SESSION_DURATION;
      let finalEndType = "STOPPED"; 
      
      if (action === "CANCEL_TASK") finalEndType = "ABORTED"; 
      else if (isTimerFinished) finalEndType = "COMPLETED";

      // 1. Update Session in DB
      if (sessionId) {
        await endSession(sessionId, {
          is_completed: isTimerFinished,
          focus_rating: focusRating || 1,
          end_type: finalEndType
        });
      }

      // 2. Handle Task Status / UI Flow
      if (action === "DONE_TASK") {
        // User explicitly marks task as Done
        await updateTaskStatus(task.id, "COMPLETED");
        if (onComplete) onComplete(task.id);
        onClose();
      } 
      else if (action === "CANCEL_TASK") {
        await updateTaskStatus(task.id, "SKIPPED"); 
        if (onUpdateTask) onUpdateTask(); 
        onClose();
      }
      else if (action === "STOP_FOR_NOW") {
         await updateTaskStatus(task.id, "PENDING");
         onClose();
      }
      else if (action === "CONTINUE_FLOW") {
         // This is triggered when timer finished naturally
         // Increment local session count so dots update
         setSessionsCompletedNow(prev => prev + 1);
         setFocusRating(0); // Reset for next time
         setSessionId(null); // Clear ID
         
         // Trigger Break Prompt
         setMode("BREAK_PROMPT");
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 return (
    // CHANGED: Main Container is now a Flex Row
    <div className="fixed inset-0 z-[100] bg-gray-950 text-white flex font-sans">
      
      {/* --- LEFT SIDEBAR --- */}
      <SessionSidebar 
        totalSessions={totalDisplaySessions} 
        currentSessionNum={currentTotalSessions}
        mode={mode}
      />

      {/* --- RIGHT MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col relative bg-gray-900">

        {/* HEADER (Moved inside right pane) */}
        <div className="absolute top-6 left-8 text-xl font-bold tracking-widest opacity-50 flex items-center gap-2">
          <Coffee size={24} /> {mode === "BREAK" ? "BREAK TIME" : "FOCUS MODE"}
        </div>
        
        {/* CLOSE BUTTON */}
        <button 
          onClick={() => mode === "RUNNING" ? setMode("FEEDBACK") : onClose()}
          className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        {/* CENTERED CONTENT AREA */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            
            {/* --- LOBBY --- */}
            {mode === "LOBBY" && (
              <div className="text-center space-y-8 animate-in zoom-in duration-300">
                <div>
                  <h2 className="text-gray-400 uppercase tracking-widest text-sm mb-2">Ready?</h2>
                  <h1 className="text-5xl font-bold max-w-3xl leading-tight">{task.name}</h1>
                </div>
                
                <button 
                  onClick={handleStart}
                  disabled={isStarting}
                  className={`px-12 py-6 bg-white text-black font-bold text-2xl rounded-full transition-all ${isStarting ? "opacity-50" : "hover:scale-105 shadow-2xl shadow-white/20"}`}
                >
                  {isStarting ? "STARTING..." : <span className="flex items-center gap-3"><Play size={28} fill="currentColor"/> START SESSION</span>}
                </button>
              </div>
            )}

            {/* --- TIMER (RUNNING / PAUSED) --- */}
            {(mode === "RUNNING" || mode === "PAUSED") && (
              <div className="text-center w-full max-w-4xl">
                <h2 className="text-gray-500 font-medium tracking-wide uppercase mb-10 text-lg">{task.name}</h2>
                
                <div className={`text-[160px] font-mono font-bold leading-none tabular-nums tracking-tighter drop-shadow-2xl transition-colors ${seconds >= SESSION_DURATION ? "text-green-400" : "text-white"}`}>
                  {formatTime(seconds)}
                </div>

                <div className="flex items-center gap-10 mt-20 justify-center">
                  <button onClick={handleRestart} className="p-5 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-all"><RotateCcw size={32} /></button>

                  {seconds >= SESSION_DURATION ? (
                      <button onClick={handleStop} className="px-10 py-5 rounded-full bg-green-500 text-black font-bold text-xl hover:scale-105 shadow-lg animate-bounce">
                          FINISH SESSION
                      </button>
                  ) : (
                      <button
                        onClick={() => setMode(mode === "RUNNING" ? "PAUSED" : "RUNNING")}
                        className="w-28 h-28 flex items-center justify-center rounded-full bg-white text-gray-900 hover:scale-105 transition-all shadow-2xl shadow-white/10"
                      >
                        {mode === "RUNNING" ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-1" />}
                      </button>
                  )}

                  <button onClick={handleStop} className="p-5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Square size={32} fill="currentColor" /></button>
                </div>
              </div>
            )}

            {/* --- FEEDBACK MODAL --- */}
            {mode === "FEEDBACK" && (
               // ... (Keep existing feedback modal code, just center it here) ...
               <div className="bg-gray-800 p-8 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-700 relative animate-in fade-in slide-in-from-bottom-10">
                   {/* ... internal code same as before ... */}
                   {/* Just showing structure here for brevity, paste your Feedback code here */}
                   <h2 className="text-2xl font-bold mb-4 text-center">Session Complete</h2>
                   {/* ... etc ... */}
                   <div className="grid gap-3">
                      {seconds >= SESSION_DURATION ? (
                         <button onClick={() => handleSubmit("CONTINUE_FLOW")} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold">Save & Continue</button>
                      ) : (
                         <button onClick={() => handleSubmit("STOP_FOR_NOW")} className="w-full py-4 bg-gray-700 text-white rounded-xl">Stop</button>
                      )}
                   </div>
               </div>
            )}

            {/* --- BREAK PROMPT --- */}
            {mode === "BREAK_PROMPT" && (
                <div className="bg-gray-800 p-10 rounded-3xl max-w-md w-full shadow-2xl text-center border border-gray-700 animate-in zoom-in">
                    <Coffee size={48} className="mx-auto text-blue-400 mb-6" />
                    <h2 className="text-3xl font-bold mb-2">Break Time?</h2>
                    <p className="text-gray-400 mb-8">
                        {((currentTotalSessions - 1) % 4 === 0) 
                          ? "Great job! Take a long 15m break." 
                          : "Take a quick 5m breather."}
                    </p>
                    <div className="flex gap-4">
                        <button onClick={handleSkipBreak} className="flex-1 py-4 bg-gray-700 text-white rounded-xl font-bold">Skip</button>
                        <button onClick={handleStartBreak} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold">Take Break</button>
                    </div>
                </div>
            )}

            {/* --- BREAK TIMER --- */}
            {mode === "BREAK" && (
                <div className="text-center w-full max-w-4xl">
                    <h2 className="text-blue-400 font-bold tracking-widest uppercase mb-4 animate-pulse">Recharging...</h2>
                    <div className="text-[140px] font-mono font-bold text-blue-100 drop-shadow-2xl">
                      {formatTime(breakSeconds)}
                    </div>
                    <button onClick={handleSkipBreak} className="mt-12 px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105">
                        End Break & Start Work
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default PomoSession;