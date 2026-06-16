import { Router } from 'express';
import { scan, downloadCover } from '../services/scanner.js';
import { scrapeAll, searchBangumi, setDbPath } from '../services/scraper.js';
import { createDB } from '../services/db.js';

export default function scannerRouter(dbPath) {
  setDbPath(dbPath);
  const router = Router();
  const db = createDB(dbPath);

  function mergeAnimes(existing, scanned) {
    const existingByPath = new Map(existing.map(a => [a.path, a]));

    for (const anime of scanned) {
      const old = existingByPath.get(anime.path);
      if (old) {
        anime.id = old.id;
        anime.tags = old.tags || [];
        anime.poster = old.poster || anime.poster;
        anime.summary = old.summary || '';
        anime.score = old.score || 0;
        anime.bangumi_tags = old.bangumi_tags || [];
        anime.scraped = old.scraped || false;
        if (old.public !== undefined) anime.public = old.public;
        // Always preserve user's custom cover (may be set via scrape or manual)
        if (old.cover) anime.cover = old.cover;
        if (old.notes) anime.notes = old.notes;

        const oldEpByFilename = new Map(old.episodes.map(e => [e.filename, e]));
        for (const ep of anime.episodes) {
          const oldEp = oldEpByFilename.get(ep.filename);
          if (oldEp) {
            ep.progress = oldEp.progress ?? 0;
            ep.watched = oldEp.watched ?? false;
          }
        }
      }
    }

    return scanned;
  }

  router.post('/scan', (req, res) => {
    try {
      const data = db.read();
      if (!data.anime_path) {
        return res.status(400).json({ error: '请先设置动漫资源路径' });
      }
      const scanned = scan(data.anime_path);
      data.animes = mergeAnimes(data.animes || [], scanned);
      db.write(data);
      res.json({ count: data.animes.length, animes: data.animes });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Batch scrape all unscraped (or force re-scrape all)
  router.post('/scrape', async (req, res) => {
    try {
      const data = db.read();
      if (!data.animes || data.animes.length === 0) {
        return res.status(400).json({ error: '没有动漫数据，请先扫描' });
      }
      const force = req.query.force === 'true';
      if (force) {
        for (const a of data.animes) a.scraped = false;
        db.write(data);
      }
      res.json({ message: '刮削已启动' });
      await scrapeAll(data.animes, (d) => db.write(d), () => db.read());
    } catch (err) {
      console.error('[scrape] error:', err.message);
    }
  });

  // Scrape a single anime (force re-scrape)
  router.post('/scrape/:id', async (req, res) => {
    try {
      const data = db.read();
      const anime = (data.animes || []).find(a => a.id === req.params.id);
      if (!anime) return res.status(404).json({ error: '动漫不存在' });

      res.json({ message: '刮削已启动' });

      const info = await searchBangumi(anime.name);
      if (info) {
        anime.poster = info.poster;
        anime.summary = info.summary;
        anime.score = info.score;
        anime.bangumi_tags = info.bangumi_tags;
        anime.bangumi_id = info.bangumi_id;
        anime.name_cn = info.name_cn;
        const localCover = await downloadCover(info.poster, anime.path);
        if (localCover) anime.cover = localCover;
      }
      anime.scraped = true;
      db.write(data);
    } catch (err) {
      console.error('[scrape] error:', err.message);
    }
  });

  return router;
}
