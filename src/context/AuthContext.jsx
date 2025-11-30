import { createContext, useState, useEffect, useContext } from 'react';
import api, { setAuthToken } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      if (token) {
        setAuthToken(token);
        try {
          const profileResponse = await api.get('/profile/');
          const { nickname, username: profileUsername } = profileResponse.data;
          const resolvedUsername = profileUsername || localStorage.getItem('username');
          if (resolvedUsername && isMounted) {
            setUser({ username: resolvedUsername, nickname });
            localStorage.setItem('username', resolvedUsername);
            localStorage.setItem('nickname', nickname);
          }
        } catch (err) {
          console.error('Failed to refresh profile information:', err);
          const storedUsername = localStorage.getItem('username');
          const storedNickname = localStorage.getItem('nickname');
          if (storedUsername && isMounted) {
            setUser({ username: storedUsername, nickname: storedNickname });
          }
        }
      } else if (isMounted) {
        setAuthToken(null);
        setUser(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    setLoading(true);
    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (usernameInput, password) => {
    try {
      const response = await api.post('/login/', { username: usernameInput, password });
      const { token: newToken, username: responseUsername, nickname } = response.data;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      localStorage.setItem('username', responseUsername);
      localStorage.setItem('nickname', nickname);
      setAuthToken(newToken);
      setUser({ username: responseUsername, nickname });
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  };

  const signup = async (username, password) => {
    try {
      const response = await api.post('/signup/', { username, password });
      // After successful signup, you might want to automatically log them in
      // or redirect to login page. For now, we'll just indicate success.
      console.log('Signup successful:', response.data);
      return true;
    } catch (err) {
      console.error("Signup failed:", err);
      return false;
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await api.post('/logout/');
      } catch (err) {
        console.warn('Logout request failed, clearing local session anyway.', err);
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('nickname');
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
