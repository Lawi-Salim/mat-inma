// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database');
// const bcrypt = require('bcryptjs');

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Commande = sequelize.define('Commande', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  utilisateur_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  statut: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'en_attente',
    validate: {
      isIn: [['en_attente', 'en_preparation', 'prete', 'servie', 'annulee']],
    },
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  type_commande: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['sur_place', 'emporter', 'livraison']],
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  numero_table: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
}, {
  tableName: 'commande',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
});

module.exports = Commande;