import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TaskDashboard from './pages/TaskDashboard.jsx';
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
         <Route path="/masss/test-task" element={<TaskDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;