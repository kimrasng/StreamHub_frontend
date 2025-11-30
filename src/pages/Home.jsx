import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users/');
        // Sort users so that live streams appear first
        const sortedUsers = response.data.sort((a, b) => b.is_live - a.is_live);
        setUsers(sortedUsers);
      } catch (err) {
        setError('Failed to fetch users.');
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div>Loading channels...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Channels</h1>
      {users.length === 0 ? (
        <p>No users have signed up yet.</p>
      ) : (
        <div className="user-grid">
          {users.map((user) => (
            <Link to={`/stream/${user.username}`} key={user.username} className="user-card-link">
              <div className="user-card">
                {user.is_live ? (
                  <>
                    <div className="thumbnail-container">
                      <img src={user.thumbnail} alt={`${user.username}'s stream preview`} />
                      <span className="live-badge">LIVE</span>
                    </div>
                    <div className="user-card-info">
                      <h3>{user.nickname || user.username}</h3>
                    </div>
                  </>
                ) : (
                  <div className="user-card-info offline">
                    <h3>{user.nickname || user.username}</h3>
                    <span>Offline</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}