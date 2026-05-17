import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import settingsRouter from './routes/settings.js';
import animeRouter from './routes/anime.js';
import scannerRouter from './routes/scanner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

// Serve cover images from local filesystem
app.get('/api/cover', (req, res) => {
  const filePath = req.query.path;
  if (!filePath || !existsSync(filePath)) {
    return res.status(404).end();
  }
  res.sendFile(filePath);
});

app.use('/api/settings', settingsRouter(DB_PATH));
app.use('/api/animes', animeRouter(DB_PATH));
app.use('/api', scannerRouter(DB_PATH));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[server] running at http://localhost:${PORT}`);
});
