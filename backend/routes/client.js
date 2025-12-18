// backend/routes -- client.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Import dynamique compatible avec node-fetch v3 (ESM)
const fetch = (...args) => import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args));

const { sequelize, Favori, Plat, Commande, DetailsCommande, Paiement } = require('../models');
const { authMiddleware } = require('../middleware/auth');

function formatCommandeNumero(createdAt, seedNumber) {
  const date = new Date(createdAt);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);

  const normalizedSeed = Math.abs(seedNumber || 0) % 100000;
  const randomPart = String(normalizedSeed).padStart(5, '0');

  return `CMD-${dd}${mm}${yy}-${randomPart}`;
}

function formatTicketNumber(createdAt, seedNumber) {
  const date = new Date(createdAt);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);

  const normalizedSeed = Math.abs(seedNumber || 0) % 1000000;
  const randomPart = String(normalizedSeed).padStart(6, '0');

  return `TCKT-${randomPart}-${yy}${mm}${dd}`;
}

async function buildTicketJsonAndNumber(commande, details, paiementMethod) {
  const seedNumber = Math.floor(new Date(commande.createdat).getTime() / 1000);
  const ticketNumber = formatTicketNumber(commande.createdat, seedNumber);

  const lignes = (details || []).map((row) => {
    const quantite = Number(row.quantite || 0);
    const prixUnitaire = Number(row.prix_unitaire || 0);
    return {
      quantite,
      nomPlat: row.plat_nom || null,
      commentaire: row.notes || null,
      prixUnitaire,
      totalLigne: prixUnitaire * quantite,
    };
  });

  const ticketJson = {
    ticket_number: ticketNumber,
    commande_id: commande.id,
    commande_numero: formatCommandeNumero(commande.createdat, seedNumber),
    created_at: commande.createdat,
    statut_commande: commande.statut,
    type_commande: commande.type_commande,
    numero_table: commande.numero_table,
    total: Number(commande.total || 0),
    paiement: {
      methode: paiementMethod,
      statut: 'paye',
    },
    lignes,
  };

  return { ticketNumber, ticketJson };
}

async function generateTicketPdfViaService(ticketJson, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `ticket-${ticketJson.ticket_number}.pdf`;
  const filePath = path.join(outputDir, fileName);

  const serviceUrl = process.env.PDF_SERVICE_URL || 'http://localhost:8000/generate-ticket';

  let response;
  try {
    response = await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketJson),
    });
  } catch (err) {
    console.error('Erreur de connexion au service PDF:', err);
    throw new Error("Impossible de contacter le service de génération de PDF.");
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('Erreur du service PDF:', response.status, text);
    throw new Error(`Service PDF a renvoyé une erreur (${response.status}).`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

// GET /api/client/orders - commandes de l'utilisateur connecté
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await sequelize.query(
      `SELECT
        c.id,
        c.total,
        c.statut,
        c.createdat,
        c.type_commande,
        c.numero_table
      FROM "commande" c
      WHERE c.utilisateur_id = :userId
      ORDER BY c.createdat DESC
      LIMIT 100;`,
      { replacements: { userId } }
    );

    const orders = (rows || []).map((row) => {
      const seedNumber = Math.floor(new Date(row.createdat).getTime() / 1000);
      const numero = formatCommandeNumero(row.createdat, seedNumber);

      return {
        id: row.id,
        numero,
        total: Number(row.total || 0),
        statut: row.statut,
        createdAt: row.createdat,
        type_commande: row.type_commande,
        numero_table: row.numero_table,
      };
    });

    res.json({ orders });
  } catch (error) {
    console.error('Erreur récupération commandes client:', error);
    res
      .status(500)
      .json({ message: 'Erreur lors de la récupération des commandes.', error: error.message });
  }
});

// GET /api/client/orders/:id - détail d'une commande du client connecté
router.get('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [rows] = await sequelize.query(
      `SELECT c.id, c.total, c.statut, c.createdat, c.type_commande, c.numero_table
       FROM "commande" c
       WHERE c.id = :id AND c.utilisateur_id = :userId
       LIMIT 1;`,
      { replacements: { id, userId } }
    );

    const commande = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    const [detailsRows] = await sequelize.query(
      `SELECT dc.quantite, dc.notes, p.nom AS plat_nom, dc.prix_unitaire
       FROM "detailscommande" dc
       LEFT JOIN "plat" p ON dc.plat_id = p.id
       WHERE dc.commande_id = :commandeId;`,
      { replacements: { commandeId: commande.id } }
    );

    const seedNumber = Math.floor(new Date(commande.createdat).getTime() / 1000);
    const numero = formatCommandeNumero(commande.createdat, seedNumber);

    const lignes = (detailsRows || []).map((row) => ({
      quantite: Number(row.quantite || 0),
      nomPlat: row.plat_nom || null,
      commentaire: row.notes || null,
      prixUnitaire: Number(row.prix_unitaire || 0),
      totalLigne: Number(row.prix_unitaire || 0) * Number(row.quantite || 0),
    }));

    res.json({
      id: commande.id,
      numero,
      total: Number(commande.total || 0),
      statut: commande.statut,
      createdAt: commande.createdat,
      type_commande: commande.type_commande,
      numero_table: commande.numero_table,
      lignes,
    });
  } catch (error) {
    console.error('Erreur récupération détail commande client:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du détail de la commande.',
      error: error.message,
    });
  }
});

// PUT /api/client/orders/:id/pay - marquer la commande comme payée par le client
router.put('/orders/:id/pay', authMiddleware, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const paiementMethode = 'espece';

    const commande = await Commande.findOne({
      where: { id, utilisateur_id: userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    if (!['prete', 'servie'].includes(commande.statut)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'La commande doit être prête ou déjà servie pour être payée.' });
    }

    commande.statut = 'servie';
    await commande.save({ transaction });

    const existingPaiement = await Paiement.findOne({
      where: { commande_id: commande.id, statut: 'paye' },
      transaction,
    });

    let paiement = existingPaiement;

    const [detailsRows] = await sequelize.query(
      `SELECT dc.quantite, dc.notes, p.nom AS plat_nom, dc.prix_unitaire
       FROM "detailscommande" dc
       LEFT JOIN "plat" p ON dc.plat_id = p.id
       WHERE dc.commande_id = :commandeId;`,
      { replacements: { commandeId: commande.id }, transaction }
    );

    const { ticketNumber, ticketJson } = await buildTicketJsonAndNumber(commande.toJSON(), detailsRows, paiementMethode);

    const ticketsDir = path.join(__dirname, '..', 'tickets');
    const pdfPath = await generateTicketPdfViaService(ticketJson, ticketsDir);

    const paiementData = {
      commande_id: commande.id,
      montant: commande.total,
      methode: paiementMethode,
      statut: 'paye',
      ticket_number: ticketNumber,
      ticket_json: ticketJson,
      ticket_pdf_path: pdfPath,
      ticket_generated_at: new Date(),
    };

    if (paiement) {
      await paiement.update(paiementData, { transaction });
    } else {
      paiement = await Paiement.create(paiementData, { transaction });
    }

    await transaction.commit();

    const seedNumber = Math.floor(new Date(commande.createdat).getTime() / 1000);
    const numero = formatCommandeNumero(commande.createdat, seedNumber);

    res.json({
      id: commande.id,
      numero,
      total: Number(commande.total || 0),
      statut: commande.statut,
      createdAt: commande.createdat,
      type_commande: commande.type_commande,
      numero_table: commande.numero_table,
      paiement: {
        id: paiement.id,
        statut: paiement.statut,
        methode: paiement.methode,
        ticket_number: paiement.ticket_number,
      },
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error('Erreur paiement commande client:', error);
    res.status(500).json({
      message: "Erreur lors du paiement de la commande.",
      error: error.message,
    });
  }
});

router.get('/orders/:id/ticket.pdf', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [rows] = await sequelize.query(
      `SELECT c.id, c.statut
       FROM "commande" c
       WHERE c.id = :id AND c.utilisateur_id = :userId
       LIMIT 1;`,
      { replacements: { id, userId } }
    );

    const commande = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    if (commande.statut !== 'servie') {
      return res.status(400).json({ message: 'Le ticket est disponible uniquement pour les commandes servies.' });
    }

    const paiement = await Paiement.findOne({
      where: {
        commande_id: commande.id,
        statut: 'paye',
      },
    });

    if (!paiement || !paiement.ticket_pdf_path) {
      return res.status(404).json({ message: 'Ticket non disponible pour cette commande.' });
    }

    const pdfPath = paiement.ticket_pdf_path;
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'Fichier de ticket introuvable sur le serveur.' });
    }

    return res.download(pdfPath, path.basename(pdfPath));
  } catch (error) {
    console.error('Erreur téléchargement ticket PDF:', error);
    res.status(500).json({
      message: 'Erreur lors du téléchargement du ticket PDF.',
      error: error.message,
    });
  }
});

// POST /api/client/orders - créer une vraie commande à partir du panier (SQL brut)
router.post('/orders', authMiddleware, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { items, tableNumber, typeCommande } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Le panier est vide.' });
    }

    // Récupérer les plats concernés pour calculer les montants
    const platIds = items.map((it) => it.platId);
    const plats = await Plat.findAll({ where: { id: platIds } });
    const platById = new Map(plats.map((p) => [p.id, p]));

    let total = 0;
    for (const item of items) {
      const plat = platById.get(item.platId);
      if (!plat) {
        await transaction.rollback();
        return res.status(400).json({ message: `Plat introuvable (id=${item.platId}).` });
      }
      const qte = Number(item.quantite || 0);
      if (!Number.isFinite(qte) || qte <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: `Quantité invalide pour le plat ${plat.nom}.` });
      }
      total += qte * Number(plat.prix || 0);
    }

    const allowedTypes = ['sur_place', 'emporter', 'livraison'];
    const typeCommandeValue = allowedTypes.includes(typeCommande) ? typeCommande : 'sur_place';

    // Insertion dans commande
    const [commandeRows] = await sequelize.query(
      `INSERT INTO "commande" (utilisateur_id, total, statut, type_commande, numero_table, createdat, updatedat)
       VALUES (:userId, :total, 'en_attente', :type_commande, :numero_table, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *;`,
      {
        transaction,
        replacements: {
          userId,
          total,
          type_commande: typeCommandeValue,
          numero_table: tableNumber || null,
        },
      }
    );

    const commande = Array.isArray(commandeRows) ? commandeRows[0] : commandeRows;

    // Insertion des lignes de détail (la table ne possède pas de colonne updatedat)
    for (const item of items) {
      const plat = platById.get(item.platId);
      const prixUnitaire = Number(plat?.prix || 0);

      await sequelize.query(
        `INSERT INTO "detailscommande" (commande_id, plat_id, quantite, prix_unitaire, notes, createdat)
         VALUES (:commande_id, :plat_id, :quantite, :prix_unitaire, :notes, CURRENT_TIMESTAMP);`,
        {
          transaction,
          replacements: {
            commande_id: commande.id,
            plat_id: item.platId,
            quantite: item.quantite,
            prix_unitaire: prixUnitaire,
            notes: item.notes || null,
          },
        }
      );
    }

    await transaction.commit();

    res.status(201).json({
      message: 'Commande créée avec succès.',
      order: {
        id: commande.id,
        total,
        statut: commande.statut,
        type_commande: commande.type_commande,
        numero_table: commande.numero_table,
        createdAt: commande.createdat,
      },
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error('Erreur création commande client:', error);
    res
      .status(500)
      .json({ message: 'Erreur lors de la création de la commande.', error: error.message });
  }
});

// GET /api/client/favorites - liste des plats favoris de l'utilisateur
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const favoris = await Favori.findAll({ where: { utilisateur_id: userId } });
    const platIds = favoris.map((f) => f.plat_id);

    if (!platIds.length) {
      return res.json({ favorites: [] });
    }

    const plats = await Plat.findAll({ where: { id: platIds } });

    res.json({ favorites: plats });
  } catch (error) {
    console.error('Erreur récupération favoris client:', error);
    res
      .status(500)
      .json({ message: 'Erreur lors de la récupération des favoris.', error: error.message });
  }
});

// POST /api/client/favorites - ajouter un plat aux favoris
router.post('/favorites', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { platId } = req.body;

    if (!platId) {
      return res.status(400).json({ message: 'platId est requis.' });
    }

    const existing = await Favori.findOne({ where: { utilisateur_id: userId, plat_id: platId } });
    if (existing) {
      return res.status(200).json({ message: 'Déjà en favori.' });
    }

    const favori = await Favori.create({ utilisateur_id: userId, plat_id: platId });
    res.status(201).json({ message: 'Ajouté aux favoris.', favori });
  } catch (error) {
    console.error('Erreur ajout favori client:', error);
    res
      .status(500)
      .json({ message: "Erreur lors de l'ajout du favori.", error: error.message });
  }
});

// DELETE /api/client/favorites/:platId - retirer un plat des favoris
router.delete('/favorites/:platId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { platId } = req.params;

    await Favori.destroy({ where: { utilisateur_id: userId, plat_id: platId } });

    res.json({ message: 'Favori retiré.' });
  } catch (error) {
    console.error('Erreur suppression favori client:', error);
    res
      .status(500)
      .json({ message: 'Erreur lors de la suppression du favori.', error: error.message });
  }
});

module.exports = router;
