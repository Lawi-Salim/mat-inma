-- ========================================
-- BASE DE DONNÉES MAT-INMA
-- Système de gestion de restaurant
-- ========================================

-- ========================================
-- SUPPRESSION DES TABLES (POUR LE DÉVELOPPEMENT)
-- ========================================
DROP TABLE IF EXISTS Paiement CASCADE;
DROP TABLE IF EXISTS DetailsCommande CASCADE;
DROP TABLE IF EXISTS Commande CASCADE;
DROP TABLE IF EXISTS Reservation CASCADE;
DROP TABLE IF EXISTS OptionsPlat CASCADE;
DROP TABLE IF EXISTS Plat CASCADE;
DROP TABLE IF EXISTS Categorie CASCADE;
DROP TABLE IF EXISTS Utilisateur CASCADE;

-- ========================================
-- CRÉATION DES TABLES
-- ========================================

-- Table Utilisateur
CREATE TABLE Utilisateur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  telephone VARCHAR(30),
  role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'admin', 'employe')),
  actif BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Categorie
CREATE TABLE Categorie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  ordre_affichage INT DEFAULT 0,
  actif BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Plat (corrigé de "Tables")
CREATE TABLE Plat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(150) NOT NULL,
  description TEXT,
  prix NUMERIC(10,2) NOT NULL CHECK (prix >= 0),
  categorie_id UUID REFERENCES Categorie(id) ON DELETE SET NULL,
  image_url TEXT,
  disponible BOOLEAN DEFAULT TRUE,
  popularite INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table OptionsPlat
CREATE TABLE OptionsPlat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plat_id UUID REFERENCES Plat(id) ON DELETE CASCADE,
  nom VARCHAR(100) NOT NULL,
  prix_sup NUMERIC(10,2) DEFAULT 0 CHECK (prix_sup >= 0),
  disponible BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Commande
CREATE TABLE Commande (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id UUID REFERENCES Utilisateur(id) ON DELETE SET NULL,
  statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_preparation', 'prete', 'servie', 'annulee')),
  total NUMERIC(10,2) DEFAULT 0 CHECK (total >= 0),
  type_commande VARCHAR(20) CHECK (type_commande IN ('sur_place', 'emporter', 'livraison')),
  notes TEXT,
  numero_table VARCHAR(20),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table DetailsCommande
CREATE TABLE DetailsCommande (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID REFERENCES Commande(id) ON DELETE CASCADE,
  plat_id UUID REFERENCES Plat(id) ON DELETE SET NULL,
  quantite INT NOT NULL CHECK (quantite > 0),
  prix_unitaire NUMERIC(10,2) NOT NULL CHECK (prix_unitaire >= 0),
  prix_total NUMERIC(10,2) NOT NULL CHECK (prix_total >= 0),
  options_json JSONB,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Paiement
CREATE TABLE Paiement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID REFERENCES Commande(id) ON DELETE CASCADE,
  montant NUMERIC(10,2) NOT NULL CHECK (montant >= 0),
  methode VARCHAR(20) NOT NULL CHECK (methode IN ('espece', 'carte', 'mobile_money', 'en_ligne')),
  statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'paye', 'echoue', 'rembourse')),
  transaction_id VARCHAR(255),
  reference_externe VARCHAR(255),
  ticket_number VARCHAR(50),
  ticket_json JSONB,
  ticket_pdf_path TEXT,
  ticket_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Reservation
CREATE TABLE Reservation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id UUID REFERENCES Utilisateur(id) ON DELETE CASCADE,
  date_reservation DATE NOT NULL,
  heure TIME NOT NULL,
  nombre_places INT NOT NULL CHECK (nombre_places > 0 AND nombre_places <= 20),
  statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmee', 'annulee', 'terminee')),
  notes TEXT,
  telephone_contact VARCHAR(30),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- ========================================

-- Index sur Utilisateur
CREATE INDEX idx_utilisateur_email ON Utilisateur(email);
CREATE INDEX idx_utilisateur_role ON Utilisateur(role);
CREATE INDEX idx_utilisateur_actif ON Utilisateur(actif);

-- Index sur Categorie
CREATE INDEX idx_categorie_actif ON Categorie(actif);
CREATE INDEX idx_categorie_ordre ON Categorie(ordre_affichage);

-- Index sur Plat
CREATE INDEX idx_plat_categorie ON Plat(categorie_id);
CREATE INDEX idx_plat_disponible ON Plat(disponible);
CREATE INDEX idx_plat_nom ON Plat(nom);
CREATE INDEX idx_plat_popularite ON Plat(popularite DESC);

-- Index sur OptionsPlat
CREATE INDEX idx_options_plat ON OptionsPlat(plat_id);
CREATE INDEX idx_options_disponible ON OptionsPlat(disponible);

-- Index sur Commande
CREATE INDEX idx_commande_utilisateur ON Commande(utilisateur_id);
CREATE INDEX idx_commande_statut ON Commande(statut);
CREATE INDEX idx_commande_type ON Commande(type_commande);
CREATE INDEX idx_commande_date ON Commande(createdAt DESC);

-- Index sur DetailsCommande
CREATE INDEX idx_details_commande ON DetailsCommande(commande_id);
CREATE INDEX idx_details_plat ON DetailsCommande(plat_id);

-- Index sur Paiement
CREATE INDEX idx_paiement_commande ON Paiement(commande_id);
CREATE INDEX idx_paiement_statut ON Paiement(statut);
CREATE INDEX idx_paiement_methode ON Paiement(methode);
CREATE INDEX idx_paiement_transaction ON Paiement(transaction_id);

-- Index sur Reservation
CREATE INDEX idx_reservation_utilisateur ON Reservation(utilisateur_id);
CREATE INDEX idx_reservation_date ON Reservation(date_reservation);
CREATE INDEX idx_reservation_statut ON Reservation(statut);
CREATE INDEX idx_reservation_date_heure ON Reservation(date_reservation, heure);

-- ========================================
-- FONCTIONS TRIGGER
-- ========================================

-- Fonction pour mettre à jour automatiquement updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer automatiquement le total d'une commande
CREATE OR REPLACE FUNCTION calculer_total_commande()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Commande
    SET total = (
        SELECT COALESCE(SUM(prix_total), 0)
        FROM DetailsCommande
        WHERE commande_id = NEW.commande_id
    )
    WHERE id = NEW.commande_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le prix_total d'un détail de commande
CREATE OR REPLACE FUNCTION calculer_prix_total_detail()
RETURNS TRIGGER AS $$
BEGIN
    NEW.prix_total = NEW.quantite * NEW.prix_unitaire;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter la popularité d'un plat
CREATE OR REPLACE FUNCTION incrementer_popularite_plat()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Plat
    SET popularite = popularite + NEW.quantite
    WHERE id = NEW.plat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier les disponibilités de réservation
CREATE OR REPLACE FUNCTION verifier_disponibilite_reservation()
RETURNS TRIGGER AS $$
DECLARE
    nombre_reservations INT;
    capacite_max INT := 50; -- Capacité maximale du restaurant
BEGIN
    SELECT COALESCE(SUM(nombre_places), 0)
    INTO nombre_reservations
    FROM Reservation
    WHERE date_reservation = NEW.date_reservation
      AND heure = NEW.heure
      AND statut IN ('en_attente', 'confirmee');
    
    IF nombre_reservations + NEW.nombre_places > capacite_max THEN
        RAISE EXCEPTION 'Capacité maximale atteinte pour cette date et heure';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Triggers pour updatedAt
CREATE TRIGGER trigger_utilisateur_updated_at
    BEFORE UPDATE ON Utilisateur
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_categorie_updated_at
    BEFORE UPDATE ON Categorie
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_plat_updated_at
    BEFORE UPDATE ON Plat
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_commande_updated_at
    BEFORE UPDATE ON Commande
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_paiement_updated_at
    BEFORE UPDATE ON Paiement
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_reservation_updated_at
    BEFORE UPDATE ON Reservation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour calculer prix_total dans DetailsCommande
CREATE TRIGGER trigger_calculer_prix_total
    BEFORE INSERT OR UPDATE ON DetailsCommande
    FOR EACH ROW
    EXECUTE FUNCTION calculer_prix_total_detail();

-- Trigger pour calculer le total de la commande
CREATE TRIGGER trigger_calculer_total_commande
    AFTER INSERT OR UPDATE OR DELETE ON DetailsCommande
    FOR EACH ROW
    EXECUTE FUNCTION calculer_total_commande();

-- Trigger pour incrémenter popularité des plats
CREATE TRIGGER trigger_incrementer_popularite
    AFTER INSERT ON DetailsCommande
    FOR EACH ROW
    EXECUTE FUNCTION incrementer_popularite_plat();

-- Trigger pour vérifier disponibilité réservation
CREATE TRIGGER trigger_verifier_reservation
    BEFORE INSERT OR UPDATE ON Reservation
    FOR EACH ROW
    EXECUTE FUNCTION verifier_disponibilite_reservation();

-- ========================================
-- VUES UTILES
-- ========================================

-- Vue pour les commandes avec détails
CREATE OR REPLACE VIEW vue_commandes_completes AS
SELECT 
    c.id,
    c.statut,
    c.total,
    c.type_commande,
    c.createdAt,
    u.nom || ' ' || u.prenom AS client_nom,
    u.email AS client_email,
    COUNT(dc.id) AS nombre_plats,
    p.statut AS statut_paiement,
    p.methode AS methode_paiement
FROM Commande c
LEFT JOIN Utilisateur u ON c.utilisateur_id = u.id
LEFT JOIN DetailsCommande dc ON c.id = dc.commande_id
LEFT JOIN Paiement p ON c.id = p.commande_id
GROUP BY c.id, u.nom, u.prenom, u.email, p.statut, p.methode;

-- Vue pour les plats populaires
CREATE OR REPLACE VIEW vue_plats_populaires AS
SELECT 
    p.id,
    p.nom,
    p.prix,
    p.popularite,
    c.nom AS categorie,
    p.disponible
FROM Plat p
LEFT JOIN Categorie c ON p.categorie_id = c.id
ORDER BY p.popularite DESC;

-- ========================================
-- COMMENTAIRES SUR LES TABLES
-- ========================================

COMMENT ON TABLE Utilisateur IS 'Table des utilisateurs (clients, employés, admins)';
COMMENT ON TABLE Categorie IS 'Catégories de plats';
COMMENT ON TABLE Plat IS 'Menu des plats disponibles';
COMMENT ON TABLE OptionsPlat IS 'Options supplémentaires pour les plats (ex: sauce extra, fromage)';
COMMENT ON TABLE Commande IS 'Commandes des clients';
COMMENT ON TABLE DetailsCommande IS 'Détails des plats dans chaque commande';
COMMENT ON TABLE Paiement IS 'Paiements effectués pour les commandes';
COMMENT ON TABLE Reservation IS 'Réservations de tables';

-- ========================================
-- FIN DU SCRIPT
-- ========================================