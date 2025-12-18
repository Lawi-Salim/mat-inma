// backend/models -- Favori.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Favori = sequelize.define('Favori', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  utilisateur_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  plat_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'favori',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
});

module.exports = Favori;
