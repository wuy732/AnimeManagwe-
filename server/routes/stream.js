import { Router } from 'express';
import { statSync, createReadStream, existsSync } from 'fs';
import { extname } from 'path';

const MIME = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.webm': 'video/webm'
};

export default function streamRouter() {
  const router = Router();

  router.get('/stream', (req, res) => {
    const filePath = req.query.path;
    if (!filePath || !existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const stat = statSync(filePath);
    const fileSize = stat.size;
    const ext = extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'video/mp4';
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
        return;
      }

      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mime
      });

      createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mime,
        'Accept-Ranges': 'bytes'
      });
      createReadStream(filePath).pipe(res);
    }
  });

  return router;
}
