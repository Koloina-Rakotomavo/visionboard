# Visionboard 2026

Ce projet est separe en deux applications:

- `client`: front React + Vite.
- `server`: backend Express pour les uploads, les notes, les films/TMDb et Apple Music.

## Structure

- `client/src/presentation/pages`
  Pages React de l'application.

- `client/src/presentation/components`
  Composants React reutilisables.

- `client/src/presentation/hooks`
  Hooks React qui branchent l'interface aux services.

- `client/src/infrastructure/api`
  Clients HTTP appeles par le front.

- `client/src/infrastructure/external`
  Integrations externes cote navigateur, comme MusicKit.

- `client/src/content`
  Contenu editable du visionboard.

- `client/src/utils`
  Fonctions utilitaires du front.

- `server/src/presentation`
  Entree HTTP, routes et controllers Express.

- `server/src/application`
  Services applicatifs du backend.

- `server/src/config`
  Lecture et validation des variables d'environnement.

- `server/data`
  Bases JSON simples pour les medias, films et notes.

- `server/uploads`
  Fichiers uploades.

## Lancer le front

```bash
cd client
bun install
bun run dev
```

Puis ouvre l'URL locale affichee par Vite.

## Lancer le backend

Dans un autre terminal:

```bash
cd server
bun install
bun run dev
```

Le backend tourne par defaut sur `http://localhost:3001`.
En developpement, le front Vite proxy `/api` et `/uploads` vers ce serveur.

## Variable d'environnement TMDb

Le backend Cinema a besoin d'un token TMDb.

1. Cree un fichier `.env` a la racine du projet.
2. Copie le contenu de `.env.example`.
3. Remplace la valeur par ton vrai token TMDb.
4. Relance le backend.

Exemple:

```bash
cp .env.example .env
```

Puis dans `.env`:

```bash
TMDB_API_TOKEN=ton_vrai_token_tmdb
```

Ensuite:

```bash
cd server
bun run dev
```

Le token doit rester cote serveur et ne pas etre mis dans le front.

## Build front

```bash
cd client
bun run build
```

## Sauvegarde GitHub

Les médias binaires lourds (images et polices du prototype) ne sont pas inclus dans cette sauvegarde source. Ils restent conservés dans l’archive originale `visionboard.zip`. Le code, les données JSON et la structure applicative sont sauvegardés ici.
