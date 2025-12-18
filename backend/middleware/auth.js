// backend/middleware -- auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
    try {
        // Récupérer le token du header
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Accès refusé. \nToken manquant ou invalide'
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Vérfiier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Trouver l'utilisateur
        const user = await User.findByPk(decoded.userId);

        // Vérifier si l'utilisateur est actif
        if (!user.actif) {
            return res.status(403).json({
                message: 'Compte désactivé.'
            });
        }

        // Ajouter l'utilisateur à l requête
        req.user = user;
        res.userId = user.id;
        req.userRole = user.role;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Token invalide'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expiré. Veuillez vous reconnecter.'
            });
        }
        console.error('Error middleware auth:', error);
        res.status(500).json({
            message: 'Erreur d\'authentification'
        });
    }
};

// Middleware pour vérifier les rôles
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.userRole) {
            return res.status(401).json({
                message: 'Non authentifié.'
            });
        }

        if (!roles.includes(req.userRole)) {
            return res.status(403).json({
                message: 'Accès refusé. Permissions insuffisantes.'
            });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    checkRole
};
