import { createApp } from './app.js';

const DB_PATH = process.env.DB_PATH || null;
const PORT = parseInt(process.env.PORT) || 3001;

const app = createApp(DB_PATH);
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[server] running at http://localhost:${PORT}`);
});
