// frontend/src/utils/auth.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function saveAuthData({ token, refreshToken, tokenId, user }) {
  if (token) {
    localStorage.setItem('token', token);
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  if (tokenId) {
    localStorage.setItem('tokenId', tokenId);
  }
  if (user?.id) {
    localStorage.setItem('userId', user.id);
  }
}

export function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenId');
  localStorage.removeItem('userId');
}

export async function refreshAccessTokenIfNeeded() {
  const existingToken = localStorage.getItem('token');
  if (existingToken) {
    return existingToken;
  }

  const userId = localStorage.getItem('userId');
  const tokenId = localStorage.getItem('tokenId');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!userId || !tokenId || !refreshToken) {
    return null;
  }

  try {
    const res = await axios.post(`${API_URL}/auth/refresh`, {
      userId,
      tokenId,
      refreshToken,
    });

    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      // Optionnel : on peut aussi mettre à jour l'user si renvoyé
      if (res.data?.user?.id) {
        localStorage.setItem('userId', res.data.user.id);
      }
      return res.data.token;
    }

    return null;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token côté frontend:', error);
    // Si le refresh échoue, on nettoie les données locales
    clearAuthData();
    return null;
  }
}
