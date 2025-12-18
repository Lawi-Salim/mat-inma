// backend/models -- Paiement.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paiement = sequelize.define('Paiement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  commande_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  montant: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  methode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['espece', 'carte', 'mobile_money', 'en_ligne']],
    },
  },
  statut: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'en_attente',
    validate: {
      isIn: [['en_attente', 'paye', 'echoue', 'rembourse']],
    },
  },
  transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  reference_externe: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  ticket_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  ticket_json: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  ticket_pdf_path: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ticket_generated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'paiement',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
});

module.exports = Paiement;