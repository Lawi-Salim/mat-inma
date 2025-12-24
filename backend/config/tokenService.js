const jwt = require('jsonwebtoken');
const redisClient = require('./redis');

const ACCESS_TOKEN_TTL = '1h'; // durée de vie du JWT d'accès
const REFRESH_TOKEN_TTL_SECONDS = 14 * 24 * 60 * 60; // 14 jours

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

function buildRefreshKey(userId, tokenId) {
  return `refresh:${userId}:${tokenId}`;
}

async function generateAndStoreRefreshToken(userId) {
  // tokenId pour distinguer plusieurs connexions (navigateurs/appareils)
  const tokenId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const refreshToken = `${tokenId}.${Math.random().toString(36).slice(2, 32)}`;

  const key = buildRefreshKey(userId, tokenId);

  if (redisClient && redisClient.isOpen) {
    await redisClient.set(key, refreshToken, { EX: REFRESH_TOKEN_TTL_SECONDS });
  }

  return { refreshToken, tokenId };
}

async function verifyRefreshToken(userId, tokenId, providedToken) {
  const key = buildRefreshKey(userId, tokenId);
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  const stored = await redisClient.get(key);
  if (!stored) return false;

  return stored === providedToken;
}

async function revokeRefreshToken(userId, tokenId) {
  const key = buildRefreshKey(userId, tokenId);
  if (redisClient && redisClient.isOpen) {
    await redisClient.del(key);
  }
}

module.exports = {
  generateAccessToken,
  generateAndStoreRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  REFRESH_TOKEN_TTL_SECONDS,
};
