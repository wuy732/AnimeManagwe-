import { Router } from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { scan } from '../services/scanner.js';

export default function scannerRouter(dbPath) {
  const router = Router();

  function readDB() {
    return JSON.parse(readFileSync(dbPath, 'utf-8'));
  }

  function writeDB(data) {
    writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  function mergeAnimes(existing, scanned) {
    const existingByPath = new Map(existing.map(a => [a.path, a]));

    for (const anime of scanned) {
      const old = existingByPath.get(anime.path);
      if (old) {
        anime.id = old.id;
        anime.tags = old.tags || [];
        if (old.cover && old.cover !== anime.cover) {
          anime.cover = old.cover;
        }
        const oldEpByFilename = new Map(old.episodes.map(e => [e.filename, e]));
        for (const ep of anime.episodes) {
          const oldEp = oldEpByFilename.get(ep.filename);
          if (oldEp) {
            ep.progress = oldEp.progress ?? 0;
            ep.watched = oldEp.watched ?? false;
          }
        }
      }
    }

    return scanned;
  }

  router.post('/scan', (req, res) => {
    try {
      const db = readDB();
      if (!db.anime_path) {
        return res.status(400).json({ error: '请先设置动漫资源路径' });
      }
      const scanned = scan(db.anime_path);
      db.animes = mergeAnimes(db.animes || [], scanned);
      writeDB(db);
      res.json({ count: db.animes.length, animes: db.animes });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
