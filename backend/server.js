// backend/ -- server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { sequelize } = require('./models')
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const adminRoutes = require('./routes/admin');
const employeRoutes = require('./routes/employe');
const clientRoutes = require('./routes/client');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employe', employeRoutes);
app.use('/api/client', clientRoutes);

// Route de test
app.get('/api/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données établie');
        res.json({
            message: 'Serveur en marche ✅',
            datebase: 'Connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.log('❌ Erreur de connexion à la base de données:', error);
        res.status(500).json({
            message: 'Erreur de connexion à la base de données',
            error: error.message
        });
    }
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    res.status(500).json({
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'developpement' ? err.message: undefined
    });
});

// Synchroniser la base de données et démarrer le serveur
const startServer = async () => {
    try {
        // Tester la connexion
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données établie');

        // Sychroniser les modèles avec la base de données
        // ATTENTION: { force: true } supprime et recrée les tables
        // Utilisez { alter: true } en développement ou retirer l'option en production
        await sequelize.sync({ alter: false });
        console.log('📊 Modèles synchronisés avec la base de données');

        app.listen(PORT, () => {
            console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
            console.log(`📝 Environement: ${process.env.NODE_ENV || 'developpement'}`);
        });
    } catch (error) {
        console.log('❌ Erreur au démarrage du serveur:', error);
        process.exit(1);
    }
};

startServer();
