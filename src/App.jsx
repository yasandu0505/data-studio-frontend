import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Entities from './pages/Entities';

function App() {
  return (
    <Router>
      <div className="app-container flex">
        <Sidebar />
        <main className="main-content ml-64 flex-1 min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/entities" element={<Entities />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
