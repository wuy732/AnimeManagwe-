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
    const { tags, episodes } = req.body;

    if (tags !== undefined) anime.tags = tags;

    if (episodes !== undefined) {
      const epMap = new Map(anime.episodes.map(e => [e.filename, e]));
      for (const ep of episodes) {
        const existing = epMap.get(ep.filename);
        if (existing) {
          if (ep.progress !== undefined) existing.progress = ep.progress;
          if (ep.watched !== undefined) existing.watched = ep.watched;
        }
      }
    }

    writeDB(db);
    res.json(anime);
  });

  return router;
}
