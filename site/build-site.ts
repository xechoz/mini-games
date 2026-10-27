import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { adsTxtLine, normalizeAdsenseClient } from './adsense.ts'

interface GameConfig {
  id: string
  repo: string
  version: string
  /** Path to a local game checkout, used when SITE_LOCAL=1. */
  local?: string
}

interface SiteConfig {
  games: GameConfig[]
}

interface Manifest {
  id: string
  order?: number
  title: Record<string, string>
  description: Record<string, string>
  themeColor?: string
  tags?: string[]
}

const siteDir = import.meta.dirname
const root = resolve(siteDir, '..')
const outDir = join(root, 'dist-site')
const outGamesDir = join(outDir, 'games')
const cacheDir = join(siteDir, '.cache')
const localMode = process.env.SITE_LOCAL === '1'

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outGamesDir, { recursive: true })
mkdirSync(cacheDir, { recursive: true })

const config = JSON.parse(readFileSync(join(siteDir, 'games.json'), 'utf8')) as SiteConfig
const manifests: Manifest[] = []

for (const game of config.games) {
  const target = join(outGamesDir, game.id)

  if (localMode) {
    const gameRoot = resolve(root, game.local ?? join('..', game.id))
    const dist = join(gameRoot, 'dist')
    if (!existsSync(join(dist, 'index.html'))) {
      throw new Error(
        `[site] ${game.id}: ${dist}/index.html not found; run npm run build there first`,
      )
    }
    cpSync(dist, target, { recursive: true })
    const localManifest = join(gameRoot, 'game.manifest.json')
    if (!existsSync(join(target, 'game.manifest.json')) && existsSync(localManifest)) {
      cpSync(localManifest, join(target, 'game.manifest.json'))
    }
    const thumb = join(gameRoot, 'thumb.png')
    if (existsSync(thumb)) cpSync(thumb, join(target, 'thumb.png'))
  } else {
    const zip = join(cacheDir, `${game.id}-web.zip`)
    const url = `https://github.com/${game.repo}/releases/download/${game.version}/${game.id}-web.zip`
    console.log(`[site] downloading ${url}`)
    await download(url, zip)
    rmSync(target, { recursive: true, force: true })
    mkdirSync(target, { recursive: true })
    execFileSync('unzip', ['-q', '-o', zip, '-d', target], { stdio: 'inherit' })
  }

  if (!existsSync(join(target, 'index.html'))) {
    throw new Error(`[site] ${game.id}: release asset has no index.html`)
  }

  const manifestPath = join(target, 'game.manifest.json')
  if (!existsSync(manifestPath)) {
    throw new Error(`[site] ${game.id}: game.manifest.json missing from build`)
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest
  if (manifest.id !== game.id) {
    throw new Error(`[site] ${game.id}: manifest id is ${manifest.id}`)
  }
  manifests.push(manifest)
  console.log(`[site] ready ${game.id} ${localMode ? '(local)' : game.version}`)
}

manifests.sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

const cards = manifests
  .map((manifest) => {
    const accent = manifest.themeColor ?? '#34d399'
    const thumb = existsSync(join(outGamesDir, manifest.id, 'thumb.png'))
      ? `<img src="./games/${manifest.id}/thumb.png" alt="" />`
      : `<span class="initial">${escapeHtml(manifest.title.en?.slice(0, 1) ?? '?')}</span>`
    return `
      <a class="card" href="./games/${manifest.id}/" style="--accent:${accent}">
        <div class="thumb">${thumb}</div>
        <div class="meta">
          <h2>${escapeHtml(manifest.title.zh ?? manifest.id)}</h2>
          <p class="en">${escapeHtml(manifest.title.en ?? '')}</p>
          <p class="desc">${escapeHtml(manifest.description.zh ?? '')}</p>
        </div>
        <span class="play">Play →</span>
      </a>`
  })
  .join('\n')

writeFileSync(
  join(outDir, 'index.html'),
  `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230b1020'/%3E%3Crect x='16' y='16' width='32' height='32' rx='8' fill='%2334d399'/%3E%3C/svg%3E" />
<title>Mini Games</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; background: #0b1020; color: #e8eefc;
    font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
    background-image: radial-gradient(900px 500px at 85% -10%, rgba(52,211,153,.10), transparent 60%),
                      radial-gradient(700px 500px at 5% 110%, rgba(56,189,248,.08), transparent 60%);
  }
  main { max-width: 1100px; margin: 0 auto; padding: 72px 24px 80px; }
  header { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
  h1 { font-size: 44px; margin: 0; letter-spacing: .5px; }
  header p { margin: 0; color: #8b9bb4; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 40px; }
  .card {
    position: relative; display: flex; flex-direction: column; text-decoration: none; color: inherit;
    background: #151f36; border: 1px solid #26385c; border-radius: 18px; overflow: hidden;
    transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
  }
  .card:hover { transform: translateY(-4px); border-color: var(--accent, #34d399); box-shadow: 0 18px 40px rgba(0,0,0,.35); }
  .thumb {
    height: 160px; display: flex; align-items: center; justify-content: center; overflow: hidden;
    background: #0b1020;
    background: radial-gradient(120% 120% at 30% 20%, color-mix(in srgb, var(--accent) 35%, #0b1020), #0b1020 70%);
  }
  .thumb img { width: 100%; height: 100%; object-fit: cover; }
  .initial { font-size: 64px; font-weight: 700; color: var(--accent); opacity: .9; }
  .meta { padding: 18px 20px 8px; }
  .meta h2 { margin: 0; font-size: 24px; }
  .meta .en { margin: 2px 0 10px; color: var(--accent, #34d399); font-size: 13px; letter-spacing: 1px; text-transform: uppercase; }
  .meta .desc { margin: 0; color: #8b9bb4; font-size: 14px; line-height: 1.6; }
  .play { padding: 16px 20px 20px; margin-top: auto; color: #8b9bb4; font-size: 14px; }
  .card:hover .play { color: #e8eefc; }
  footer { margin-top: 56px; color: #56657d; font-size: 13px; }
</style>
</head>
<body>
<main>
  <header>
    <h1>Mini Games</h1>
    <p>小游戏合集 · A tiny arcade</p>
  </header>
  <section class="grid">
    ${cards || '<p>还没有构建好的游戏。先运行 <code>npm run site</code>。</p>'}
  </section>
  <footer>${manifests.length} game${manifests.length === 1 ? '' : 's'} · built with Phaser 4</footer>
</main>
</body>
</html>
`,
)

writeFileSync(join(outDir, 'games.json'), JSON.stringify(manifests, null, 2))

const adsenseClient = normalizeAdsenseClient(process.env.VITE_ADSENSE_CLIENT)
const adChannel = process.env.VITE_AD_CHANNEL
if (adChannel === 'h5games' && adsenseClient && !adsenseClient.includes('X')) {
  writeFileSync(join(outDir, 'ads.txt'), `${adsTxtLine(adsenseClient)}\n`)
  console.log(`[site] ads.txt written for ${adsenseClient}`)
}

console.log(`[site] built ${manifests.length} game(s) -> ${outDir}`)

async function download(url: string, dest: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`[site] download failed ${response.status} ${url}`)
  writeFileSync(dest, Buffer.from(await response.arrayBuffer()))
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
