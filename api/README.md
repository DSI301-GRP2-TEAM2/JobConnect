# API Job Connect (Azure Functions)

Le « back » de Job Connect : Azure Functions (Node.js, modèle v4) avec une base MongoDB.

## Structure

- `src/models/` : les 6 modèles Mongoose, issus du diagramme de classes
- `src/handlers/` : la logique de chaque route (testable sans Azure)
- `src/functions/` : les routes HTTP
- `src/db.js` : connexion partagée à la base
- `src/validators.js` : validation des données
- `tests/` : tests automatiques (`node --test`)

## Lancer en local

1. Installer Azure Functions Core Tools v4 : `npm install -g azure-functions-core-tools@4`
2. Dans `api/` : `npm install`
3. Copier `local.settings.example.json` vers `local.settings.json` et remplir `MONGODB_URI` et `JWT_SECRET`
4. `func start`, puis ouvrir http://localhost:7071/api/health

`local.settings.json` contient des secrets : il est ignoré par Git, ne jamais le commiter.

## Routes

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | Vérifie la connexion à la base |
| POST | `/api/auth/register` | Inscription (candidat ou entreprise) |
| POST | `/api/auth/login` | Connexion, retourne un token JWT |

## Tests

`TEST_MONGODB_URI=mongodb://localhost:27017/jobconnect_test npm test`

Sans `TEST_MONGODB_URI`, les tests sont ignorés. La CI GitHub les lance avec un MongoDB temporaire.