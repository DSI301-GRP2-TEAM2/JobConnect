# Livrables de Préparation du Sprint 1 — Projet JobConnect
**Groupe :** DSI301 Grp 2 — Team 2  
**Date :** Week-end de cadrage avant lancement du Sprint 1  
**Périmètre spécifique développé :** US-13 à US-18 (Refus d'offre, Catalogue des offres, Consultation d'offre, Profil Candidat, Téléversement de CV, Soumission de candidature)

---

## 1. Backlog & User Stories (Semaine 1 / Sprint 1)

### 1.1 Périmètre global du Sprint 1
L'objectif du premier sprint est de livrer le parcours utilisateur complet de bout en bout :
- Inscription et authentification par rôle (Candidat, Entreprise, Agent).
- Publication et modération des offres d'emploi (création, soumission, approbation, refus).
- Consultation des offres, enrichissement du profil candidat et téléversement de CV.
- Soumission de candidatures et suivi de leur statut.

Le sprint regroupe **22 User Stories prioritaires** (priorité Haute) pour un total de **63 Story Points (SP)** :
- **US-01 à US-12** (33 SP) : Authentification, gestion des catégories, cycle de création d'offres et validation par l'Agent.
- **US-13 à US-18** (20 SP) : Refus d'offre par l'Agent, consultation du catalogue, consultation du détail d'offre, gestion du profil candidat, téléversement de CV et soumission de candidature. *(Périmètre implémenté et testé)*
- **US-19 à US-22** (10 SP) : Consultation et traitement des candidatures reçues par l'Entreprise, et suivi des candidatures par le Candidat.

---

### 1.2 Fiches Détaillées des User Stories (US-13 à US-18)

#### US-13 : Refuser une offre d'emploi non conforme
- **En tant qu'** : Agent
- **Je veux** : Refuser une offre d'emploi rédigée par une entreprise
- **Afin d'** : Empêcher la diffusion d'une publication non conforme aux règles de la plateforme.
- **Priorité** : Haute | **Estimation** : 2 SP
- **Critères d'acceptation** :
  1. L'Agent authentifié accède aux offres ayant le statut `en_attente`.
  2. L'Agent clique sur « Refuser l'offre » ; son statut passe immédiatement à `rejetee`.
  3. Une offre déjà refusée ou publiée ne peut pas être refusée à nouveau (erreur 400).
  4. L'offre rejetée est immédiatement exclue du catalogue public visible par les candidats.
- **Tâches techniques** :
  - `[API]` Créer le contrôleur `rejectOffreHandler` dans `src/handlers/rejectOffre.js`.
  - `[API]` Exposer la route `PATCH /api/offres/:id/reject`.
  - `[API]` Sécuriser via le middleware JWT `authMiddleware` et `requireRole("agent")`.
  - `[API]` Valider l'identifiant MongoDB et l'état actuel de l'offre.
  - `[Front]` Ajouter le bouton d'action « Refuser l'offre » sur chaque carte d'offre en attente de l'espace modération Agent.
  - `[Test]` Écrire les tests unitaires et de sécurité (token manquant -> 401, rôle non autorisé -> 403, refus réussi -> 200).
- **Accès nécessaire** : Token JWT valide avec le rôle `agent`.
- **Maquette associée** : Écran modération d'offres (`docs/mockInterfaces/Sprint 1 - mock interfaces.bmpr`).

---

#### US-14 : Consulter la liste des offres publiées
- **En tant que** : Candidat
- **Je veux** : Consulter la liste des offres d'emploi publiées
- **Afin de** : Découvrir l'ensemble des postes actuellement ouverts.
- **Priorité** : Haute | **Estimation** : 3 SP
- **Critères d'acceptation** :
  1. Seules les offres au statut `publiee` sont retournées dans la liste.
  2. Les offres en attente ou rejetées sont rigoureusement exclues.
  3. Chaque offre affiche son titre, le nom de l'entreprise, sa catégorie et son niveau de rémunération.
  4. En cas d'absence d'offre publiée, une liste vide `[]` est gérée proprement.
- **Tâches techniques** :
  - `[API]` Créer le contrôleur `getOffresPublieesHandler` dans `src/handlers/getOffres.js`.
  - `[API]` Exposer la route `GET /api/offres`.
  - `[API]` Sécuriser via `authMiddleware` et `requireRole("candidat")`.
  - `[API]` Filtrer `{ statut: "publiee" }` et joindre les informations de la catégorie (`populate`).
  - `[Front]` Développer la vue responsive catalogue sous forme de cartes d'offres.
  - `[Test]` Vérifier l'exclusion des offres en attente/rejetées et la protection de la route.
- **Accès nécessaire** : Token JWT valide avec le rôle `candidat`.
- **Maquette associée** : Vue catalogue des offres (`docs/mockInterfaces/Sprint 1 - mock interfaces.bmpr`).

---

#### US-15 : Consulter le détail d'une offre d'emploi
- **En tant que** : Candidat
- **Je veux** : Consulter le détail complet d'une offre d'emploi sélectionnée
- **Afin de** : Connaître les missions, les conditions, le salaire et l'entreprise avant de postuler.
- **Priorité** : Haute | **Estimation** : 2 SP
- **Critères d'acceptation** :
  1. L'offre demandée doit exister et posséder le statut `publiee`.
  2. Si l'offre n'existe pas ou n'est pas encore validée/publiée, un code 404 est retourné.
  3. L'affichage complet présente : titre, description détaillée, salaire, nom de l'entreprise, date et catégorie.
- **Tâches techniques** :
  - `[API]` Créer le contrôleur `getOffreByIdHandler` dans `src/handlers/getOffres.js`.
  - `[API]` Exposer la route `GET /api/offres/:id`.
  - `[API]` Sécuriser via `authMiddleware` et `requireRole("candidat")`.
  - `[API]` Contrôler le format de l'identifiant et renvoyer 404 si l'offre n'est pas publiée.
  - `[Front]` Créer la fenêtre modale de détail d'offre avec bouton d'action « Postuler ».
  - `[Test]` Valider le retour 200 sur offre publiée et 404 sur offre non publiée.
- **Accès nécessaire** : Token JWT valide avec le rôle `candidat`.
- **Maquette associée** : Fiche détail offre (`docs/mockInterfaces/Sprint 1 - mock interfaces.bmpr`).

---

#### US-16 : Compléter mon profil candidat
- **En tant que** : Candidat
- **Je veux** : Compléter et mettre à jour mes informations personnelles
- **Afin de** : Valoriser mon profil auprès des recruteurs lors de mes candidatures.
- **Priorité** : Haute | **Estimation** : 3 SP
- **Critères d'acceptation** :
  1. Le candidat connecté peut mettre à jour son nom, prénom, téléphone et adresse.
  2. Les champs obligatoires ne peuvent pas être vides.
  3. Le numéro de téléphone est validé par expression régulière (8 à 15 chiffres).
  4. Les données mises à jour sont persistées dans la collection `users` de MongoDB.
- **Tâches techniques** :
  - `[API]` Créer la fonction de validation `validateUpdateProfil` dans `src/validators.js`.
  - `[API]` Créer le contrôleur `updateProfilCandidatHandler` dans `src/handlers/profilCandidat.js`.
  - `[API]` Exposer `PUT /api/candidats/me` et `GET /api/candidats/me`.
  - `[API]` Sécuriser via `authMiddleware` et `requireRole("candidat")`.
  - `[Front]` Créer le formulaire de profil avec validation temps réel et pré-remplissage.
  - `[Test]` Tester la validation des champs (téléphone invalide -> 400, succès -> 200).
- **Accès nécessaire** : Token JWT valide avec le rôle `candidat`.
- **Maquette associée** : Formulaire profil candidat (`docs/mockInterfaces/Sprint 1 - mock interfaces.bmpr`).

---

#### US-17 : Téléverser mon CV (PDF/DOCX)
- **En tant que** : Candidat
- **Je veux** : Téléverser mon curriculum vitae au format PDF ou DOCX
- **Afin de** : L'associer à mon profil et le transmettre aux recruteurs.
- **Priorité** : Haute | **Estimation** : 5 SP
- **Critères d'acceptation** :
  1. Seuls les formats PDF et DOCX/DOC sont acceptés (contrôle extension et MIME type).
  2. Tout format non autorisé (.exe, .txt, .zip, etc.) est immédiatement rejeté avec une erreur explicite.
  3. La taille maximale du fichier est plafonnée à 5 Mo.
  4. Le fichier est stocké sur le serveur et son chemin est sauvegardé dans le champ `cv` du modèle candidat.
- **Tâches techniques** :
  - `[API]` Installer et configurer le middleware `multer` dans `src/handlers/uploadCv.js`.
  - `[API]` Créer `validateCvFile` pour vérifier le format et la taille.
  - `[API]` Exposer la route `POST /api/candidats/me/cv`.
  - `[API]` Supporter le téléversement direct (`multipart/form-data`) et en JSON base64.
  - `[Front]` Développer la zone de glisser-déposer (Drag & Drop) avec indicateur du CV actif.
  - `[Test]` Valider le refus des mauvais formats (.exe -> 400) et l'acceptation de fichiers conformes.
- **Accès nécessaire** : Token JWT valide avec le rôle `candidat` + stockage de fichiers.
- **Maquette associée** : Bloc de téléversement CV (`docs/mockInterfaces/Sprint 1 - mock interfaces.bmpr`).

---

#### US-18 : Soumettre une candidature à une offre d'emploi
- **En tant que** : Candidat
- **Je veux** : Soumettre ma candidature avec ma lettre de motivation et mon CV
- **Afin de** : Postuler officiellement à un poste disponible.
- **Priorité** : Haute | **Estimation** : 5 SP
- **Critères d'acceptation** :
  1. Le candidat peut joindre une lettre de motivation personnalisée.
  2. Le système vérifie obligatoirement que l'offre ciblée existe et est au statut `publiee`.
  3. Le CV actuel du candidat est rattaché à la candidature.
  4. Un candidat ne peut **jamais** postuler deux fois à la même offre (index unique d'intégrité). Une tentative en double retourne une erreur 409 (Conflict).
  5. La candidature est enregistrée avec le statut initial `en_attente`.
- **Tâches techniques** :
  - `[API]` Vérifier l'index unique `{ candidat: 1, offre: 1 }` sur le modèle `Candidature`.
  - `[API]` Créer le contrôleur `createCandidatureHandler` dans `src/handlers/candidatures.js`.
  - `[API]` Exposer `POST /api/candidatures`.
  - `[API]` Sécuriser via `authMiddleware` et `requireRole("candidat")`.
  - `[API]` Gérer le code d'erreur `11000` (doublon MongoDB) pour renvoyer 409.
  - `[Front]` Intégrer le formulaire de postulation dans la modale d'offre.
  - `[Test]` Valider la création (201), le refus d'offre non publiée (400), et le refus de doublon (409).
- **Accès nécessaire** : Token JWT valide avec le rôle `candidat`.
- **Maquette associée** : Modale de candidature (`docs/mockInterfaces/Sprint 1 - mock interfaces.bmpr`).

---

## 2. Modélisation de la Base de Données

La modélisation a été conçue sous MongoDB / Mongoose en conformité stricte avec le diagramme de classes du projet (`docs/class_diag.webp`) :

### 2.1 Les 6 Modèles Mongoose (`api/src/models/`)
1. **User (`users`)** :
   - Modèle unifié stockant Candidats, Entreprises et Agents.
   - Attributs communs : `nom`, `email` (unique, lowercase), `mdp` (haché bcrypt, `select: false`), `role` (`candidat`, `entreprise`, `agent`), `statut` (`actif`, `bloque`), `dateInscription`.
   - Attributs spécifiques Candidat : `prenom`, `telephone`, `adresse`, `cv` (chemin du fichier).
   - Attributs spécifiques Entreprise : `nomEntreprise`, `secteur`, `siteWeb`.
   - Attributs spécifiques Agent : `matricule`.
2. **Offer (`offres`)** :
   - `titre`, `description`, `salaire`, `dateCreation`.
   - `statut` : enum `['en_attente', 'publiee', 'rejetee']` (valeur par défaut : `en_attente`).
   - `entreprise` : objet embarqué contenant `{ id: ObjectId ref User, nomEntreprise: String }`.
   - `categorie` : `ObjectId` référençant `Category`.
3. **Category (`categories`)** :
   - `libelle` (unique, trim), `description`.
4. **Candidature (`candidatures`)** :
   - `candidat` : `ObjectId` ref `User`.
   - `offre` : `ObjectId` ref `Offer`.
   - `lettreMotivation`, `cvFichier`.
   - `statut` : enum `['en_attente', 'acceptee', 'refusee']`.
   - **Index d'intégrité métier** : `candidatureSchema.index({ candidat: 1, offre: 1 }, { unique: true })`.
5. **Commentaire (`commentaires`)** :
   - Question posée par un candidat sous une offre, avec tableau de `reponses` de l'entreprise.
6. **Signalement (`signalements`)** :
   - Signalement de modération lié à un commentaire et traité par un agent.

---

## 3. Environnement d'Exécution et de Déploiement

### 3.1 Architecture Technique
- **Serveur Backend** : Node.js (v20+ / v22 LTS), Express.js.
- **Base de Données** : MongoDB Atlas (cloud) en production, conteneur Docker `mongo:7` dans les GitHub Actions.
- **Hébergement API** : Azure App Service (`jobconnect-team2-api`).
- **Hébergement Frontend** : GitHub Pages (`https://dsi301-grp2-team2.github.io/JobConnect`).

### 3.2 Variables d'environnement requises (`.env`)
| Variable | Description |
|---|---|
| `MONGODB_URI` | Chaîne de connexion MongoDB Atlas avec authentification |
| `JWT_SECRET` | Chaîne aléatoire de signature des tokens JSON Web Token |
| `CORS_ORIGIN` | URL du front autorisée (ex. GitHub Pages ou `*` en dev) |
| `PORT` | Port d'écoute Express (défaut : 8080 ou 3000) |

### 3.3 Endpoint de santé & Tests de validation
- `GET /api/health` : Renvoie `{ "status": "ok" }` permettant à Azure et au système de monitoring de valider la bonne santé de l'instance.
- **Suite de tests automatisée** : 39 tests unitaires et d'intégration validés via `npm test`.

---

## 4. Configuration GitHub & Intégration Continue (CI/CD)

### 4.1 Structure du Répertoire
```
JobConnect/
├── .github/
│   └── workflows/
│       ├── api-ci.yml        # Pipeline CI/CD API (Tests + Déploiement Azure)
│       └── pages.yml         # Pipeline Déploiement Frontend sur GitHub Pages
├── api/
│   ├── src/
│   │   ├── db.js             # Connexion mongoose
│   │   ├── server.js         # Routes et configuration Express
│   │   ├── validators.js     # Validateurs des requêtes et fichiers
│   │   ├── middleware/       # Middleware JWT et vérification des rôles
│   │   ├── handlers/         # Contrôleurs métier (US1 à US18)
│   │   └── models/           # Les 6 schémas Mongoose
│   ├── tests/                # Tests unitaires et d'intégration
│   ├── uploads/              # Stockage sécurisé des CV téléversés
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html            # Interface dynamique monopage
│   ├── style.css             # Feuille de styles responsive
│   └── app.js                # Logique client, requêtes API, gestion JWT
└── docs/                     # Diagrammes, maquettes, backlog et spécifications
```

### 4.2 Pipeline CI/CD API (`.github/workflows/api-ci.yml`)
- Se déclenche automatiquement à chaque `push` ou `pull_request` impactant le dossier `api/`.
- Démarre un conteneur de service `mongo:7` sur le port 27017.
- Installe les dépendances avec `npm ci`.
- Valide la syntaxe de l'ensemble des fichiers JS avec `node --check`.
- Exécute l'intégralité des tests unitaires et tests de base de données avec `npm test`.
- Déploie automatiquement sur **Azure App Service** (`jobconnect-team2-api`) dès que la branche `main` est mise à jour.

### 4.3 Déploiement Frontend GitHub Pages (`.github/workflows/pages.yml`)
- Se déclenche à chaque `push` sur `frontend/**`.
- Emballe et publie les fichiers HTML/CSS/JS directement sur l'environnement GitHub Pages de l'équipe.
