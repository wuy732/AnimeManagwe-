import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { networkInterfaces } from 'os';
import { exec } from 'child_process';
import settingsRouter from './routes/settings.js';
import animeRouter from './routes/anime.js';
import scannerRouter from './routes/scanner.js';
import streamRouter from './routes/stream.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const __root = join(__dirname, '..');
const isPkg = typeof process.pkg !== 'undefined';

// ── DB path (writable location for pkg) ──
function resolveDbPath() {
  if (isPkg) {
    const exeDir = dirname(process.execPath);
    const dbFile = join(exeDir, 'db.json');
    if (!existsSync(dbFile)) {
      const bundled = join(__dirname, '..', 'db.json');
      if (existsSync(bundled)) {
        writeFileSync(dbFile, readFileSync(bundled, 'utf-8'), 'utf-8');
      } else {
        writeFileSync(dbFile, JSON.stringify({ anime_path: '', animes: [] }, null, 2), 'utf-8');
      }
    }
    return dbFile;
  }
  return join(__root, 'db.json');
}

const DB_PATH = resolveDbPath();
const DIST_PATH = join(__root, 'client', 'dist');

// ── LAN IP detection ──
function getLanIPs() {
  const ips = [];
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

// ── Express ──
const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.get('/api/cover', (req, res) => {
  const filePath = req.query.path;
  if (!filePath || !existsSync(filePath)) return res.status(404).end();
  res.sendFile(filePath);
});

// Server info endpoint (LAN URLs for frontend)
app.get('/api/server-info', (_req, res) => {
  res.json({ ips: getLanIPs(), port: PORT });
});

app.use('/api/settings', settingsRouter(DB_PATH));
app.use('/api/animes', animeRouter(DB_PATH));
app.use('/api', scannerRouter(DB_PATH));
app.use('/api', streamRouter());

// ── Production: serve static frontend ──
if (existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(DIST_PATH, 'index.html'));
    }
  });
  console.log('[server] serving static frontend from client/dist');
}

// ── Start ──
const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  const lanIPs = getLanIPs();
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║        🎬  Anime Manager  🎬            ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║  本地:  http://localhost:${PORT}          ║`);
  for (const ip of lanIPs) {
    const url = `http://${ip}:${PORT}`;
    console.log(`  ║  局域网: ${url}${' '.repeat(Math.max(0, 28 - url.length))}║`);
  }
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');

  // Auto-open browser (only in pkg mode or when not in watch mode)
  if (isPkg || !process.argv.includes('--no-open')) {
    const url = `http://localhost:${PORT}`;
    const platform = process.platform;
    const cmd = platform === 'win32'
      ? `start "" "${url}"`
      : platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
    exec(cmd, () => {});
  }
});
