import React from "react";
import { Outlet } from "react-router-dom";

const UserDashboardLayout = () => {
  return (
    
  <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 ">
       <div className=" w-full h-full">
        <Outlet />
      </div>
    </div>
  );
};

export default UserDashboardLayout;
