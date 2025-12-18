// backend/routes -- menu.js
const express = require('express');
const router = express.Router();
const { Categorie, Plat } = require('../models');

// ----- CATEGORIES -----
router.get('/categories', async (req, res) => {
  try {
    const categories = await Categorie.findAll({
      order: [['ordre_affichage', 'ASC'], ['nom', 'ASC']],
    });
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

    const plats = await Plat.findAll({
      where,
      order: [['nom', 'ASC']],
    });
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
    res.status(204).send();
  } catch (error) {
    console.error('Erreur suppression plat:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du plat.' });
  }
});

module.exports = router;
