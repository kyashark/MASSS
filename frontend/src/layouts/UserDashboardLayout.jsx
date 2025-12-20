// layouts/UserDashboardLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom'; // <--- IMPORT THIS
import NavBar from '../components/NavBar';

const UserDashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-8xl px-4 py-4 sm:px-6 lg:px-8">
        
        {/* This stays visible on all sub-pages */}
        <div className="mb-8">
          <NavBar />
        </div>

        {/* This is where the Child Route (Home, Profile, etc.) will appear */}
        <main>
          <Outlet /> 
        </main>
        
      </div>
    </div>
  );
};

export default UserDashboardLayout;