import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import UserDashboard from './pages/user/UserDashboard.jsx'; // Example

import RLDashboard from './pages/dashbaord/RLDashboard.jsx';


// Layouts
import UserDashboardLayout from './layouts/UserDashboardLayout.jsx';

// Pages
import Home from './pages/user/Home.jsx';
import Modules from './pages/user/Modules.jsx';
import Scheduling from './pages/user/Scheduling.jsx';
import StudyProfile from './pages/user/StudyProfile.jsx';
import Sessions from './pages/user/Sessions.jsx';


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}

        <Route path="/rl-dashboard" element={<RLDashboard/>} />

        <Route path="/masss/user/dashboard" element={<UserDashboard/>} />

        {/* Redirect Root */}
        <Route path="/" element={<Navigate to="/user/home" replace />} />

        {/* --- NESTED ROUTES --- */}

        {/* 1. Parent Route: Sets the path prefix "/user" and the Layout */}
        <Route path="/user" element={<UserDashboardLayout />}>
          
          {/* 2. Index Route: Redirects /user to /user/home */}
          <Route index element={<Navigate to="home" replace />} />

          {/* 3. Child Routes: These render INSIDE the <Outlet /> of the Layout */}
          {/* Path becomes: /user/home */}
          <Route path="home" element={<Home />} />
          <Route path="Modules" element={<Modules />} />
          <Route path="scheduling" element={<Scheduling />} />
          <Route path="study-profile" element={<StudyProfile />} /> 
          <Route path="sessions" element={<Sessions />} /> 
          
          {/* You can easily add more here later: */}
          {/* <Route path="profile" element={<UserProfile />} /> */}
          {/* <Route path="settings" element={<UserSettings />} /> */}

        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;