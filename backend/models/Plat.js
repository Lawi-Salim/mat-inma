const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plat = sequelize.define('Plat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nom: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  prix: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  categorie_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categorie',
      key: 'id',
    },
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  popularite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'plat',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
});

module.exports = Plat;