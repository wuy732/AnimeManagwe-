import { Router } from 'express';
import { scan } from '../services/scanner.js';
import { createDB } from '../services/db.js';

export default function scannerRouter(dbPath) {
  const router = Router();
  const db = createDB(dbPath);

  function mergeAnimes(existing, scanned) {
    const existingByPath = new Map(existing.map(a => [a.path, a]));

    for (const anime of scanned) {
      const old = existingByPath.get(anime.path);
      if (old) {
        anime.id = old.id;
        anime.tags = old.tags || [];
        // Always preserve user's custom cover (may be set manually)
        if (old.cover) anime.cover = old.cover;
        if (old.notes) anime.notes = old.notes;
        if (old.public !== undefined) anime.public = old.public;
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
      const data = db.read();
      if (!data.anime_path) {
        return res.status(400).json({ error: '请先设置动漫资源路径' });
      }
      const scanned = scan(data.anime_path);
      data.animes = mergeAnimes(data.animes || [], scanned);
      db.write(data);
      res.json({ count: data.animes.length, animes: data.animes });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
