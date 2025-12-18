// backend/models -- User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nom: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    prenom: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    telephone: {
        type: DataTypes.STRING(30),
        allowNull: true
    },
    role: {
        type: DataTypes.STRING(20),
        defaultValue: 'client',
        validate: {
            isIn: [['client', 'admin', 'employe']]
        }
    },
    actif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'utilisateur',
    timestamps: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
})

// Méthode pour comparer les mots de passe
User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

// Methode pour obtenir l'utilisateur sans le mot de passe
User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    return values;
}

module.exports = User;