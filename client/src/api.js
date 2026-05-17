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
