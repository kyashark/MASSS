import React, { useState } from "react";
// Import your new page here!
import ModulesPage from "../pages/ModulesPage.jsx";

import {
  Home,
  CheckSquare,
  Calendar,
  User,
  Layout,
  Settings,
  BookOpenText
} from "lucide-react";

const TaskDashboardLayout = () => {
  // 1. State to track the active tab
  const [activeTab, setActiveTab] = useState("modules"); // Default to modules for testing

  // 2. Configuration for Tabs
  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "modules", label: "Modules", icon: BookOpenText },
    { id: "scheduling", label: "Scheduling", icon: Calendar },
    { id: "profile", label: "Profile", icon: User },
  ];

  const currentTab = menuItems.find((item) => item.id === activeTab);

  // 3. Helper to Render Content based on Tab
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <div className="p-8">Home Dashboard Component (Coming Soon)</div>;
      case "modules":
        return <ModulesPage />;
      case "scheduling":
        return <div className="p-8">Calendar Component (Coming Soon)</div>;
      default:
        return <div className="p-8">Page Not Found</div>;
    }
  };

  return (
    <div className="w-screen h-screen bg-white flex overflow-hidden font-sans">
      {/* --- LEFT SIDEBAR --- */}
<aside className="w-[240px] flex-shrink-0 flex flex-col py-8 px-6 border-none bg-gray-100 z-20">
        <div className="flex items-center gap-3 px-4 mb-10 cursor-pointer group">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            <Layout className="text-white" size={20} />
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
<button
  key={item.id}
  onClick={() => setActiveTab(item.id)}
  className={`
    relative w-full flex items-center gap-4 px-6 py-4 
    rounded-[30px] font-medium transition-all duration-200 group
    ${
      isActive
        ? "bg-white text-gray-900 shadow-sm" 
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
    }
  `}
>
                <Icon
                  size={20}
                  className={
                    isActive ? "scale-110 transition-transform text-black" : ""
                  }
                />
                <span className={isActive ? "font-bold" : "font-medium"}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* --- MAIN CONTENT PAGE --- */}
      <main className="flex-1 flex flex-col bg-white transition-all duration-500 ease-in-out">


        {/* Content Area - DYNAMIC CONTENT RENDERS HERE */}
        <div className="flex-1 overflow-hidden relative">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default TaskDashboardLayout;