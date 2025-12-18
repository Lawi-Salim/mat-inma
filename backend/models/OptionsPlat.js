// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database');
// const bcrypt = require('bcryptjs');

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OptionsPlat = sequelize.define('OptionsPlat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  plat_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  prix_sup: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'optionsplat',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: false,
});

module.exports = OptionsPlat;