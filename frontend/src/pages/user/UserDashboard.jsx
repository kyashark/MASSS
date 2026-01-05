import React, { useState } from 'react';
import { 
  BookOpen, 
  Briefcase, 
  Users, 
  Calendar, 
  Search, 
  Bell,
  MoreHorizontal,
  ArrowUpRight,
  Clock,
  FileText,
  MessageCircle
} from 'lucide-react';

const Dashboard = () => {
  // Simulating the user passing "Helpmate" brand/hardware context
  const appName = "Helpmate";

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-800 font-sans p-4 md:p-8 flex flex-col gap-6">
      
      {/* --- HEADER (Floating & Minimal) --- */}
      <header className="flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm sticky top-4 z-50">
        <div className="flex items-center gap-3">
          {/* Brand Logo Slot */}
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-indigo-200 shadow-lg">
            H
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">{appName}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-gray-100 px-4 py-2 rounded-full items-center gap-2 text-gray-500">
            <Search size={18} />
            <span className="text-sm">Search...</span>
          </div>
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm hover:bg-gray-50">
            <Bell size={20} className="text-gray-600" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-white shadow-md"></div>
        </div>
      </header>

      {/* --- BENTO GRID LAYOUT --- */}
      {/* CSS Grid: 4 Columns, Auto Rows */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[180px] gap-6 max-w-7xl mx-auto w-full">

        {/* --- BLOCK 1: MAIN SCHEDULE (Member 1) --- */}
        {/* Takes up 2 columns and 2 rows (The "Hero" Block) */}
        <div className="col-span-1 md:col-span-2 row-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
          <div className="flex justify-between items-start mb-4 z-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">My Schedule</h2>
              <p className="text-slate-500">You have 3 classes and 2 tasks today.</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
              <Calendar size={24} />
            </div>
          </div>

          {/* Timeline Visual */}
          <div className="flex-1 flex flex-col justify-center gap-4 z-10">
            <ScheduleItem time="09:00 AM" title="Advanced Mathematics" tag="Lecture" color="bg-orange-100 text-orange-700" />
            <ScheduleItem time="11:30 AM" title="UX Design Workshop" tag="Lab" active color="bg-indigo-600 text-white" />
            <ScheduleItem time="02:00 PM" title="History Essay Due" tag="Deadline" color="bg-red-100 text-red-700" />
          </div>

          {/* Decorative Background Blob */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
        </div>

        {/* --- BLOCK 2: CAREER GOALS (Member 2) --- */}
        {/* Tall vertical block (1 col, 2 rows) */}
        <div className="col-span-1 row-span-2 bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden cursor-pointer hover:ring-4 ring-indigo-100 transition-all">
          <div className="z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Briefcase size={20} className="text-indigo-300" />
              </div>
              <ArrowUpRight size={20} className="text-gray-400" />
            </div>
            <h3 className="text-3xl font-bold mb-1">85%</h3>
            <p className="text-slate-400 text-sm mb-6">CV Readiness Score</p>
            
            <div className="space-y-4">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <p className="text-xs text-indigo-300 font-semibold uppercase mb-1">Recommended</p>
                <p className="font-medium text-sm">Frontend Intern @ Google</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <p className="text-xs text-indigo-300 font-semibold uppercase mb-1">Skill Gap</p>
                <p className="font-medium text-sm">Learn React Native</p>
              </div>
            </div>
          </div>
          
          {/* Subtle Gradient Overlay */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/40 pointer-events-none"></div>
        </div>

        {/* --- BLOCK 3: GROUP PROJECTS (Member 3) --- */}
        {/* Square block (1 col, 1 row) */}
        <div className="bg-[#D1FAE5] rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:bg-[#A7F3D0] transition-colors cursor-pointer text-emerald-900">
          <div className="flex justify-between items-start">
            <Users size={28} />
            <div className="bg-white/60 px-2 py-1 rounded-full text-xs font-bold shadow-sm">
              3 New
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Group Projects</h3>
            <p className="text-sm opacity-80 mt-1">Mike uploaded "Final_v2"</p>
          </div>
        </div>

        {/* --- BLOCK 4: RESOURCES (Member 4) --- */}
        {/* Square block (1 col, 1 row) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between group cursor-pointer hover:border-orange-200 transition-colors">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100 transition-colors">
              <BookOpen size={24} />
            </div>
            <MoreHorizontal size={20} className="text-gray-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Resources</h3>
            <div className="flex -space-x-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs">PDF</div>
              <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-white flex items-center justify-center text-xs">DOC</div>
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">+5</div>
            </div>
          </div>
        </div>

        {/* --- EXTRA BLOCK: QUICK STATS --- */}
        {/* Wide bottom block (2 col, 1 row) - Could be shared or extra features */}
        <div className="md:col-span-2 bg-indigo-600 rounded-3xl p-6 shadow-lg text-white flex items-center justify-between relative overflow-hidden">
            <div className="z-10">
                <h3 className="text-xl font-bold">Focus Mode</h3>
                <p className="text-indigo-200 text-sm">Turn off distractions for 25m?</p>
            </div>
            <button className="z-10 bg-white text-indigo-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-gray-100 transition-colors">
                Start
            </button>
            <div className="absolute right-0 top-0 w-32 h-full bg-white/10 skew-x-12 transform translate-x-8"></div>
        </div>
        
         {/* --- EXTRA BLOCK: NOTIFICATIONS --- */}
         <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 flex items-center gap-4">
             <div className="p-3 bg-red-50 text-red-500 rounded-full">
                 <Bell size={24} />
             </div>
             <div>
                 <p className="font-bold text-slate-800">System Alert</p>
                 <p className="text-slate-500 text-sm">Exam registration closes in 2 hours.</p>
             </div>
         </div>

      </main>
    </div>
  );
};

/* --- Sub-Component for Schedule List --- */
const ScheduleItem = ({ time, title, tag, active, color }) => (
  <div className={`flex items-center gap-4 p-3 rounded-xl transition-all ${active ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'}`}>
    <div className="w-16 text-xs font-bold text-gray-400 flex flex-col items-center justify-center border-r border-gray-200 pr-4">
      <Clock size={14} className="mb-1" />
      {time}
    </div>
    <div className="flex-1">
      <h4 className={`font-bold text-sm ${active ? 'text-indigo-900' : 'text-slate-700'}`}>{title}</h4>
    </div>
    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${color}`}>
      {tag}
    </span>
  </div>
);

export default Dashboard;