const BASE = '/api';

export async function getSettings() {
  const res = await fetch(`${BASE}/settings`);
  if (!res.ok) throw new Error('获取设置失败');
  return res.json();
}

export async function updateSettings(animePath) {
  const res = await fetch(`${BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anime_path: animePath })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '保存设置失败');
  return data;
}

export async function triggerScan() {
  const res = await fetch(`${BASE}/scan`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '扫描失败');
  return data;
}

export async function triggerScrape(force = false) {
  const url = force ? `${BASE}/scrape?force=true` : `${BASE}/scrape`;
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '刮削启动失败');
  return data;
}

export async function scrapeAnime(id) {
  const res = await fetch(`${BASE}/scrape/${id}`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '刮削失败');
  return data;
}

export async function getAnimes() {
  const res = await fetch(`${BASE}/animes`);
  return res.json();
}

export async function getAnime(id) {
  const res = await fetch(`${BASE}/animes/${id}`);
  if (!res.ok) throw new Error('动漫不存在');
  return res.json();
}

export async function updateAnime(id, data) {
  const res = await fetch(`${BASE}/animes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('更新失败');
  return res.json();
}

export function streamUrl(filePath) {
  return `${BASE}/stream?path=${encodeURIComponent(filePath)}`;
}

export function coverUrl(localPath) {
  if (!localPath) return null;
  return `${BASE}/cover?path=${encodeURIComponent(localPath)}`;
}

export async function getServerInfo() {
  const res = await fetch(`${BASE}/server-info`);
  return res.json();
}
