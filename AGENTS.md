# Mini Games Site — Agent Instructions

This repository is the **site aggregator only**. It downloads published game
release assets, verifies them, generates the landing page and deploys GitHub
Pages at `https://xechoz.github.io/mini-games/`.

## Do not

- Add game code, `@mg/core`, `@mg/platform` or game build tooling here.
- Check out game repositories during the site build.
- Build games from source in CI.
- Edit `dist-site/` by hand or commit it.
- Modify global OpenCode configuration.

## Build flow

1. Read `site/games.json` (`id`, `repo`, `version`, optional `local`).
2. Remote mode: download
   `https://github.com/<repo>/releases/download/<version>/<id>-web.zip` into
   `site/.cache/`, unzip to `dist-site/games/<id>/`.
3. Local mode (`SITE_LOCAL=1`): copy `../<id>/dist`, default `local` path.
4. Require `index.html` and `game.manifest.json`; the manifest `id` must match.
5. Generate `dist-site/index.html`, `dist-site/games.json`, optional `ads.txt`.

## Adding a game

1. Publish `<id>-web.zip` as a GitHub Release asset.
2. Add an entry to `site/games.json`.
3. Run `npm run check && npm run test && npm run site`.
4. Commit and push; Pages deploys automatically.

## Local commands

```bash
npm ci
npm run check
npm run test
npm run site:local
npm run site
```

Building the snake locally:

```bash
cd ../snake && npm run build
cd ../mini-games && npm run site:local
```

Do not commit or push without an explicit request.
