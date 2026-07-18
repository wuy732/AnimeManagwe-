import { Router } from 'express';
import { existsSync } from 'fs';
import { createDB } from '../services/db.js';

export default function settingsRouter(dbPath) {
  const router = Router();
  const db = createDB(dbPath);

  router.get('/', (_req, res) => {
    const data = db.read();
    res.json({ anime_path: data.anime_path, player_path: data.player_path || '' });
  });

  router.post('/', (req, res) => {
    const { anime_path, player_path } = req.body;
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

    if (player_path !== undefined) {
      if (player_path && !existsSync(player_path)) {
        return res.status(400).json({ error: `播放器路径不存在: ${player_path}` });
      }
      data.player_path = player_path || '';
    }

    db.write(data);
    // Read back from db for consistent response
    const saved = db.read();
    res.json({ anime_path: saved.anime_path, player_path: saved.player_path || '' });
  });

  return router;
}
