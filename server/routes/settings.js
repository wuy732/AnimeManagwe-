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
    res.json({ anime_path: db.anime_path });
  });

  router.post('/', (req, res) => {
    const { anime_path } = req.body;
    if (!anime_path || typeof anime_path !== 'string') {
      return res.status(400).json({ error: '请提供有效的 anime_path' });
    }
    if (!existsSync(anime_path)) {
      return res.status(400).json({ error: `路径不存在: ${anime_path}` });
    }
    const db = readDB();
    db.anime_path = anime_path;
    writeDB(db);
    res.json({ anime_path: db.anime_path });
  });

  return router;
}
