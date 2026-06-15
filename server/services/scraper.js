import axios from 'axios';
import { readFileSync } from 'fs';
import { downloadCover } from './scanner.js';

const API_URLS = [
  'https://api.bgm.tv/v0/search/subjects',
  'https://bangumi-api.bgm.ist/v0/search/subjects',
];
const UA = 'AnimeManager/1.0 (local app)';
const TIMEOUT = 20000;

function cleanName(name) {
  let cleaned = name.replace(/\[.*?\]/g, '');
  const seasonIdx = cleaned.search(/[-–]\s*(S\d+|Season\s*\d|第[一二三四五六七八九十\d]+季)/i);
  if (seasonIdx > 0) cleaned = cleaned.slice(0, seasonIdx);
  cleaned = cleaned.replace(/\s*[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\s*$/g, '');
  cleaned = cleaned.replace(/\s*S\d+\s*$/gi, '');
  cleaned = cleaned.replace(/\s*Season\s*\d+\s*$/gi, '');
  return cleaned.trim() || name;
}

let _dbPath = null;
export function setDbPath(p) { _dbPath = p; }

function getProxy() {
  if (!_dbPath) return null;
  try {
    const db = JSON.parse(readFileSync(_dbPath, 'utf-8'));
    return db.proxy || null;
  } catch { return null; }
}

async function trySearch(url, keyword) {
  const opts = {
    headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
    timeout: TIMEOUT
  };
  const proxy = getProxy();
  if (proxy) {
    const u = new URL(proxy);
    opts.proxy = { host: u.hostname, port: parseInt(u.port) || 8080, protocol: u.protocol.replace(':', '') };
  }
  return axios.post(url, { keyword, filter: { type: [2] } }, opts);
}

export async function searchBangumi(folderName) {
  const keyword = cleanName(folderName);
  if (!keyword) return null;

  let lastErr;
  for (const url of API_URLS) {
    try {
      const { data } = await trySearch(url, keyword);
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
      lastErr = err;
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        // Timeout — try next API URL
        continue;
      }
    }
  }

  if (lastErr) {
    const code = lastErr.code || '';
    if (code.includes('TIMEDOUT') || code.includes('ABORTED')) {
      console.error(`[scraper] 搜索超时 "${folderName}" → "${keyword}": 网络不可达，可配置代理后重试`);
    } else {
      console.error(`[scraper] 搜索失败 "${folderName}": ${lastErr.message}`);
    }
  }
  return null;
}

export async function scrapeAll(animes, writeDB, readDB, delayMs = 1500) {
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

    const db = readDB();
    const idx = (db.animes || []).findIndex(a => a.id === anime.id);
    if (idx !== -1) db.animes[idx] = anime;
    writeDB(db);

    await new Promise(r => setTimeout(r, delayMs));
  }
}
