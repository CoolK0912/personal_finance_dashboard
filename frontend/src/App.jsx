import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';

function App() {
    return (
        <BrowserRouter>
         <div className="min-h-screen bg-gray-100">
            <Navbar />
            <Routes>
                <Route path="/" element={<Dashboard />} />
            </Routes>
         </div>
        </BrowserRouter>
    );
}

export default App;