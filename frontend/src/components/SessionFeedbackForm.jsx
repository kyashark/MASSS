import React, { useState } from 'react';
import { Star, CheckCircle, Play, Pause, Trash2, X } from 'lucide-react';

const SessionFeedbackForm = ({ 
  onCompleteTask, 
  onContinue, 
  onStopForNow, 
  onDiscard 
}) => {
  const [rating, setRating] = useState(0);
  const [error, setError] = useState('');

  // Helper to validate rating before action
  const handleAction = (actionCallback) => {
    if (rating === 0) {
      setError('Please rate your focus first.');
      return;
    }
    actionCallback(rating);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-2">Session Ended</h2>
          <p className="text-gray-400 text-sm">
            Rate your focus to log this session. This trains your AI Scheduler.
          </p>
        </div>

        {/* Rating Section (The Reward Signal)  */}
        <div className="p-8 flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => { setRating(star); setError(''); }}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  size={32}
                  className={`${
                    star <= rating 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-gray-600 hover:text-gray-500"
                  } transition-colors duration-200`}
                />
              </button>
            ))}
          </div>
          <div className="h-4">
            {error ? (
              <span className="text-red-400 text-xs font-medium animate-pulse">{error}</span>
            ) : (
              <span className="text-gray-500 text-xs font-medium">
                {rating === 0 ? "Select stars" : `${rating} / 5 Focus Rating`}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons [cite: 293-308] */}
        <div className="p-6 bg-gray-800/50 space-y-3">
          
          {/* 1. Continue (Next Session) [cite: 301] */}
          {/* Use Case: "25 mins up, I'm feeling good" */}
          <button
            onClick={() => handleAction(onContinue)}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <Play size={18} fill="currentColor" />
            Continue to Next Session
          </button>

          <div className="grid grid-cols-2 gap-3">
            {/* 2. Task Complete [cite: 295] */}
            {/* Use Case: "I finished the homework!" */}
            <button
              onClick={() => handleAction(onCompleteTask)}
              className="py-3 px-4 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle size={18} />
              Task Done
            </button>

            {/* 3. Stop for Now (Save & Exit) [cite: 304] */}
            {/* Use Case: "I did work, but need to eat." */}
            <button
              onClick={() => handleAction(onStopForNow)}
              className="py-3 px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Pause size={18} fill="currentColor" />
              Stop for Now
            </button>
          </div>

          {/* 4. Discard Session [cite: 307] */}
          {/* Use Case: "I was on Instagram. Delete this." */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={onDiscard} // No rating needed for discard
              className="group flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} className="group-hover:animate-bounce" />
              Discard Session (Don't count this time)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionFeedbackForm;