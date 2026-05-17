import { Router } from 'express';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { detectPlayer, getPlayerName, playFile } from '../services/player.js';

export default function playerRouter(dbPath) {
  const router = Router();

  function readDB() {
    return JSON.parse(readFileSync(dbPath, 'utf-8'));
  }

  router.post('/play', async (req, res) => {
    const { filePath } = req.body;
    if (!filePath || !existsSync(filePath)) {
      return res.status(400).json({ error: '文件不存在' });
    }

    const db = readDB();
    const playerPath = detectPlayer(db.player_path);

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
    const db = readDB();
    const found = detectPlayer(db.player_path);
    if (found) {
      res.json({ found: true, path: found, name: getPlayerName(found) });
    } else {
      res.json({ found: false });
    }
  });

  return router;
}
