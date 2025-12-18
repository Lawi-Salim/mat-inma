// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database');
// const bcrypt = require('bcryptjs');

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetailsCommande = sequelize.define('DetailsCommande', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  commande_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  plat_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  prix_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  options_json: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'detailscommande',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: false,
});

module.exports = DetailsCommande;