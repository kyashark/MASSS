import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { Book, 
        Calendar, 
        BarChart3, 
        Layout, 
        Bell, 
        User,
        BookOpenText ,
        Home
} from 'lucide-react'; 

// TabButton Component
const TabButton = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 mr-3 rounded-full text-sm font-medium transition-all ${
      active
        ? "bg-slate-900 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-50"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const NavBar = () => {
  const location = useLocation(); 
  const navigate = useNavigate(); 
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-5 gap-4 px-6 bg-blue-300 p-4 rounded-2xl shadow-md">

      {/* --- LEFT: LOGO SECTION --- */}
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
          <Layout className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-900">
            TaskMate
          </h1>
        </div>
      </div>

      {/* --- CENTER: TAB SWITCHER --- */}
      <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 flex">
        <TabButton 
          icon={<Home size={16}/>} 
          label="Home" 
          active={isActive('/user/Home')} 
          onClick={() => navigate('/user/Home')} 
        />
        <TabButton 
          icon={<BookOpenText size={16}/>} 
          label="Modules" 
          active={isActive('/user/Modules')} 
          onClick={() => navigate('/user/Modules')} 
        />
        <TabButton 
          icon={<Calendar size={16}/>} 
          label="Scheduling" 
          active={isActive('/user/scheduling')} 
          onClick={() => navigate('/user/scheduling')} 
        />

        <TabButton 
          icon={<BarChart3 size={16}/>} 
          label="Study Profile" 
          active={isActive('/user/study-profile')} 
          onClick={() => navigate('/user/study-profile')} 
        />
      </div>

      {/* --- RIGHT: ACTIONS & PROFILE --- */}
      <div className="flex items-center justify-end gap-4 flex-1">
        
        {/* Notification Button */}
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/50 text-slate-900 transition-colors">
          <Bell size={20} />
        </button>

        {/* Profile Section (Name + Avatar) */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-900">John Doe</p>

          </div>

          <div className="w-10 h-10 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-sm overflow-hidden hover:ring-2 hover:ring-slate-900 transition-all">
            <User className="text-slate-400" size={20} />
          </div>
        </div>

      </div>

    </div>
  );
};

export default NavBar;