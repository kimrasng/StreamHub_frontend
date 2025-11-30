import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Navigate } from 'react-router-dom';

export default function Settings() {
  const { user, loading: authLoading, setUser } = useAuth(); // setUser for local state update
  const [streamInfo, setStreamInfo] = useState(null);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Profile state
  const [nickname, setNickname] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const [streamRes, bannedRes, profileRes] = await Promise.all([
            api.get(`/stream/${user.username}/`),
            api.get(`/stream/${user.username}/banned/`),
            api.get('/profile/') // Fetch user profile
          ]);
          setStreamInfo(streamRes.data);
          setBannedUsers(bannedRes.data);
          setNickname(profileRes.data.nickname); // Set initial nickname
        } catch (err) {
          setError('Failed to fetch settings information.');
          console.error("Error fetching settings:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else if (!authLoading) {
        setLoading(false); // If not logged in, stop loading
    }
  }, [user, authLoading]);

  const handleNicknameChange = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/profile/', { nickname });
      alert('Nickname updated successfully!');
      setUser(prevUser => ({ ...prevUser, nickname: response.data.nickname })); // Update context
      localStorage.setItem('nickname', response.data.nickname); // Update local storage
    } catch (err) {
      console.error("Error updating nickname:", err);
      alert(`Failed to update nickname: ${err.response?.data?.nickname || err.response?.data?.error || 'Server error'}`);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('New passwords do not match.');
      return;
    }
    try {
      await api.post('/password/change/', { old_password: oldPassword, new_password: newPassword });
      alert('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error("Error updating password:", err);
      alert(`Failed to update password: ${err.response?.data?.old_password || err.response?.data?.new_password || err.response?.data?.error || 'Server error'}`);
    }
  };

  const handleUnbanUser = async (userToUnban) => {
    if (window.confirm(`Are you sure you want to unban ${userToUnban}?`)) {
      try {
        await api.post('/unban/', { banned_user: userToUnban });
        alert(`${userToUnban} has been unbanned.`);
        setBannedUsers(prevBanned => 
          prevBanned.filter(u => u.banned_username !== userToUnban)
        );
      } catch (err) {
        console.error("Error unbanning user:", err);
        alert(`Failed to unban user: ${err.response?.data?.error || 'Server error'}`);
      }
    }
  };
  
  if (authLoading || (user && loading)) {
    return <div>Loading settings...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <h1>Settings for {user.username}</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* OBS Setup Section */}
      <div className="obs-setup-container">
        <h2>OBS Setup Instructions</h2>
        {streamInfo ? (
          <>
            <p>Use these settings in OBS or your preferred streaming software:</p>
            <ul>
              <li><strong>Server URL:</strong> <code>{streamInfo.stream_url}</code></li>
              <li><strong>Stream Key:</strong> <code>{streamInfo.stream_key}</code></li>
            </ul>
            <p><strong>Important:</strong> Do not share your Stream Key with anyone!</p>
          </>
        ) : (
          <p>Loading stream information...</p>
        )}
      </div>

      {/* Profile/Nickname Change Section */}
      <div className="obs-setup-container" style={{marginTop: '2rem'}}>
          <h2>Profile Settings</h2>
          <form onSubmit={handleNicknameChange}>
              <div>
                  <label htmlFor="nickname">Nickname:</label>
                  <input 
                      type="text" 
                      id="nickname" 
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      required
                  />
              </div>
              <button type="submit">Update Nickname</button>
          </form>

          <h3 style={{marginTop: '2rem'}}>Change Password</h3>
          <form onSubmit={handlePasswordChange}>
              <div>
                  <label htmlFor="oldPassword">Old Password:</label>
                  <input 
                      type="password" 
                      id="oldPassword" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                  />
              </div>
              <div>
                  <label htmlFor="newPassword">New Password:</label>
                  <input 
                      type="password" 
                      id="newPassword" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                  />
              </div>
              <div>
                  <label htmlFor="confirmNewPassword">Confirm New Password:</label>
                  <input 
                      type="password" 
                      id="confirmNewPassword" 
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                  />
              </div>
              <button type="submit">Change Password</button>
          </form>
      </div>

      {/* Banned Users Section */}
      <div className="obs-setup-container" style={{marginTop: '2rem'}}>
          <h2>Banned Users</h2>
          {bannedUsers.length > 0 ? (
            <ul className="banned-users-list">
              {bannedUsers.map((ban, index) => (
                <li key={index}>
                  <span>{ban.banned_username}</span>
                  <button onClick={() => handleUnbanUser(ban.banned_username)}>Unban</button>
                </li>
              ))}
            </ul>
          ) : (
            <p>You haven't banned any users.</p>
          )}
      </div>
    </div>
  );
}
