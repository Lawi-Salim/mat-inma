// backend/routes -- auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const {
    generateAccessToken,
    generateAndStoreRefreshToken,
    verifyRefreshToken,
    revokeRefreshToken,
    REFRESH_TOKEN_TTL_SECONDS,
} = require('../config/tokenService');

// Route d'inscription
router.post('/register', async (req, res) => {
    try {
        const {
            nom, 
            prenom, 
            email, 
            password, 
            telephone,
            role
        } = req.body;

        // Validation des champs requis
        if (!nom || !prenom || !email || !password) {
            return res.status(400).json({
                message: 'Tous les champs obligatoires doivent être remplis.'
            });
        }

        // Vérifier si l'utilisateur existe déjà
        const user = await User.create({
            nom,
            prenom,
            email,
            password,
            telephone,
            role: role || 'client'
        });

        // Générer les tokens (accès + refresh)
        const accessToken = generateAccessToken(user);
        const { refreshToken, tokenId } = await generateAndStoreRefreshToken(user.id);

        res.status(201).json({
            message: 'Inscription réussie.',
            token: accessToken,
            refreshToken,
            refreshTokenTTL: REFRESH_TOKEN_TTL_SECONDS,
            tokenId,
            user: user.toJSON(),
        });
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'inscription.',
            error: process.env.NODE_ENV === 'developpement' ? error.message : undefined
        });
    }
});

// Route de connexion
router.post('/login', async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        // Validation des champs
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email et mot de pass requis.'
            });
        }

        // Trouver l'utilisateur
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                message: 'Email ou mot de passe incorrect.'
            });
        }

        // Vérifier si l'utilisateur est actif
        if (!user.actif) {
            return res.status(403).json({
                message: 'Compte désactivé. Contactez l\'administrateur.'
            });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Mot de passe incorrect.'
            });
        }

        // Générer les tokens (accès + refresh)
        const accessToken = generateAccessToken(user);
        const { refreshToken, tokenId } = await generateAndStoreRefreshToken(user.id);

        res.json({
            message: 'Connexion réussie.',
            token: accessToken,
            refreshToken,
            refreshTokenTTL: REFRESH_TOKEN_TTL_SECONDS,
            tokenId,
            user: user.toJSON(),
        })
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({
            message: 'Erreur lors de la connexion.',
            error: process.env.NODE_ENV === 'developpment' ? error.message : undefined
        });
    }
});

// Route pour récupérer l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
    try {
        res.json({
            user: req.user.toJSON()
        });
    } catch (error) {
        console.error('Erreur de récupération de l\'utilisateur', error);
        res.status(500).json({ 
            message: 'Erreur serveur.'
        });
    }
});

// Route pour mettre à jour le profil
router.put('/profil', authMiddleware, async (req, res) => {
    try {
        const {
            nom, 
            prenom,
            telephone
        } = req.body;

        const user= req.user;

        // Mettre à jour uniquement les champs uniquement
        if (nom) user.nom = nom;
        if (prenom) user.prenom = prenom;
        if (telephone !== undefined) user.telephone = telephone;
        
        await user.save()

        req.json({
            message: 'Profil mis à jour avec succès.',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Ereur mise à jour du profil:', error);
        req.status(500).json({
            message: 'Erreur lors de la mise à jour du profil.'
        })
    }
});

// Route pour changer le mot de passe
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const {
            last_password, 
            new_password 
        } = req.body;

        const user = req.user;

        // Vérifier l'ancien mot de passe
        const isValid = await user.comparePassword(last_password);
        if (!isValid) {
            return res.status(401).json
                ({
                    message: 'Ancien mot de passe incorrect.'
                });
        }

        // Vérifier la longueur du nouveau mot de passe
        if (new_password.length < 6) {
            return res.status(400).json({
                message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.'
            });
        }

        // Mettre à jour le mot de passe
        user.password = new_password;
        await user.save();

        res.json({
            message: 'Mot de passe modifié avec succès.'
        });
    } catch (error) {
        console.error('Erreur de changement de mot de passe.', error);
        res.status(500).json({
            message: 'Erreur lors du changement de mot de passe'
        })
    }
})

// Rafraîchir le token d'accès à partir d'un refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { userId, tokenId, refreshToken } = req.body || {};

        if (!userId || !tokenId || !refreshToken) {
            return res.status(400).json({ message: 'Données de rafraîchissement manquantes.' });
        }

        const isValid = await verifyRefreshToken(userId, tokenId, refreshToken);
        if (!isValid) {
            return res.status(401).json({ message: 'Refresh token invalide ou expiré.' });
        }

        const user = await User.findByPk(userId);
        if (!user || !user.actif) {
            return res.status(401).json({ message: 'Utilisateur non valide ou désactivé.' });
        }

        const accessToken = generateAccessToken(user, { expiresIn: '1h' });

        return res.json({
            token: accessToken,
            user: user.toJSON(),
        });
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token:', error);
        return res.status(500).json({ message: 'Erreur lors du rafraîchissement du token.' });
    }
});

// Déconnexion : révoquer un refresh token
router.post('/logout', async (req, res) => {
    try {
        const { userId, tokenId } = req.body || {};

        if (!userId || !tokenId) {
            return res.status(400).json({ message: 'Données de déconnexion manquantes.' });
        }

        await revokeRefreshToken(userId, tokenId);

        return res.json({ message: 'Déconnexion réussie.' });
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        return res.status(500).json({ message: 'Erreur lors de la déconnexion.' });
    }
});

module.exports = router;
