# Déploiement Visionboard — GitHub Pages + Render

## Frontend GitHub Pages

- URL prévue : https://koloina-rakotomavo.github.io/visionboard/
- Dans Settings → Pages → Build and deployment, choisir **GitHub Actions**.
- Le workflow `.github/workflows/pages.yml` construit `client` et publie `client/dist`.
- Déploiement automatique lors des changements du front sur `main`, ou manuel via Actions.
- Le build utilise `--base=/visionboard/` pour charger correctement les assets.
- `VITE_API_URL` pointe vers https://visionboard-api-x1q2.onrender.com.
- La clé TMDb reste uniquement côté Render.

## Backend Render

- Branche : `main`
- Root Directory : `server`
- Build Command : `npm install`
- Start Command : `npm run start`
- Health Check : `/api/health`

Variables Render :
- `TMDB_API_TOKEN` : token TMDb valide.
- `CORS_ORIGIN` : inclure `https://koloina-rakotomavo.github.io` (sans chemin). Plusieurs origines peuvent être séparées par des virgules.
- Variables Apple Music si utilisées.

Le 26 septembre 2026, le health check Render répondait et autorisait l'origine GitHub Pages, mais l'endpoint des sorties renvoyait « TMDb indisponible ». La recherche et les sorties doivent être vérifiées après correction de la connexion TMDb.

Les fichiers `server/data/*.json` du dépôt sont volontairement vides afin de ne pas publier de données personnelles. Les données utilisées par le backend nécessitent un stockage persistant pour survivre aux redéploiements.

## Alternative Vercel

- Root Directory : `client`
- Framework : Vite
- Build Command : `npm run build`
- Output Directory : `dist`
- Variable : `VITE_API_URL` = URL publique Render
- Ajouter l'origine Vercel dans `CORS_ORIGIN` si cette alternative est utilisée.
