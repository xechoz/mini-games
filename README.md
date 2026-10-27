# Mini Games

The landing site for small browser games. Each game lives in its own repository
and publishes a web release asset; this repository only assembles and deploys
them to GitHub Pages.

Live: https://xechoz.github.io/mini-games/

## Repositories

| Repository | Role |
| --- | --- |
| `xechoz/mini-games` | This site: download releases, build `dist-site`, deploy Pages |
| `xechoz/mg-platform` | Shared `@mg/core` / `@mg/platform` and tooling |
| `xechoz/snake` | Fruit Snake: Color Trail |
| `xechoz/ludo` | Ludo |

A game release tag produces `<id>-web.zip`. The site never checks out game
source and never builds game code.

## Development

```bash
npm ci
npm run site              # download release assets from GitHub
npm run site:local        # use ../snake/dist etc.
npm run check
npm run test
```

`site/games.json` lists what to publish:

```json
{
  "games": [
    { "id": "snake", "repo": "xechoz/snake", "version": "v3.1.0", "local": "../snake" }
  ]
}
```

`local` is only used with `SITE_LOCAL=1`; it defaults to `../<id>`.

Local build order:

```bash
cd ../snake && npm run build
cd ../ludo && npm run build
cd ../mini-games && npm run site:local
```

Remote builds require a published release asset at:

```
https://github.com/<repo>/releases/download/<version>/<id>-web.zip
```

Each zip must contain `index.html` and `game.manifest.json` at its root.

## Release a game

1. Tag the game repository, for example `snake v3.2.0`.
2. Confirm the GitHub Release contains `snake-web.zip`.
3. Bump `version` in `site/games.json`.
4. Push `main`; CI rebuilds and deploys Pages.

`ads.txt` is written when `VITE_AD_CHANNEL=h5games` and a real
`VITE_ADSENSE_CLIENT` is configured.

## Rules

- Do not add game code, platform packages or Vite game builds here.
- Do not commit `dist-site/` or `site/.cache/`.
- Runtime output must not make external requests; game ad SDKs are injected by
  the platform build flavor.
