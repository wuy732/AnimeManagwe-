import { Router } from 'express';
import { readFileSync, writeFileSync } from 'fs';

export default function animeRouter(dbPath) {
  const router = Router();

  function readDB() {
    return JSON.parse(readFileSync(dbPath, 'utf-8'));
  }

  function writeDB(data) {
    writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  router.get('/', (_req, res) => {
    const db = readDB();
    res.json(db.animes || []);
  });

  router.get('/:id', (req, res) => {
    const db = readDB();
    const anime = (db.animes || []).find(a => a.id === req.params.id);
    if (!anime) return res.status(404).json({ error: '动漫不存在' });
    res.json(anime);
  });

  router.patch('/:id', (req, res) => {
    const db = readDB();
    const idx = (db.animes || []).findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '动漫不存在' });

    const anime = db.animes[idx];
    const { tags, episodes, cover, notes } = req.body;

    if (Array.isArray(tags)) anime.tags = tags;
    if (typeof cover === 'string') anime.cover = cover;
    if (typeof notes === 'string') anime.notes = notes;

    if (Array.isArray(episodes)) {
      const epMap = new Map(anime.episodes.map(e => [e.filename, e]));
      for (const ep of episodes) {
        const existing = epMap.get(ep.filename);
        if (existing) {
          if (typeof ep.progress === 'number') existing.progress = ep.progress;
          if (typeof ep.watched === 'boolean') existing.watched = ep.watched;
        }
      }
    }

    writeDB(db);
    res.json(anime);
  });

  return router;
}
