import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';

export default function settingsRouter(dbPath) {
  const router = Router();

  function readDB() {
    return JSON.parse(readFileSync(dbPath, 'utf-8'));
  }

  function writeDB(data) {
    writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  router.get('/', (_req, res) => {
    const db = readDB();
    res.json({ anime_path: db.anime_path, player_path: db.player_path || '' });
  });

  router.post('/', (req, res) => {
    const { anime_path, player_path } = req.body;
    const db = readDB();

    if (anime_path !== undefined) {
      if (typeof anime_path !== 'string' || !anime_path.trim()) {
        return res.status(400).json({ error: '请提供有效的 anime_path' });
      }
      if (!existsSync(anime_path)) {
        return res.status(400).json({ error: `路径不存在: ${anime_path}` });
      }
      db.anime_path = anime_path;
    }

    if (player_path !== undefined) {
      if (player_path && !existsSync(player_path)) {
        return res.status(400).json({ error: `播放器路径不存在: ${player_path}` });
      }
      db.player_path = player_path || '';
    }

    writeDB(db);
    res.json({ anime_path: db.anime_path, player_path: db.player_path || '' });
  });

  return router;
}
