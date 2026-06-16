import { Router } from 'express';
import { existsSync } from 'fs';
import { createDB } from '../services/db.js';

export default function settingsRouter(dbPath) {
  const router = Router();
  const db = createDB(dbPath);

  router.get('/', (_req, res) => {
    const data = db.read();
    res.json({ anime_path: data.anime_path, proxy: data.proxy || '', public_mode: data.public_mode || false });
  });

  router.post('/', (req, res) => {
    const { anime_path, proxy, public_mode } = req.body;
    const data = db.read();

    if (anime_path !== undefined) {
      if (typeof anime_path !== 'string' || !anime_path.trim()) {
        return res.status(400).json({ error: '请提供有效的 anime_path' });
      }
      if (!existsSync(anime_path)) {
        return res.status(400).json({ error: `路径不存在: ${anime_path}` });
      }
      data.anime_path = anime_path;
    }

    if (proxy !== undefined) {
      data.proxy = (typeof proxy === 'string') ? proxy.trim() : '';
    }

    if (public_mode !== undefined) {
      data.public_mode = !!public_mode;
    }

    db.write(data);
    res.json({ anime_path: data.anime_path, proxy: data.proxy || '', public_mode: data.public_mode || false });
  });

  return router;
}
