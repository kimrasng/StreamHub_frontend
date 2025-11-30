import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StreamerPage from './pages/StreamerPage';
import Settings from './pages/Settings'; // Import the new Settings component
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        ) : (
          <>
            <span>Welcome, {user.nickname || user.username}</span>
            <Link to={`/stream/${user.username}`}>My Stream</Link>
            <Link to="/settings">Settings</Link> {/* Add link to Settings page */}
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/stream/:username" element={<StreamerPage />} />
        <Route path="/settings" element={<Settings />} /> {/* Add route for Settings page */}
      </Routes>
    </div>
  );
}

export default App;
