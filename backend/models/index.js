// backend/modes -- index.js
const sequelize = require('../config/database');
const User = require('./User');
const Categorie = require('./Categorie');
const Plat = require('./Plat');
const OptionsPlat = require('./OptionsPlat');
const Commande = require('./Commande');
const DetailsCommande = require('./DetailsCommande');
const Paiement = require('./Paiement');
const Reservation = require('./Reservation');
const Favori = require('./Favori');

// DEFINITION DES RELATIONS

// Categorie -> Plat (One to Many)
Categorie.hasMany(Plat, {
    foreignKey: 'categorie_id',
    as: 'plats'
});
Plat.belongsTo(Categorie, {
    foreignKey: 'categorie_id',
    as: 'categorie'
});

// Plat -> OptionPlat (One to Many)
Plat.hasMany(OptionsPlat, {
    foreignKey: 'plat_id',
    as: 'options'
});
OptionsPlat.belongsTo(Plat, {
    foreignKey: 'plat_id',
    as: 'plat'
});

// User -> Commande (One to Many)
User.hasMany(Commande, {
    foreignKey: 'utilisateur_id',
    as: 'commandes'
});
Commande.belongsTo(User, {
    foreignKey: 'utilisateur_id',
    as: 'utilisateur'
});

// Commande -> DetailsCommande (One to Many)
Commande.hasMany(DetailsCommande, {
    foreignKey:'commande_id',
    as: 'details'
});
DetailsCommande.belongsTo(Commande, {
    foreignKey: 'commande_id',
    as: 'commande'
});

// Plat -> DetailsCommande (One to Many)
Plat.hasMany(DetailsCommande, {
    foreignKey: 'plat_id',
    as: 'details_commande'
});
DetailsCommande.belongsTo(Plat, {
    foreignKey: 'plat_id',
    as: 'plat'
});

// Commande -> Paiement (One to Many)
Commande.hasMany(Paiement, {
    foreignKey: 'commande_id',
    as: 'paiements'
});
Paiement.belongsTo(Commande, {
    foreignKey: 'commande_id',
    as: 'commande'
});

// User -> Reservation (One to Many)
User.hasMany(Reservation, {
    foreignKey: 'utilisateur_id',
    as: 'reservations'
});
Reservation.belongsTo(User, {
    foreignKey: 'utilisateur_id',
    as: 'utilisateur'
});

module.exports = {
    sequelize,
    User,
    Categorie,
    Plat,
    OptionsPlat,
    Commande,
    DetailsCommande,
    Paiement,
    Reservation,
    Favori,
}