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

Variables Render (secrets, jamais dans GitHub) :
- `TMDB_API_KEY` : clé API TMDb v3 (la valeur que tu viens de fournir), ou `TMDB_API_TOKEN` pour un token v4.
- Si ta clé v3 est déjà enregistrée sous `TMDB_API_TOKEN`, le serveur la détecte aussi automatiquement.
- Ne définis idéalement qu'une des deux variables. Le serveur utilise la clé/token uniquement côté Render.
- `CORS_ORIGIN` : inclure `https://koloina-rakotomavo.github.io` (sans chemin). Plusieurs origines peuvent être séparées par des virgules.
- Variables Apple Music si utilisées.

Le 26 septembre 2026, le health check Render répondait et autorisait l'origine GitHub Pages, mais l'endpoint des sorties renvoyait « TMDb indisponible ». La recherche et les sorties doivent être vérifiées après correction de la connexion TMDb.

Les fichiers `server/data/*.json` du dépôt sont volontairement vides afin de ne pas publier de données personnelles.

## PostgreSQL et Letterboxd

Le backend utilise PostgreSQL lorsqu'une variable `DATABASE_URL` est définie. Au premier démarrage, il crée la table `visionboard_records` et migre les éventuels fichiers JSON présents sur l'instance. Les films, notes, boards, événements, médias, avis Letterboxd et commentaires Letterboxd sont ensuite conservés dans PostgreSQL.

Dans Render, ajoute la variable secrète `DATABASE_URL` avec l'URL de ta base PostgreSQL, puis redéploie le service. L'import Letterboxd se fait ensuite depuis la rubrique Letterboxd intégrée à la page Cinéma. Les données personnelles ne doivent jamais être ajoutées à GitHub.

## Alternative Vercel

- Root Directory : `client`
- Framework : Vite
- Build Command : `npm run build`
- Output Directory : `dist`
- Variable : `VITE_API_URL` = URL publique Render
- Ajouter l'origine Vercel dans `CORS_ORIGIN` si cette alternative est utilisée.
