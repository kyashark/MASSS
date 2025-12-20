import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ItemDashboard from './pages/ItemDashboard.jsx';
import TaskDashboardLayouts from './features/scheduling/layouts/TaskDashboardLayout.jsx';
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
         <Route path="/test-crud" element={<ItemDashboard />} />
         <Route path="/masss" element={<TaskDashboardLayouts/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;