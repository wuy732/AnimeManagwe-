import { createApp } from './app.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, '..', 'db.json');
const PORT = parseInt(process.env.PORT) || 3001;

const app = createApp(DB_PATH);
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[server] running at http://localhost:${PORT}`);
});
