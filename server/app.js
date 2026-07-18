import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import settingsRouter from './routes/settings.js';
import animeRouter from './routes/anime.js';
import scannerRouter from './routes/scanner.js';
import playerRouter from './routes/player.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const __root = join(__dirname, '..');
const DIST_PATH = join(__root, 'client', 'dist');

export function createApp(dbPath) {
  const dbFile = dbPath || join(__root, 'db.json');
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Serve cover images from local filesystem
  app.get('/api/cover', (req, res) => {
    const filePath = req.query.path;
    if (!filePath || !existsSync(filePath)) return res.status(404).end();
    // Validate path is within known safe directories
    const db = JSON.parse(readFileSync(dbFile, 'utf-8'));
    const norm = (p) => p.replace(/\\/g, '/').toLowerCase();
    const fp = norm(filePath);
    const safe = (db.animes || []).some(a => fp.startsWith(norm(a.path)))
      || (db.anime_path && fp.startsWith(norm(db.anime_path)));
    if (!safe) return res.status(403).json({ error: '路径不在允许范围内' });
    res.sendFile(filePath);
  });

  app.use('/api/settings', settingsRouter(dbFile));
  app.use('/api/animes', animeRouter(dbFile));
  app.use('/api', scannerRouter(dbFile));
  app.use('/api', playerRouter(dbFile));

  // Serve static frontend
  if (existsSync(DIST_PATH)) {
    app.use(express.static(DIST_PATH));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(join(DIST_PATH, 'index.html'));
      }
    });
    console.log('[server] serving static frontend from client/dist');
  }

  return app;
}

export { DIST_PATH };
