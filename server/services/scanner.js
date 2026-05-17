import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { randomUUID } from 'crypto';

const VIDEO_EXTS = new Set(['.mp4', '.mkv', '.avi']);
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg']);
const COVER_NAMES = new Set(['cover', 'poster', 'folder', 'front']);

function findVideos(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.')) continue;
      const fullPath = join(dir, entry);
      try {
        const st = statSync(fullPath);
        if (st.isFile() && VIDEO_EXTS.has(extname(entry).toLowerCase())) {
          results.push({ filename: entry, path: fullPath, progress: 0, watched: false });
        }
      } catch { /* skip inaccessible files */ }
    }
  } catch { /* skip inaccessible dirs */ }
  return results;
}

function findCover(dir) {
  try {
    const entries = readdirSync(dir);
    for (const prefix of COVER_NAMES) {
      for (const entry of entries) {
        const name = basename(entry, extname(entry)).toLowerCase();
        if (name === prefix && IMAGE_EXTS.has(extname(entry).toLowerCase())) {
          return join(dir, entry);
        }
      }
    }
    for (const entry of entries) {
      if (IMAGE_EXTS.has(extname(entry).toLowerCase())) {
        return join(dir, entry);
      }
    }
  } catch { /* skip */ }
  return null;
}

export function scan(animePath) {
  if (!animePath || !existsSync(animePath)) {
    throw new Error(`路径不存在: ${animePath}`);
  }

  const animes = [];
  let entries;
  try {
    entries = readdirSync(animePath);
  } catch {
    throw new Error(`无法读取路径: ${animePath}`);
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    const fullPath = join(animePath, entry);
    let st;
    try { st = statSync(fullPath); } catch { continue; }
    if (!st.isDirectory()) continue;

    const videos = [];

    // Level 1: videos directly in anime folder
    videos.push(...findVideos(fullPath));

    // Level 2: videos in season subfolders
    try {
      for (const sub of readdirSync(fullPath)) {
        if (sub.startsWith('.')) continue;
        const subPath = join(fullPath, sub);
        try {
          if (statSync(subPath).isDirectory()) {
            videos.push(...findVideos(subPath));
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }

    if (videos.length === 0) continue;

    videos.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

    const cover = findCover(fullPath);

    animes.push({
      id: randomUUID(),
      name: entry,
      path: fullPath,
      cover,
      tags: [],
      episodes: videos
    });
  }

  return animes;
}
