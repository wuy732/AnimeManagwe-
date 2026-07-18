import { Router } from 'express';
import { existsSync } from 'fs';
import { detectPlayer, getPlayerName, playFile } from '../services/player.js';
import { createDB } from '../services/db.js';

export default function playerRouter(dbPath) {
  const router = Router();
  const db = createDB(dbPath);

  function validatePath(filePath) {
    try {
      const data = db.read();
      const norm = (p) => p.replace(/\\/g, '/').toLowerCase();
      const fp = norm(filePath);
      return (data.animes || []).some(a => fp.startsWith(norm(a.path)))
        || (data.anime_path && fp.startsWith(norm(data.anime_path)));
    } catch { return true; }
  }

  router.post('/play', async (req, res) => {
    const { filePath } = req.body;
    if (!filePath || !existsSync(filePath)) {
      return res.status(400).json({ error: '文件不存在' });
    }
    if (!validatePath(filePath)) {
      return res.status(403).json({ error: '路径不在允许范围内' });
    }

    const data = db.read();
    const playerPath = detectPlayer(data.player_path);

    if (!playerPath) {
      return res.status(400).json({
        error: '未找到播放器。请在设置中指定播放器路径（支持 VLC / PotPlayer / MPC-HC / MPC-BE / mpv）'
      });
    }

    try {
      await playFile(playerPath, filePath);
      res.json({ ok: true, player: getPlayerName(playerPath) });
    } catch (err) {
      res.status(500).json({ error: '无法启动播放器: ' + err.message });
    }
  });

  router.post('/detect-player', (_req, res) => {
    const data = db.read();
    const found = detectPlayer(data.player_path);
    if (found) {
      res.json({ found: true, path: found, name: getPlayerName(found) });
    } else {
      res.json({ found: false });
    }
  });

  return router;
}
