import React from "react";
import { useNavigate } from "react-router-dom";
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
  MessageCircle,
  Play,
  List,
  PauseCircle,
  GraduationCap,
  Bot,
  BookOpenText,
} from "lucide-react";

import ModuleCard from "../../components/ModuleBentoCard.jsx";
import ProfileCard from "../../components/ProfileBentoCard.jsx";
import ScheduleCard from "../../components/ScheduleCard.jsx"; 
import SessionCard from "../../components/SessionBentoCard.jsx";

const Home = () => {
  const navigate = useNavigate();

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[185px] gap-5 h-full w-full p-6">
      {/* BLOCK 1: MAIN SCHEDULE  */}
      <div
        onClick={() => navigate("/user/scheduling")}
        className="col-span-1 md:col-span-2 row-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
      >
        <ArrowUpRight
          className="absolute top-6 right-6 text-slate-900"
          size={30}
        />
        <ScheduleCard />
      </div>

      {/*  BLOCK 5: STUDY PROFILE  */}
      <div
        onClick={() => navigate("/user/study-profile")}
        className="md:col-span-2 bg-slate-900 rounded-3xl p-6 shadow-lg text-white 
           flex items-center gap-6 relative overflow-hidden group cursor-pointer
           hover:shadow-xl transition-all duration-300"
      >
        {/* <ArrowUpRight
          className="absolute top-6 right-6 text-white-300"
          size={30}
        /> */}
          <div className="flex-1 w-full">
          {/* <div className="flex items-center gap-3 mb-6">
            <Users size={24} className="text-white-700" />
            <h2 className="text-xl font-semibold text-white-900">Student Profile</h2>
          </div> */}
          <ProfileCard />
        </div>
      </div>

      {/*  BLOCK 2: POMODORO SESSION */}
      <div
        onClick={() => navigate("/user/sessions")}
        className="col-span-1 row-span-2 bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer
           hover:scale-[1.01] hover:shadow-xl transition-all duration-300"
      >
        <ArrowUpRight
          className="absolute top-6 right-6 text-white-500"
          size={30}
        />
        <div className="flex-1 w-full">
          <div className="flex items-center gap-3 mb-6">
            <Clock size={24} className="text-white-700" />
            <h2 className="text-xl font-semibold text-white-900">Focus Sessions</h2>
          </div>
        <div className="rounded-xl border border-slate-800 bg-slate-800 p-4">
  <SessionCard />
</div>
        </div>

      </div>

      {/*  BLOCK 3: MODULES LIST */}
      <div className="col-span-1 row-span-2 bg-white  text-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col relative cursor-pointer hover:shadow-md transition-all">
        <ArrowUpRight
          className="absolute top-6 right-6 text-slate-900"
          onClick={() => navigate("/user/modules")}
          size={30}
        />

        <div className="flex-1 w-full">
          <div className="flex items-center gap-3 mb-6">
            <BookOpenText size={24} className="text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Modules</h2>
          </div>
          <ModuleCard />
        </div>
      </div>

      {/*  BLOCK 4: AGENT ALERT --- */}
      <div
        onClick={() => navigate("/user/agent")}
        className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 relative hover:shadow-md transition-all"
      >
        <ArrowUpRight
          className="absolute top-6 right-6 text-slate-900"
          size={30}
        />
      </div>
    </main>
  );
};

export default Home;
