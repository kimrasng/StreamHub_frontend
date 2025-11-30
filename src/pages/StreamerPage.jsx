import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function StreamerPage() {
  const { username } = useParams();
  const { user, token } = useAuth();
  const isAuthenticatedStreamer = user && user.username === username;

  const [streamInfo, setStreamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    setChatMessages([]);
    setError(null);
    setLoading(true);

    const fetchStreamInfo = async () => {
      try {
        const response = await api.get(`/stream/${username}/`);
        setStreamInfo(response.data);
      } catch (err) {
        setError('Failed to fetch stream information. The user may not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchStreamInfo();

    const wsUrl = `ws://127.0.0.1:8000/ws/chat/${username}/?token=${token || ''}`;
    ws.current = new WebSocket(wsUrl);
    ws.current.onopen = () => console.log('WebSocket connected');
    ws.current.onclose = () => console.log('WebSocket disconnected');
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        alert(`Chat Error: ${data.error}`);
      } else {
        setChatMessages((prevMessages) => [...prevMessages, data]);
      }
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [username, token]);

  const handleSendMessage = () => {
    if (chatMessage.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message: chatMessage }));
      setChatMessage('');
    }
  };

  const handleBanUser = async (userToBan) => {
    if (isAuthenticatedStreamer && window.confirm(`Are you sure you want to ban ${userToBan}?`)) {
      try {
        // The streamer's identity is verified by the token on the backend
        await api.post('/ban/', { banned_user: userToBan });
        alert(`${userToBan} has been banned.`);
        // Remove banned user's messages from the chat view
        setChatMessages(prevMessages => 
          prevMessages.filter(msg => msg.username !== userToBan)
        );
      } catch (err) {
        console.error("Error banning user:", err);
        alert(`Failed to ban user: ${err.response?.data?.error || 'Server error'}`);
      }
    }
  };

  if (loading) return <div>Loading streamer page...</div>;
  if (error) return <div>Error: {error}</div>;
  const streamUid = streamInfo?.stream_uid;
  const hasRealStream = streamUid && !streamUid.startsWith('placeholder-');

  return (
    <div className="streamer-page">
      <h1>{(streamInfo && streamInfo.nickname) || username}'s Stream</h1>
      {hasRealStream ? (
        <div className="stream-player-container">
          <iframe
            src={`https://iframe.cloudflarestream.com/${streamUid}`}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen={true}
          ></iframe>
        </div>
      ) : streamInfo ? (
        <p>This user has not finished configuring their stream yet.</p>
      ) : (
        <p>This user has not set up their stream yet.</p>
      )}

      <div className="chat-container">
        <h2>Chat</h2>
        {chatMessages.map((msg, index) => {
          const displayName = msg.display_name || msg.username;
          return (
            <div key={index} className="chat-message">
              <strong 
                onClick={() => isAuthenticatedStreamer && user.username !== msg.username && handleBanUser(msg.username)}
                className={isAuthenticatedStreamer && user.username !== msg.username ? 'bannable' : ''}
                title={isAuthenticatedStreamer ? `Click to ban ${displayName}` : ''}
              >
                {displayName}:
              </strong>
              <span> {msg.message}</span>
            </div>
          );
        })}
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          placeholder={user ? "Type your message..." : "Please log in to chat"}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={!user}
        />
        <button onClick={handleSendMessage} disabled={!user}>Send</button>
      </div>
    </div>
  );
}
