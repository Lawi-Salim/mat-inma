// backend/routes -- admin.js
const express = require('express');
const router = express.Router();

const { sequelize, User } = require('../models');

// Helper pour les statuts lisibles
const STATUS_LABELS = {
  en_attente: 'En attente',
  en_preparation: 'En préparation',
  prete: 'Prête',
  servie: 'Servie',
  annulee: 'Annulée',
};

function formatCommandeNumero(createdAt, seedNumber) {
  const date = new Date(createdAt);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);

  const normalizedSeed = Math.abs(seedNumber || 0) % 100000;
  const randomPart = String(normalizedSeed).padStart(5, '0');

  return `CMD-${dd}${mm}${yy}-${randomPart}`;
}

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [[statsRow]] = await sequelize.query(`
      SELECT
        COALESCE(SUM(CASE WHEN DATE(createdat) = CURRENT_DATE AND statut = 'servie' THEN total ELSE 0 END), 0) AS "revenueToday",
        COALESCE(COUNT(CASE WHEN DATE(createdat) = CURRENT_DATE THEN 1 END), 0)        AS "ordersToday",
        COALESCE(COUNT(CASE WHEN statut IN ('en_attente','en_preparation','prete') THEN 1 END), 0) AS "ordersInProgress",
        COALESCE(COUNT(DISTINCT CASE WHEN DATE(createdat) = CURRENT_DATE AND statut = 'servie' THEN utilisateur_id END), 0) AS "clientsToday"
      FROM "commande";
    `);

    const [[activeDishesRow]] = await sequelize.query(`
      SELECT COALESCE(COUNT(*), 0) AS "activeDishes" FROM "plat" WHERE disponible = TRUE;
    `);

    const [recentOrdersRows] = await sequelize.query(`
      SELECT
        c.id,
        c.total,
        c.statut,
        c.createdat,
        c.type_commande,
        c.numero_table,
        u.nom,
        u.prenom
      FROM "commande" c
      LEFT JOIN "utilisateur" u ON c.utilisateur_id = u.id
      ORDER BY c.createdat DESC
      LIMIT 5;
    `);

    const stats = {
      revenueToday: Number(statsRow.revenueToday || 0),
      ordersToday: Number(statsRow.ordersToday || 0),
      ordersInProgress: Number(statsRow.ordersInProgress || 0),
      activeDishes: Number(activeDishesRow.activeDishes || 0),
      clientsToday: Number(statsRow.clientsToday || 0),
    };

    const recentOrders = recentOrdersRows.map((row) => {
      let clientLabel = '—';

      if (row.type_commande === 'sur_place' && row.numero_table) {
        clientLabel = `Table ${row.numero_table}`;
      } else if (row.type_commande === 'emporter') {
        clientLabel = 'À emporter';
      } else if (row.type_commande === 'livraison') {
        clientLabel = 'Livraison';
      } else if (row.nom || row.prenom) {
        clientLabel = `${row.prenom || ''} ${row.nom || ''}`.trim();
      }

      return {
        id: row.id,
        date: row.createdat,
        clientLabel,
        amount: Number(row.total || 0),
        status: row.statut,
        statusLabel: STATUS_LABELS[row.statut] || row.statut,
      };
    });

    res.json({ stats, recentOrders });
  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    res.status(500).json({ message: "Erreur lors du chargement du tableau de bord.", error: error.message });
  }
});

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;

    const whereStatus = status ? 'WHERE c.statut = :status' : '';

    const [rows] = await sequelize.query(
      `SELECT
        c.id,
        c.total,
        c.statut,
        c.createdat,
        c.type_commande,
        c.numero_table
      FROM "commande" c
      ${whereStatus}
      ORDER BY c.createdat DESC
      LIMIT 100;`,
      { replacements: { status } }
    );

    const orders = rows.map((row) => {
      let tableLabel = '—';
      if (row.type_commande === 'sur_place' && row.numero_table) {
        tableLabel = `Table ${row.numero_table}`;
      } else if (row.type_commande === 'emporter') {
        tableLabel = 'À emporter';
      } else if (row.type_commande === 'livraison') {
        tableLabel = 'Livraison';
      }

      const seedNumber = Math.floor(new Date(row.createdat).getTime() / 1000);
      const numero = formatCommandeNumero(row.createdat, seedNumber);

      return {
        id: row.id,
        numero,
        table: tableLabel,
        total: Number(row.total || 0),
        status: row.statut,
        createdAt: row.createdat,
      };
    });

    res.json(orders);
  } catch (error) {
    console.error('Erreur récupération commandes admin:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des commandes.", error: error.message });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Le nouveau statut est requis.' });
    }

    const [result] = await sequelize.query(
      'UPDATE "commande" SET statut = :status, updatedat = CURRENT_TIMESTAMP WHERE id = :id RETURNING *;',
      { replacements: { id, status } }
    );

    const updated = Array.isArray(result) ? result[0] : result;

    if (!updated) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    let tableLabel = '—';
    if (updated.type_commande === 'sur_place' && updated.numero_table) {
      tableLabel = `Table ${updated.numero_table}`;
    } else if (updated.type_commande === 'emporter') {
      tableLabel = 'À emporter';
    } else if (updated.type_commande === 'livraison') {
      tableLabel = 'Livraison';
    }

    res.json({
      id: updated.id,
      table: tableLabel,
      total: Number(updated.total || 0),
      status: updated.statut,
      createdAt: updated.createdat,
    });
  } catch (error) {
    console.error('Erreur mise à jour statut commande:', error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du statut de la commande.", error: error.message });
  }
});

// GET /api/admin/employes
router.get('/employes', async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { role: 'employe' },
      order: [['createdat', 'DESC']],
      attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'role', 'actif', 'createdat'],
    });

    res.json(employees);
  } catch (error) {
    console.error('Erreur récupération employés:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des employés.", error: error.message });
  }
});

// POST /api/admin/employes
router.post('/employes', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, password } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ message: 'Nom, prénom, email et mot de passe sont requis.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà." });
    }

    const employee = await User.create({
      nom,
      prenom,
      email,
      telephone: telephone || null,
      password,
      role: 'employe',
      actif: true,
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Erreur création employé:', error);
    res.status(500).json({ message: "Erreur lors de la création de l'employé.", error: error.message });
  }
});

// PATCH /api/admin/employes/:id/actif
router.patch('/employes/:id/actif', async (req, res) => {
  try {
    const { id } = req.params;
    const { actif } = req.body;

    if (typeof actif !== 'boolean') {
      return res.status(400).json({ message: 'Le champ actif (booléen) est requis.' });
    }

    const employee = await User.findOne({ where: { id, role: 'employe' } });
    if (!employee) {
      return res.status(404).json({ message: 'Employé non trouvé.' });
    }

    employee.actif = actif;
    await employee.save();

    res.json(employee);
  } catch (error) {
    console.error('Erreur mise à jour employé:', error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'employé.", error: error.message });
  }
});

module.exports = router;
