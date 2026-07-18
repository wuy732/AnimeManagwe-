import { Router } from 'express';
import { createDB } from '../services/db.js';

export default function animeRouter(dbPath) {
  const router = Router();
  const db = createDB(dbPath);

  router.get('/', (_req, res) => {
    const data = db.read();
    res.json(data.animes || []);
  });

  router.get('/:id', (req, res) => {
    const data = db.read();
    const anime = (data.animes || []).find(a => a.id === req.params.id);
    if (!anime) return res.status(404).json({ error: '动漫不存在' });
    res.json(anime);
  });

  router.patch('/:id', (req, res) => {
    const data = db.read();
    const idx = (data.animes || []).findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '动漫不存在' });

    const anime = data.animes[idx];
    const { tags, episodes, cover, notes, public: pub } = req.body;

    if (Array.isArray(tags)) anime.tags = tags;
    if (typeof cover === 'string') anime.cover = cover;
    if (typeof notes === 'string') anime.notes = notes;
    if (typeof pub === 'boolean') anime.public = pub;

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

    db.write(data);
    res.json(anime);
  });

  return router;
}
