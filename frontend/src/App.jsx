import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import UserDashboardLayout from "./layouts/UserDashboardLayout.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/user/Home.jsx";
import Modules from "./pages/user/Modules.jsx";
import Scheduling from "./pages/user/Scheduling.jsx";
import StudyProfile from "./pages/user/StudyProfile.jsx";
import Sessions from "./pages/user/Sessions.jsx";
import RLDashboard from "./pages/dashbaord/RLDashboard.jsx";
import Onboarding from "./pages/Onboarding.jsx";

// Simple guard — checks if a token exists
// Full token validation happens on the backend
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — no token needed */}
        <Route path="/login" element={<Login />} />

        {/* Redirect root to login if no token, home if logged in */}
        <Route
          path="/"
          element={
            localStorage.getItem("access_token") ? (
              <Navigate to="/user/home" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* RL Dashboard — protected */}
        <Route
          path="/rl-dashboard"
          element={
            <PrivateRoute>
              <RLDashboard />
            </PrivateRoute>
          }
        />

        {/* Protected nested routes */}
        <Route
          path="/user"
          element={
            <PrivateRoute>
              <UserDashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="modules" element={<Modules />} />
          <Route path="scheduling" element={<Scheduling />} />
          <Route path="study-profile" element={<StudyProfile />} />
          <Route path="sessions" element={<Sessions />} />
        </Route>

        <Route
          path="/onboarding"
          element={
            <PrivateRoute>
              <Onboarding />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
