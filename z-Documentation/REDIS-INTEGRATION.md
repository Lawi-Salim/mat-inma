# Intégration de Redis dans Mat-inma

## 1. Objectifs de Redis

Redis ne remplace pas PostgreSQL dans Mat-inma, il vient en complément pour :

- **Cache de lecture**
  - Menu (plats, catégories, disponibilités)
  - Statistiques et tableaux de bord admin
- **Coordination avec des services externes**
  - File d’attente / cache pour la génération de tickets PDF (service FastAPI)
- **Évolutions possibles**
  - Blacklist / gestion de tokens JWT
  - Rate limiting (limitation de requêtes)

L’objectif principal : **soulager PostgreSQL** et gagner en **rapidité** sur les lectures fréquentes, sans casser l’architecture existante.

---

## 2. Architecture actuelle (rappel)

- **Frontend** : React + Vite + Chakra UI
- **Backend** : Node.js + Express + Sequelize + PostgreSQL
- **Service PDF** : FastAPI (Python) pour la génération de tickets à partir d’un JSON

Redis va s’insérer principalement :

- entre **Backend** et **PostgreSQL** pour le cache de lecture,
- éventuellement entre **Backend** et **pdf-service** pour de la file de tâches ou du cache de tickets.

---

## 3. Préparation de l’environnement Redis

### 3.1. Installation

Installer Redis sur la machine / serveur (ou via Docker, ou un service managé) :

- Exemple Docker :

```bash
docker run -d --name matinma-redis -p 6379:6379 redis:7-alpine
```

### 3.2. Variables d’environnement

Dans le dossier `backend` (fichier `.env`) :

```env
REDIS_HOST=localhost
REDIS_PORT=6379
# ou
# REDIS_URL=redis://localhost:6379
```

Plus tard, ces mêmes valeurs pourront être utilisées dans le `pdf-service` si nécessaire.

---

## 4. Intégration Redis côté backend (Node.js)

Le backend est la **pièce centrale** de Mat-inma. C’est ici que Redis sera d’abord intégré.

### 4.1. Dépendance Redis

Dans le dossier `backend` :

- Installer un client Redis, par exemple :
  - `redis` (client officiel) **ou**
  - `ioredis`

*(La commande exacte dépendra de l’outil utilisé : `yarn add redis` ou `npm install redis`, etc.)*

### 4.2. Module de connexion Redis

Créer un fichier `backend/config/redis.js` qui :

- lit les variables d’environnement (`REDIS_HOST` / `REDIS_PORT` ou `REDIS_URL`),
- initialise un client Redis,
- loggue les événements importants (`connect`, `error`),
- exporte ce client pour être utilisé dans les routes / services.

Bonne pratique :

- importer ce module **une seule fois** (ex. dans `server.js`) pour établir la connexion au démarrage,
- en cas d’erreur Redis, **ne pas arrêter** le serveur Express :
  - si Redis est indisponible, le backend doit continuer à fonctionner avec PostgreSQL uniquement.

### 4.3. Premier cas concret : cache du menu

Objectif : éviter de recharger en permanence les plats + catégories depuis PostgreSQL.

1. Dans la route de menu (ex. `routes/menu.js`) :
   - Définir une clé de cache, par exemple : `menu:full`.
   - Avant l’appel à Sequelize/PostgreSQL :
     - faire un `GET menu:full` dans Redis,
     - si une valeur existe :
       - la parser (JSON) et renvoyer directement la réponse.

2. Si aucune valeur n’est trouvée :
   - exécuter la requête SQL/Sequelize comme actuellement,
   - renvoyer les données au client,
   - **en parallèle**, stocker les données dans Redis :
     - `SET menu:full <json>` avec une durée de vie (TTL), par ex. 60–300 secondes.

3. Résultat :
   - Les premiers appels peuplent le cache,
   - les appels suivants lisent en mémoire (Redis) au lieu de PostgreSQL.

### 4.4. Invalidation du cache

Pour garder les données à jour :

- Lors d’un `CREATE`, `UPDATE` ou `DELETE` sur un plat ou une catégorie :
  - supprimer les clés de cache concernées (`DEL menu:full`, `DEL plats:populaires`, etc.),
  - la prochaine requête reconstruira le cache à partir de PostgreSQL.

On peut commencer **sans invalidation** (simple TTL), puis affiner avec des `DEL` ciblés.

---

## 5. Intégration possible avec le service PDF (FastAPI)

À moyen terme, Redis peut améliorer la communication entre le backend Node et le `pdf-service` :

### 5.1. File d’attente de génération de tickets (asynchrone)

Principe :

- Au lieu d’appeler directement `POST /generate-ticket` :
  - le backend pousse un job dans une file Redis (`LPUSH queue:tickets <payload_json>`),
  - un worker Python (service FastAPI ou script dédié) lit cette file (`BRPOP queue:tickets`),
  - génère le PDF et stocke le résultat (fichier, objet, URL),
  - enregistre l’état dans Redis (`SET ticket:<id> ... EX 3600`).

- Le frontend obtient un `ticket_job_id` du backend et peut :
  - soit récupérer directement une URL de téléchargement,
  - soit interroger périodiquement (`/api/ticket/:id/status`) pour savoir si le PDF est prêt.

### 5.2. Cache des tickets récents

Autre approche plus simple :

- Lors de la première génération d’un ticket, le backend :
  - demande le PDF au `pdf-service`,
  - le stocke (disque ou autre),
  - garde une référence en cache dans Redis (`SET ticket_pdf:<commande_id> ... EX 600`).

- Si un utilisateur redemande le même ticket rapidement :
  - le backend consulte d’abord Redis,
  - si trouvé, renvoie directement le ticket / l’URL sans regénérer.

Ces scénarios sont optionnels et peuvent être mis en place **après** le cache de menu.

---

## 6. Évolutions futures : auth et sécurité

Redis peut aussi servir pour :

### 6.1. Blacklist JWT

- Lorsqu’un utilisateur se déconnecte ou qu’un token doit être révoqué :
  - stocker l’identifiant du token (`jti`) ou le token lui-même dans Redis avec un TTL égal à sa durée de vie restante.
- Dans le middleware d’authentification du backend :
  - vérifier à chaque requête si le token figure dans cette liste noire,
  - refuser la requête si oui.

### 6.2. Rate limiting

- Compter le nombre de requêtes par IP / utilisateur sur une fenêtre temporelle,
- Bloquer ou ralentir en cas d’abus (protection basique DDoS / brute force).

---

## 7. Bonnes pratiques

- **Tolérance aux pannes** :
  - Toujours prévoir un fonctionnement correct **sans Redis** (fallback sur PostgreSQL et sur la logique actuelle).
- **TTL raisonnables** :
  - Adapter la durée de vie selon le type de données (menu quelques minutes, stats plus courtes ou plus longues, etc.).
- **Clés explicites** :
  - Préfixer les clés (`menu:*`, `stats:*`, `ticket:*`, `jwt:blacklist:*`) pour garder un namespace clair.
- **Observabilité** :
  - Ajouter des logs au démarrage et lors des erreurs Redis pour faciliter le debug.

Ce document décrit la vision et les grandes étapes. L’implémentation concrète (création du client Redis, modification des routes, etc.) se fait ensuite progressivement, en commençant par une ou deux routes de lecture critiques (par exemple `/api/menu`).
