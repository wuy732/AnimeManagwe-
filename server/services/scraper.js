import axios from 'axios';
import { downloadCover } from './scanner.js';

const SEARCH_URL = 'https://api.bgm.tv/v0/search/subjects';
const UA = 'AnimeManager/1.0 (local app)';

function cleanName(name) {
  return name
    .replace(/\[.*?\]/g, '')
    .replace(/[-–]\s*S\d+.*$/i, '')
    .replace(/[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]/g, '')
    .replace(/\s*S\d+/gi, '')
    .trim() || name;
}

export async function searchBangumi(folderName) {
  const keyword = cleanName(folderName);
  try {
    const { data } = await axios.post(SEARCH_URL, {
      keyword,
      filter: { type: [2] }
    }, {
      headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!data.data || data.data.length === 0) return null;

    const item = data.data[0];
    return {
      bangumi_id: item.id,
      name_cn: item.name_cn || item.name,
      poster: item.images?.large || item.images?.common || '',
      summary: item.summary || '',
      score: item.score || 0,
      bangumi_tags: (item.tags || []).map(t => t.name).slice(0, 10)
    };
  } catch (err) {
    console.error(`[scraper] 搜索失败 "${folderName}": ${err.message}`);
    return null;
  }
}

export async function scrapeAll(animes, writeDB, readDB, delayMs = 1500) {
  let updated = false;

  for (const anime of animes) {
    if (anime.scraped) continue;

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
    updated = true;

    // Save after each scrape so partial results persist
    const db = readDB();
    const idx = (db.animes || []).findIndex(a => a.id === anime.id);
    if (idx !== -1) db.animes[idx] = anime;
    writeDB(db);

    // Rate limiting
    await new Promise(r => setTimeout(r, delayMs));
  }

  return updated;
}
