// backend/routes -- menu.js
const express = require('express');
const router = express.Router();
const { Categorie, Plat } = require('../models');
const redisClient = require('../config/redis');

// ----- CATEGORIES -----
router.get('/categories', async (req, res) => {
  const cacheKey = 'menu:categories';

  try {
    if (redisClient && redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }
  } catch (error) {
    console.error('Erreur lecture cache Redis (categories):', error);
  }

  try {
    const categories = await Categorie.findAll({
      order: [['ordre_affichage', 'ASC'], ['nom', 'ASC']],
    });
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.set(cacheKey, JSON.stringify(categories), { EX: 120 });
      }
    } catch (error) {
      console.error('Erreur écriture cache Redis (categories):', error);
    }

    res.json(categories);
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des catégories.' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { nom, description, actif } = req.body;

    if (!nom) {
      return res.status(400).json({ message: 'Le nom de la catégorie est requis.' });
    }

    const lastCategorie = await Categorie.findOne({
      order: [['ordre_affichage', 'DESC']],
    });

    const nextOrder = lastCategorie
      ? (lastCategorie.ordre_affichage || 0) + 1
      : 1;

    const categorie = await Categorie.create({
      nom,
      description,
      ordre_affichage: nextOrder,
      actif: typeof actif === 'boolean' ? actif : true,
    });

    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.del('menu:categories');
        await redisClient.del('menu:plats:all:all');
      }
    } catch (err) {
      console.error('Erreur invalidation cache menu (création catégorie):', err);
    }

    res.status(201).json(categorie);
  } catch (error) {
    console.error('Erreur création catégorie:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la catégorie.' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categorie = await Categorie.findByPk(id);
    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie non trouvée.' });
    }

    const { nom, description, ordre_affichage, actif } = req.body;
    if (nom !== undefined) categorie.nom = nom;
    if (description !== undefined) categorie.description = description;
    if (ordre_affichage !== undefined) categorie.ordre_affichage = ordre_affichage;
    if (actif !== undefined) categorie.actif = actif;

    await categorie.save();
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.del('menu:categories');
        await redisClient.del('menu:plats:all:all');
      }
    } catch (err) {
      console.error('Erreur invalidation cache menu (mise à jour catégorie):', err);
    }

    res.json(categorie);
  } catch (error) {
    console.error('Erreur mise à jour catégorie:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la catégorie.' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categorie = await Categorie.findByPk(id);
    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie non trouvée.' });
    }

    await categorie.destroy();
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.del('menu:categories');
        await redisClient.del('menu:plats:all:all');
      }
    } catch (err) {
      console.error('Erreur invalidation cache menu (suppression catégorie):', err);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erreur suppression catégorie:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la catégorie.' });
  }
});

// ----- PLATS -----
router.get('/plats', async (req, res) => {
  try {
    const { categorieId, disponible } = req.query;
    const where = {};

    if (categorieId) {
      where.categorie_id = categorieId;
    }
    if (disponible !== undefined) {
      where.disponible = disponible === 'true';
    }

    const cacheKeyParts = [
      'menu:plats',
      categorieId || 'all',
      disponible !== undefined ? String(disponible) : 'all',
    ];
    const cacheKey = cacheKeyParts.join(':');

    try {
      if (redisClient && redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      }
    } catch (error) {
      console.error('Erreur lecture cache Redis (plats):', error);
    }

    const plats = await Plat.findAll({
      where,
      order: [['nom', 'ASC']],
    });

    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.set(cacheKey, JSON.stringify(plats), { EX: 120 });
      }
    } catch (error) {
      console.error('Erreur écriture cache Redis (plats):', error);
    }

    res.json(plats);
  } catch (error) {
    console.error('Erreur récupération plats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des plats.' });
  }
});

router.post('/plats', async (req, res) => {
  try {
    const { nom, description, prix, categorie_id, image_url, disponible } = req.body;
    const plat = await Plat.create({ nom, description, prix, categorie_id, image_url, disponible });
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.del('menu:plats:all:all');
      }
    } catch (err) {
      console.error('Erreur invalidation cache menu (création plat):', err);
    }

    res.status(201).json(plat);
  } catch (error) {
    console.error('Erreur création plat:', error);
    res.status(500).json({ message: 'Erreur lors de la création du plat.' });
  }
});

router.put('/plats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plat = await Plat.findByPk(id);
    if (!plat) {
      return res.status(404).json({ message: 'Plat non trouvé.' });
    }

    const { nom, description, prix, categorie_id, image_url, disponible } = req.body;
    if (nom !== undefined) plat.nom = nom;
    if (description !== undefined) plat.description = description;
    if (prix !== undefined) plat.prix = prix;
    if (categorie_id !== undefined) plat.categorie_id = categorie_id;
    if (image_url !== undefined) plat.image_url = image_url;
    if (disponible !== undefined) plat.disponible = disponible;

    await plat.save();
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.del('menu:plats:all:all');
      }
    } catch (err) {
      console.error('Erreur invalidation cache menu (mise à jour plat):', err);
    }

    res.json(plat);
  } catch (error) {
    console.error('Erreur mise à jour plat:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du plat.' });
  }
});

router.delete('/plats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plat = await Plat.findByPk(id);
    if (!plat) {
      return res.status(404).json({ message: 'Plat non trouvé.' });
    }

    await plat.destroy();
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.del('menu:plats:all:all');
      }
    } catch (err) {
      console.error('Erreur invalidation cache menu (suppression plat):', err);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erreur suppression plat:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du plat.' });
  }
});

module.exports = router;
