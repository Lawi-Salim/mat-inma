// backend/routes -- employe.js
const express = require('express');
const router = express.Router();

const { sequelize } = require('../models');

function formatCommandeNumero(createdAt, seedNumber) {
  const date = new Date(createdAt);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);

  const normalizedSeed = Math.abs(seedNumber || 0) % 100000;
  const randomPart = String(normalizedSeed).padStart(5, '0');

  return `CMD-${dd}${mm}${yy}-${randomPart}`;
}

// GET /api/employe/kitchen/orders
router.get('/kitchen/orders', async (req, res) => {
  try {
    const [ordersRows] = await sequelize.query(`
      SELECT
        c.id,
        c.total,
        c.statut,
        c.createdat,
        c.type_commande,
        c.numero_table,
        u.nom || ' ' || u.prenom AS client_nom
      FROM "commande" c
      LEFT JOIN "utilisateur" u ON c.utilisateur_id = u.id
      WHERE c.statut = 'en_attente'
      ORDER BY c.createdat ASC
      LIMIT 100;
    `);

    if (!ordersRows || ordersRows.length === 0) {
      return res.json([]);
    }

    const commandeIds = ordersRows.map((row) => row.id);

    const [detailsRows] = await sequelize.query(
      `SELECT
        dc.commande_id,
        dc.quantite,
        dc.notes,
        p.id AS plat_id,
        p.nom AS plat_nom
      FROM "detailscommande" dc
      LEFT JOIN "plat" p ON dc.plat_id = p.id
      WHERE dc.commande_id IN (:ids);`,
      { replacements: { ids: commandeIds } }
    );

    const detailsByCommande = {};
    if (Array.isArray(detailsRows)) {
      for (const row of detailsRows) {
        if (!detailsByCommande[row.commande_id]) {
          detailsByCommande[row.commande_id] = [];
        }
        detailsByCommande[row.commande_id].push({
          platId: row.plat_id,
          nomPlat: row.plat_nom,
          quantite: Number(row.quantite || 0),
          commentaire: row.notes || null,
        });
      }
    }

    const orders = ordersRows.map((row) => {
      const seedNumber = Math.floor(new Date(row.createdat).getTime() / 1000);
      const numero = formatCommandeNumero(row.createdat, seedNumber);

      return {
        id: row.id,
        numero,
        statut: row.statut,
        createdAt: row.createdat,
        total: Number(row.total || 0),
        type_commande: row.type_commande,
        numero_table: row.numero_table,
        client_nom: row.client_nom || null,
        lignes: detailsByCommande[row.id] || [],
      };
    });

    res.json(orders);
  } catch (error) {
    console.error('Erreur récupération commandes cuisine:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes cuisine.', error: error.message });
  }
});

// PUT /api/employe/kitchen/orders/:id/status
router.put('/kitchen/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Le nouveau statut est requis.' });
    }

    // Adapter les statuts envoyés par le front aux valeurs autorisées par la BDD
    // Commande.statut CHECK (statut IN ('en_attente', 'en_preparation', 'prete', 'servie', 'annulee'))
    let nextStatus = status;
    if (status === 'livree') {
      // En cuisine, "Marquer comme livrée" signifie que la commande est prête à être encaissée
      nextStatus = 'prete';
    }

    const allowed = ['en_attente', 'en_preparation', 'prete', 'servie', 'annulee'];
    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({ message: `Statut invalide: ${status}` });
    }

    const [result] = await sequelize.query(
      'UPDATE "commande" SET statut = :status, updatedat = CURRENT_TIMESTAMP WHERE id = :id RETURNING *;',
      { replacements: { id, status: nextStatus } }
    );

    const updated = Array.isArray(result) ? result[0] : result;

    if (!updated) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    const seedNumber = Math.floor(new Date(updated.createdat).getTime() / 1000);
    const numero = formatCommandeNumero(updated.createdat, seedNumber);

    res.json({
      id: updated.id,
      numero,
      statut: updated.statut,
      createdAt: updated.createdat,
      total: Number(updated.total || 0),
      type_commande: updated.type_commande,
      numero_table: updated.numero_table,
    });
  } catch (error) {
    console.error('Erreur mise à jour statut commande (cuisine):', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut de la commande.', error: error.message });
  }
});

// GET /api/employe/cash/orders
router.get('/cash/orders', async (req, res) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT
        c.id,
        c.total,
        c.statut,
        c.createdat,
        c.type_commande,
        c.numero_table
      FROM "commande" c
      WHERE DATE(c.createdat) = CURRENT_DATE
      ORDER BY c.createdat DESC
      LIMIT 200;
    `);

    const orders = rows.map((row) => {
      const seedNumber = Math.floor(new Date(row.createdat).getTime() / 1000);
      const numero = formatCommandeNumero(row.createdat, seedNumber);

      return {
        id: row.id,
        numero,
        statut: row.statut,
        createdAt: row.createdat,
        total: Number(row.total || 0),
        type_commande: row.type_commande,
        numero_table: row.numero_table,
      };
    });

    res.json(orders);
  } catch (error) {
    console.error('Erreur récupération commandes caisse:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes caisse.', error: error.message });
  }
});

// PUT /api/employe/cash/orders/:id/payment
router.put('/cash/orders/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await sequelize.query(
      `UPDATE "commande"
       SET statut = 'servie', updatedat = CURRENT_TIMESTAMP
       WHERE id = :id
       RETURNING *;`,
      { replacements: { id } }
    );

    const updated = Array.isArray(result) ? result[0] : result;

    if (!updated) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    const seedNumber = Math.floor(new Date(updated.createdat).getTime() / 1000);
    const numero = formatCommandeNumero(updated.createdat, seedNumber);

    res.json({
      id: updated.id,
      numero,
      statut: updated.statut,
      createdAt: updated.createdat,
      total: Number(updated.total || 0),
      type_commande: updated.type_commande,
      numero_table: updated.numero_table,
    });
  } catch (error) {
    console.error('Erreur validation paiement (caisse):', error);
    res.status(500).json({ message: 'Erreur lors de la validation du paiement.', error: error.message });
  }
});

module.exports = router;
