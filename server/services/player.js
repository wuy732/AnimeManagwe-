import { existsSync } from 'fs';
import { execFile } from 'child_process';

const KNOWN_PLAYERS = [
  'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
  'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe',
  'C:\\Program Files\\DAUM\\PotPlayer\\PotPlayerMini64.exe',
  'C:\\Program Files\\DAUM\\PotPlayer\\PotPlayerMini.exe',
  'C:\\Program Files (x86)\\DAUM\\PotPlayer\\PotPlayerMini64.exe',
  'C:\\Program Files (x86)\\DAUM\\PotPlayer\\PotPlayerMini.exe',
  'C:\\Program Files\\MPC-HC\\mpc-hc64.exe',
  'C:\\Program Files\\MPC-HC\\mpc-hc.exe',
  'C:\\Program Files\\MPC-BE x64\\mpc-be64.exe',
  'C:\\Program Files\\MPC-BE\\mpc-be.exe',
  'C:\\Program Files\\mpv\\mpv.exe',
  'C:\\Program Files (x86)\\mpv\\mpv.exe',
];

export function detectPlayer(customPath) {
  if (customPath && existsSync(customPath)) return customPath;
  for (const p of KNOWN_PLAYERS) {
    if (existsSync(p)) return p;
  }
  return null;
}

export function getPlayerName(playerPath) {
  const lower = playerPath.toLowerCase();
  if (lower.includes('vlc')) return 'VLC';
  if (lower.includes('potplayer')) return 'PotPlayer';
  if (lower.includes('mpc-hc')) return 'MPC-HC';
  if (lower.includes('mpc-be')) return 'MPC-BE';
  if (lower.includes('mpv')) return 'mpv';
  return '本地播放器';
}

export function playFile(playerPath, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const proc = execFile(playerPath, [filePath], {
        detached: true,
        windowsHide: false,
        stdio: 'ignore'
      });
      proc.unref();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}
