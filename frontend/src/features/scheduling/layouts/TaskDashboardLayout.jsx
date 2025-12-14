import React, { useState } from "react";
import {
  Home,
  CheckSquare,
  Calendar,
  User,
  Layout,
  Search,
  Bell,
  Settings,
  Plus,
  MoreHorizontal,
} from "lucide-react";

const TaskDashboardLayout = () => {
  // 1. State to track the active tab
  const [activeTab, setActiveTab] = useState("tasks");

  // 2. Configuration for Tabs
  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "scheduling", label: "Scheduling", icon: Calendar },
    { id: "profile", label: "Profile", icon: User },
  ];

  // Helper to find currently active item data
  const currentTab = menuItems.find((item) => item.id === activeTab);

  return (
    <div className="w-screen h-screen bg-white flex overflow-hidden font-sans">
      {/* --- LEFT SIDEBAR --- */}
      <aside className="w-[200px] flex-shrink-0 flex flex-col py-8 pl-6 border-r border-none bg-gray-100 z-20">
        {/* --- BRAND HEADER --- */}
        <div className="flex items-center gap-3 px-4 mb-10 cursor-pointer group">
          {/* Logo */}
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            <Layout className="text-white" size={20} />
          </div>
        </div>

        {/* --- NAVIGATION --- */}
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
                rounded-l-[30px] rounded-r-none font-medium transition-all duration-200 group
                ${
                  isActive
                    ? "bg-white text-gray-900"
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

        {/* Bottom Actions */}
        <div className="mt-auto pt-8 border-t border-gray-100 px-4">
          <button className="flex items-center gap-3 text-gray-400 hover:text-gray-900 transition">
            <Settings size={20} />
            <span className="font-medium text-sm">Settings</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT PAGE --- */}
      <main className="flex-1 flex flex-col bg-white transition-all duration-500 ease-in-out">
        {/* Header */}
        <header className="flex items-center justify-between mb-12 bg-gray-150 px-8 py-4 shadow-sm">
          <div className="h-10 flex items-center">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              {currentTab?.label}
            </h1>
          </div>
        </header>

        {/* Content Area */}
      </main>
    </div>
  );
};

export default TaskDashboardLayout;
