<p align="center">
  <img src="./frontend/public/images/logo-matinma-2-white.png" alt="Mat-inma Logo" width="160" />
</p>

<h1 align="center">Mat-inma – Gestion de Restaurant</h1>

<p align="center">
  Gérez le menu, les commandes, les paiements et les statistiques de votre restaurant
  avec trois espaces dédiés : <b>Administrateur</b>, <b>Employé</b> et <b>Client</b>.
</p>

<p align="center">
  <a href="#mission-du-projet">Mission du projet</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#installation">Installation</a> •
  <a href="#service-pdf--génération-de-tickets">Service PDF</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?style=for-the-badge" />
  <img src="https://img.shields.io/badge/UI-Chakra%20UI-319795?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
</p>

---

# Mat-inma

## 🎯 Mission du Projet

# Mat-inma

Application de gestion de restaurant avec trois espaces principaux : **Administrateur**, **Employé** (cuisine & caisse) et **Client**.  
Le projet gère le menu, les commandes, les paiements et un premier niveau de statistiques.

Frontend : React + Vite + Chakra UI + Recharts  
Backend : Node.js + Express + PostgreSQL (requêtes SQL directes)

### Aperçu Redis (planifié)

Redis sera ajouté principalement côté backend pour :

- **Cache de lecture** sur le menu, les statistiques et certaines vues lourdes
- **Amélioration des performances** sur les lectures fréquentes sans changer la logique métier
- **Évolutions possibles** : coordination avec le service PDF, blacklist JWT, rate limiting

Les détails techniques d’intégration sont décrits dans le fichier `REDIS-INTEGRATION.md` à la racine du projet.

---

## Rôles et parcours fonctionnels

### 1. Espace Client

- **Menu client** (`/client/menu`)
  - Affichage des plats par catégories, issus de l’espace admin.
  - Ajout de plats au **panier** avec compteur sur l’icône du panier dans le header.
  - Choix du **type de commande** : `Sur place` ou `À emporter`.
  - Pour `Sur place`, saisie du **numéro de table**.

- **Panier & création de commande**
  - Drawer panier : modification des quantités, suppression d’articles.
  - Validation → création de la commande via `POST /api/client/orders`  
    (plats, quantités, type de commande, numéro de table).

- **Commandes client** (`/client/commandes`)
  - Liste des commandes du client avec :
    - Numéro formaté `CMD-DDMMYY-XXXXX`
    - Type (sur place / à emporter)
    - Table
    - Statut
    - Montant total
  - Détails d’une commande dans une modal harmonisée avec cuisine/caisse.

- **Favoris client** (`/client/favoris`)
  - Le client peut marquer des plats en favoris depuis le menu
    (logique backend extensible selon les besoins).

- **Paiements / Additions** (`/client/paiements`)
  - Historique des commandes **prêtes** (`prete`) et **payées** (`servie`), filtrable par :
    `Aujourd’hui`, `Cette semaine`, `Ce mois-ci`, `Tout`.
  - Bouton **Addition** avec **badge compteur** indiquant le nombre de commandes `PRETE`
    dans la période sélectionnée.
  - Drawer **Addition** :
    - Détail d’une seule commande prête (lignes, quantités, montants).
    - Total de l’addition.
    - Bouton **Payer l’addition** : `PUT /api/client/orders/:id/pay`  
      → passage du statut à `servie` (PAYEE).

---

### 2. Espace Employé

- **Cuisine** (`/employe/kitchen`)
  - Tableau des commandes à préparer :
    - Numéro de commande formaté
    - Client
    - Table
    - Statut
    - Total
  - Modal de détail :
    - Numéro, date/heure, type + table
    - Statut (badge)
    - Liste des lignes (quantité + plat)
    - Total
  - Action pour marquer une commande comme livrée/prête  
    (statut mappé côté backend vers `prete`).

- **Caisse** (`/employe/cash`)
  - Tableau des commandes pour la caisse, proche de la vue cuisine.
  - Modal de détail harmonisée (même structure que cuisine + client).
  - La validation de paiement côté caisse a été retirée :
    le paiement se fait désormais **exclusivement côté client** dans `/client/paiements`.

---

### 3. Espace Administrateur

- **Dashboard admin** (`/admin/dashboard`)
  - **Cartes KPI :**
    - **CA du jour** : somme des montants des commandes **payées** (`servie`) du jour.
    - **Commandes du jour** : nombre de commandes créées aujourd’hui,
      et nombre en cours de traitement.
    - **Plats actifs** : nombre de plats visibles sur le menu.
    - **Clients du jour** : estimation basée sur les commandes.

  - **Graphique Revenus** (Recharts – courbe + zone remplie)
    - Basé uniquement sur les **commandes payées**.
    - Périodes disponibles : **Semaine**, **Trimestre**, **Annuel**.
    - Hebdomadaire : 7 jours (labels `lun. 08`, `mar. 09`, …).
    - Trimestriel / Annuel : agrégation mensuelle (labels `janv.`, `févr.`, …).
    - Axes X/Y visibles, fond adapté au thème (clair/sombre),
      tooltips adaptés au mode clair/sombre.

  - **Graphique Résumé des commandes**
    - Même rendu graphique que les revenus (zone + courbe, mêmes cycles).
    - Compte **toutes les commandes créées**, quel que soit le statut.

  - **Commandes récentes**
    - Tableau des dernières commandes : ID, date, client/table, montant, statut.

- **Gestion du menu** (`/admin/menu`)
  - CRUD catégories et plats.
  - Champs : nom, prix, image, disponibilité, etc.
  - Les plats créés alimentent le **menu client**.

- **Gestion des commandes** (`/admin/orders`)
  - Tableau de supervision des commandes (numéro, date, client/table, montant, statut).
  - Vue **en lecture seule** (plus d’actions de changement de statut ici).

- **Gestion des employés** (`/admin/employees`)
  - Liste, création et activation/désactivation des comptes employés.

---

## Flux de commande & paiement

1. **Admin** crée/active des plats dans l’espace menu.
2. **Client** commande des plats depuis le menu, via le panier
   (sur place ou à emporter, avec numéro de table si sur place).
3. La commande apparaît côté **cuisine** et **caisse**.
4. **Employé cuisine** prépare et marque la commande comme `prete`.
5. La commande `PRETE` apparaît dans l’historique des **paiements client**.
6. **Client** ouvre son addition, paie → commande passe à `servie`.
7. Le **Dashboard admin** est mis à jour :
   - CA du jour + graphique **Revenus** tiennent compte de cette commande payée.
   - Graphique **Résumé des commandes** reflète le volume de commandes créées.

---

## Statuts de commande

- `en_attente` : commande créée, en attente de préparation.
- `prete` : commande prête / servie, en attente de paiement.
- `servie` : commande payée (affichée comme **PAYEE** côté client).
- `annulee` : commande annulée.

---

## Pistes d’évolution

Quelques idées de suites possibles :

- **Module de réservations**
  - Prise de réservation côté client.
  - Vue planning côté admin / employé (par créneau horaire, nombre de couverts, etc.).

- **Statistiques avancées**
  - Top plats les plus vendus, répartition par type (`sur place` / `à emporter`).
  - Analyse par plage horaire (midi / soir), par jour de semaine.
  - Export CSV ou PDF des ventes et des statistiques.

- **Programme de fidélité simple**
  - Compteur de commandes par client.
  - Paliers (ex. 10 commandes = boisson offerte, réduction, etc.).

- **Interface temps réel**
  - Rafraîchissement automatique des vues cuisine / caisse / admin
    via WebSockets ou polling pour voir les nouvelles commandes/statuts sans recharger.

- **Expérience client enrichie**
  - Historique détaillé des commandes & paiements côté client avec filtres.
  - Recommandations basées sur les plats favoris ou les commandes récentes.
  - Avis sur les plats (notes + commentaires) visibles par l’admin.
.

---

## Service PDF – Génération de tickets

Le projet contient un microservice Python dédié à la génération de tickets PDF à partir d’un template HTML, dans le dossier `pdf-service`.

### Stack technique

- Python 3.11
- FastAPI
- Jinja2 (templates HTML)
- WeasyPrint (HTML → PDF)
- qrcode[pil] (génération de QR Code)
- Docker (image basée sur `python:3.11-slim` + libs système WeasyPrint)

### Architecture

- `pdf-service/app.py`  
  Service FastAPI exposant l’endpoint `POST /generate-ticket`. Il :
  - reçoit un JSON de ticket (envoyé par le backend Node),
  - normalise les données (date/heure, type de commande, moyen de paiement…),
  - rend le template `templates/ticket.html` avec Jinja2,
  - génère le PDF avec WeasyPrint,
  - renvoie le PDF en réponse (`application/pdf`).

- `pdf-service/templates/ticket.html`  
  Template du ticket thermique (80mm) :
  - 3 colonnes pour chaque ligne : **nom**, **prix unitaire × quantité**, **total ligne**, 
  - informations commande (numéro, date, heure),
  - type de commande (`Sur place` / `À emporter`), n° de table,
  - n° de ticket (`TCKT-xxxxxx-YYMMDD`),
  - QR Code en bas du ticket (image PNG en base64).

- `pdf-service/Dockerfile`  
  Image Docker autonome avec :
  - installation des dépendances système WeasyPrint,
  - installation des dépendances Python via `requirements.txt`,
  - lancement d’Uvicorn sur le port `8000`.

### Endpoint principal

`POST /generate-ticket`

- **URL (par défaut)** : `http://localhost:8000/generate-ticket`
- **Corps JSON** (schéma simplifié) :

```json
{
  "ticket_number": "TCKT-123456-251217",
  "commande_id": 42,
  "commande_numero": "CMD-171225-14457",
  "created_at": "2025-12-17T23:34:17.000Z",
  "type_commande": "sur_place",
  "numero_table": 7,
  "total": 2700,
  "paiement": {
    "methode": "espece",
    "statut": "valide"
  },
  "lignes": [
    {
      "quantite": 2,
      "nomPlat": "Pilawo au viande",
      "prixUnitaire": 1250,
      "totalLigne": 2500
    }
  ]
}
```

- **Réponse** : flux binaire `application/pdf` contenant le ticket.

Les valeurs suivantes sont normalisées côté service avant affichage :

- `paiement.methode` → `Espèces`, `Holo`, `Mvula`, etc.
- `type_commande` → `Sur place` / `À emporter`
- `numero_table` masqué (`-`) pour les commandes à emporter.

### Commandes Docker

Depuis le dossier `pdf-service` :

```bash
cd pdf-service

# Build de l'image
docker build -t matinma-pdf-service .

# Lancement du conteneur
docker run -p 8000:8000 --name matinma-pdf-container matinma-pdf-service

# Démarrer le conteneur
docker start matinma-pdf-container
```

En cas de modification de `app.py` ou `templates/ticket.html` :

```bash
cd pdf-service

docker stop matinma-pdf-container
docker rm matinma-pdf-container
docker build --no-cache -t matinma-pdf-service .
docker run -p 8000:8000 --name matinma-pdf-container matinma-pdf-service
```

### Intégration avec le backend Node

Le backend Node (Express) n’a plus de génération PDF interne : il construit un `ticketJson`, puis appelle le service Python.

- Fonction utilisée : `generateTicketPdfViaService(ticketJson, outputDir)`
- URL du service paramétrable via la variable d’environnement `PDF_SERVICE_URL`  
  (sinon `http://localhost:8000/generate-ticket` par défaut).
- À la fin du paiement (`PUT /orders/:id/pay`), le backend :
  - génère le PDF via le service Python,
  - enregistre le fichier dans `backend/tickets`,
  - le met à disposition pour téléchargement via `/client/orders/:id/ticket.pdf`.

