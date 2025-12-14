import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TaskDashboard from './pages/TaskDashboard.jsx';
import TaskDashboardLayouts from './features/scheduling/layouts/TaskDashboardLayout.jsx';
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
         <Route path="/masss/test-task" element={<TaskDashboard />} />
         <Route path="/masss" element={<TaskDashboardLayouts><TaskDashboard /></TaskDashboardLayouts>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;