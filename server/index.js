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

const __dirname = (typeof __dirname !== 'undefined')
  ? __dirname  // CJS (pkg bundled)
  : dirname(fileURLToPath(import.meta.url));  // ESM (dev)
// Bundle entry lives in server/dist-bundle/ — go up one more level
const __root = __dirname.endsWith('dist-bundle')
  ? join(__dirname, '..', '..')
  : join(__dirname, '..');
const isPkg = typeof process.pkg !== 'undefined';

// ── DB path (writable location for pkg) ──
function resolveDbPath() {
  if (isPkg) {
    const exeDir = dirname(process.execPath);
    const dbFile = join(exeDir, 'db.json');
    if (!existsSync(dbFile)) {
      const bundled = join(__root, 'db.json');
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

// ── Kill existing process on port ──
function killPortProcess(port) {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`
      : `lsof -ti :${port} | xargs kill -9 2>/dev/null`;
    exec(cmd, () => {
      // Give the OS a moment to release the port
      setTimeout(resolve, 800);
    });
  });
}

function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, '0.0.0.0', () => {
      resolve(server);
    });
    server.on('error', (err) => {
      reject(err);
    });
  });
}

// ── Start (with auto-kill previous instance) ──
const PORT = 3001;

async function boot() {
  try {
    var server = await startServer(PORT);
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.log('[boot] 端口被占用，正在关闭旧进程...');
      await killPortProcess(PORT);
      try {
        server = await startServer(PORT);
      } catch (retryErr) {
        console.error('');
        console.error('  ╔══════════════════════════════════════════╗');
        console.error('  ║  端口 3001 无法释放，请手动关闭          ║');
        console.error('  ╚══════════════════════════════════════════╝');
        console.error('');
        setTimeout(() => process.exit(1), 5000);
        return;
      }
    } else {
      console.error('Server error:', err.message);
      process.exit(1);
      return;
    }
  }

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
}

boot();
