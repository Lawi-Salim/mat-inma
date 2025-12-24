const { createClient } = require('redis');

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_URL = process.env.REDIS_URL;

// Prépare l'URL de connexion : priorité à REDIS_URL si définie
const url = REDIS_URL || `redis://${REDIS_HOST}:${REDIS_PORT}`;

const redisClient = createClient({
    url,
});

redisClient.on('connect', () => {
    console.log(`🧠 Redis: tentative de connexion à ${url}...`);
});

redisClient.on('ready', () => {
    console.log('✅ Redis: client prêt');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis: erreur de connexion ou d\'utilisation', err);
});

redisClient.on('end', () => {
    console.log('🧠 Redis: connexion fermée');
});

// On essaie de se connecter immédiatement au démarrage du backend
(async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (err) {
        console.error('❌ Redis: échec de connexion au démarrage (fallback sans cache)', err.message);
    }
})();

module.exports = redisClient;
