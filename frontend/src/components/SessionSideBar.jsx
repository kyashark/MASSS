// components/SessionSideBar.jsx

import React from "react";
import { Check, Clock } from "lucide-react";

const SessionSidebar = ({ totalSessions, currentSessionNum, mode }) => {
  const displayTotal = Math.max(totalSessions, currentSessionNum);
  // --- 1. Calculate Total Work Time (Excluding Breaks) ---
  // Assuming currentSessionNum is 1-based. If we are in session 2, 1 is fully done.
  // If we are currently IN session 2, we don't count it as full yet for the "Total Time" at top,
  // or we can count based on estimated. Let's show "Time Spent So Far".
  const completedSessions = currentSessionNum - 1;
  const totalMinutes = completedSessions * 25;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  // --- 2. Generate the Timeline Sequence ---
  // We build an array representing the linear flow: Work -> Break -> Work...
  const timelineSteps = [];

  for (let i = 1; i <= displayTotal; i++) { // Use displayTotal here
    timelineSteps.push({

      type: "WORK",
      index: i,
      label: i > totalSessions ? "Extra Focus" : "Focus Session",
      time: "25 min"
    });

    // B. Add Break (if not the last session)
    if (i < displayTotal) {
      const isLongBreak = i % 4 === 0;
      timelineSteps.push({
        type: isLongBreak ? "LONG_BREAK" : "SHORT_BREAK",
        index: i, // Linked to the session just finished
        label: isLongBreak ? "Long Break" : "Short Break",
        time: isLongBreak ? "15 min" : "5 min"
      });
    }
  }

  // --- 3. Helper to determine status of a step ---
  const getStepStatus = (step) => {
    // If step is WORK
    if (step.type === "WORK") {
      if (step.index < currentSessionNum) return "COMPLETED";
      if (step.index === currentSessionNum) return mode === "BREAK" || mode === "BREAK_PROMPT" ? "COMPLETED" : "ACTIVE";
      return "FUTURE";
    }
    
    // If step is BREAK
    // Break happens AFTER step.index. 
    // If we are on Session 2, Break after Session 1 is COMPLETED.
    if (step.index < currentSessionNum - 1) return "COMPLETED"; 
    // If we just finished session (mode is BREAK), this specific break is active
    if (step.index === currentSessionNum - 1 && (mode === "BREAK" || mode === "BREAK_PROMPT")) return "ACTIVE"; 
    
    return "FUTURE";
  };

  return (
    <div className="w-80 h-full bg-gray-900/90 border-r border-gray-700 flex flex-col p-6 overflow-hidden">
      
      {/* TOTAL TIME HEADER */}
      <div className="mb-8 p-4 bg-gray-800 rounded-2xl border border-gray-700 shadow-lg">
        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
           <Clock size={14}/> Total Focus Time
        </div>
        <div className="text-3xl font-mono font-bold text-white">
          {hours > 0 ? `${hours}h ` : ""}{mins}m
        </div>
        <div className="text-xs text-gray-500 mt-1">Excluding breaks</div>
      </div>

      {/* SCROLLABLE TIMELINE */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-0 relative">
        {/* Continuous Vertical Line Background */}
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-800 z-0"></div>

        {timelineSteps.map((step, idx) => {
          const status = getStepStatus(step);
          
          // Define Styles based on Type and Status
          let dotColor = "bg-gray-800 border-gray-600"; // Default Future
          let textColor = "text-gray-500";
          let label = step.label;

          // WORK DOT (White)
          if (step.type === "WORK") {
            if (status === "ACTIVE") {
                dotColor = "bg-white border-white animate-pulse shadow-[0_0_10px_white] m-1.5";
                textColor = "text-white font-bold";
            } else if (status === "COMPLETED") {
                dotColor = "bg-green-500 border-green-500";
                textColor = "text-green-500 line-through decoration-white/20";
            } else {
                dotColor = "bg-gray-700 border-gray-600"; // Future Work
            }
          } 
          
          // SHORT BREAK (Blue)
          else if (step.type === "SHORT_BREAK") {
            if (status === "ACTIVE") {
                dotColor = "bg-blue-500 border-blue-500 animate-bounce";
                textColor = "text-blue-400 font-bold";
            } else if (status === "COMPLETED") {
                dotColor = "bg-blue-900 border-blue-900 opacity-50";
            } else {
                dotColor = "bg-blue-900/30 border-blue-900/50"; 
            }
          }

          // LONG BREAK (Red)
          else if (step.type === "LONG_BREAK") {
            if (status === "ACTIVE") {
                dotColor = "bg-red-500 border-red-500 animate-bounce";
                textColor = "text-red-400 font-bold";
            } else if (status === "COMPLETED") {
                dotColor = "bg-red-900 border-red-900 opacity-50";
            } else {
                dotColor = "bg-red-900/30 border-red-900/50";
            }
          }

          return (
            <div key={idx} className={`relative z-10 flex items-center gap-4 mb-6 transition-all duration-500 ${status === "ACTIVE" ? "opacity-100 scale-105" : "opacity-70"}`}>
                
                {/* THE DOT */}
                <div className={`w-10 h-10 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors duration-300 ${dotColor}`}>
                    {status === "COMPLETED" && <Check size={16} className="text-white" />}
                    {step.type === "WORK" && status !== "COMPLETED" && <span className="text-[10px] font-bold text-black">{step.index}</span>}
                </div>

                {/* THE TEXT */}
                <div className="flex flex-col">
                    <span className={`text-sm ${textColor} transition-colors`}>{label}</span>
                    <span className="text-xs text-gray-600 font-mono">{step.time}</span>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionSidebar;