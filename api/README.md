# API Job Connect (Express)

Le « back » de Job Connect : API Node.js (Express) avec une base MongoDB, prévue pour être hébergée sur Azure App Service.

## Structure

- `src/server.js` : serveur Express et routes
- `src/models/` : les 6 modèles Mongoose, issus du diagramme de classes
- `src/handlers/` : la logique de chaque route (testable sans serveur)
- `src/db.js` : connexion partagée à la base
- `src/validators.js` : validation des données
- `tests/` : tests automatiques (`node --test`)

## Lancer en local

1. Dans `api/` : `npm install`
2. Copier `.env.example` vers `.env` et remplir `MONGODB_URI` et `JWT_SECRET`
3. `npm run dev`, puis ouvrir http://localhost:3000/api/health

`.env` contient des secrets : il est ignoré par Git, ne jamais le commiter.

## Variables d'environnement

| Variable | Description |
|---|---|
| `MONGODB_URI` | Chaîne de connexion MongoDB |
| `JWT_SECRET` | Secret de signature des tokens de connexion |
| `CORS_ORIGIN` | Adresse(s) du front end autorisées, séparées par des virgules |
| `PORT` | Port d'écoute (3000 par défaut) |

## Routes

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | Vérifie la connexion à la base |
| POST | `/api/auth/register` | Inscription (candidat ou entreprise) |
| POST | `/api/auth/login` | Connexion, retourne un token JWT |

## Tests

`TEST_MONGODB_URI=mongodb://localhost:27017/jobconnect_test npm test`

Sans `TEST_MONGODB_URI`, les tests sont ignorés. La CI GitHub les lance avec un MongoDB temporaire.