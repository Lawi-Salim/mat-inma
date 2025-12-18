const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    utilisateur_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'utilisateur',
            key: 'id'
        }
    },
    date_reservation: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    heure: {
        type: DataTypes.INTEGER, 
        allowNull: false,
        validate: {
            min: 1,
            max: 20
        }
    },
    statut: {
        type: DataTypes.STRING(20),
        defaultValue: 'en_attente',
        validate: {
            isIn: [['en attente', 'confirmee', 'annulee', 'terminee']]
        }
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    telephone_contact: {
        type: DataTypes.STRING(30),
        allowNull: true
    }
}, {
    tableName: 'reservation', 
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Reservation;