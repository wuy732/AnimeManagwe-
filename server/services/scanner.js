import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { randomUUID } from 'crypto';

const VIDEO_EXTS = new Set(['.mp4', '.mkv', '.avi', '.webm']);
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg']);
const COVER_NAMES = new Set(['cover', 'poster', 'folder', 'front']);
const MISC_FOLDERS = new Set(['其他', 'misc', 'other', '杂项']);

function findVideos(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.')) continue;
      const fullPath = join(dir, entry);
      try {
        if (statSync(fullPath).isFile() && VIDEO_EXTS.has(extname(entry).toLowerCase())) {
          results.push({ filename: entry, path: fullPath, progress: 0, watched: false });
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
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

function findNotes(dir) {
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.endsWith('.txt') && !entry.startsWith('.')) {
        return readFileSync(join(dir, entry), 'utf-8').slice(0, 2000);
      }
    }
  } catch { /* skip */ }
  return '';
}

function scanSubdirsForVideos(dir) {
  const videos = [];
  try {
    for (const sub of readdirSync(dir)) {
      if (sub.startsWith('.')) continue;
      const subPath = join(dir, sub);
      try {
        if (statSync(subPath).isDirectory()) {
          videos.push(...findVideos(subPath));
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return videos;
}

export function scan(animePath) {
  if (!animePath || !existsSync(animePath)) {
    throw new Error(`路径不存在: ${animePath}`);
  }

  const animes = [];
  let entries;
  try { entries = readdirSync(animePath); } catch {
    throw new Error(`无法读取路径: ${animePath}`);
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    const fullPath = join(animePath, entry);
    let st;
    try { st = statSync(fullPath); } catch { continue; }
    if (!st.isDirectory()) continue;

    // Misc folders: each subfolder = independent anime
    if (MISC_FOLDERS.has(entry.toLowerCase())) {
      try {
        for (const sub of readdirSync(fullPath)) {
          if (sub.startsWith('.')) continue;
          const subPath = join(fullPath, sub);
          try { if (!statSync(subPath).isDirectory()) continue; } catch { continue; }

          const videos = [...findVideos(subPath), ...scanSubdirsForVideos(subPath)];
          if (videos.length === 0) continue;
          videos.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

          animes.push({
            id: randomUUID(), name: sub, path: subPath,
            cover: findCover(subPath), notes: findNotes(subPath),
            tags: [], public: true, episodes: videos
          });
        }
      } catch { /* skip */ }
      continue;
    }

    // Normal anime
    let videos = findVideos(fullPath);
    if (videos.length > 0) {
      videos.push(...scanSubdirsForVideos(fullPath));
    } else {
      videos = scanSubdirsForVideos(fullPath);
    }
    if (videos.length === 0) continue;

    videos.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

    animes.push({
      id: randomUUID(), name: entry, path: fullPath,
      cover: findCover(fullPath), notes: findNotes(fullPath),
      tags: [], public: true, episodes: videos
    });
  }

  return animes;
}
