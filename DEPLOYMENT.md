# Déploiement Visionboard — Vercel + Render

## Backend Render
- Branche : `main`
- Root Directory : `server`
- Build Command : `npm install`
- Start Command : `npm run start`
- Health Check : `/api/health`

Variables Render :
- `TMDB_API_TOKEN`
- `CORS_ORIGIN` = URL Vercel finale
- variables Apple Music si utilisées

## Frontend Vercel
- Root Directory : `client`
- Framework : Vite
- Build Command : `npm run build`
- Output Directory : `dist`
- Variable : `VITE_API_URL` = URL publique Render

Les fichiers `server/data/*.json` présents dans le dépôt sont volontairement vides afin de ne pas publier de données personnelles.
