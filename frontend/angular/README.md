# Angular — US08 (module entreprise autonome)

L'interface Angular est isolée dans `frontend/angular/` afin de **ne pas remplacer** le frontend statique et son workflow GitHub Pages actuels.

## Exécution

```bash
cd api && npm ci && npm run dev
# dans un deuxième terminal
cd frontend/angular && npm install && npm start
```

Ouvrir `http://localhost:4200`. Configurer `src/app/api.config.ts` si l'API n'est pas sur `http://localhost:8080`.
Configurer `CORS_ORIGIN=http://localhost:4200` dans `api/.env`.

L'utilisateur entreprise peut se connecter via `POST /api/auth/login` pour obtenir le JWT,
puis le coller temporairement dans le champ prévu (pas de stockage persistant dans le navigateur).
Le formulaire charge les catégories par `GET /api/offres/categories` et crée un brouillon via `POST /api/offres`.

**Intégration future** : rattacher le composant au module d'authentification et au routage Angular commun lorsque le frontend de l'équipe sera disponible. Ce projet n'a pas de build CI configuré ; GitHub Pages continue de publier l'ancien `frontend/index.html`.
