// frontend/src/hooks/useCurrentUser.js
import { useEffect, useState } from 'react';
import axios from 'axios';
import { refreshAccessTokenIfNeeded } from '../utils/auth';

// Hook centralisé pour récupérer l'utilisateur connecté à partir du token
export default function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await refreshAccessTokenIfNeeded();
        const config = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined;

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${API_URL}/auth/me`, config);

        setUser(response.data?.user || null);
      } catch (err) {
        console.error('Erreur récupération utilisateur connecté:', err);
        setError(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  return { user, loading, error };
}
