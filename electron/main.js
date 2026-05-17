import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import path from 'path';
import { existsSync, copyFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow = null;
let httpServer = null;
const PORT = 3001;

function getExeDir() {
  return path.dirname(app.getPath('exe'));
}

function getDbPath() {
  const dbPath = path.join(getExeDir(), 'db.json');
  if (!existsSync(dbPath)) {
    const template = app.isPackaged
      ? path.join(process.resourcesPath, 'db.template.json')
      : path.join(__dirname, '..', 'db.json');
    if (existsSync(template)) {
      copyFileSync(template, dbPath);
    } else {
      writeFileSync(dbPath, JSON.stringify({
        anime_path: '',
        player_path: '',
        animes: []
      }, null, 2));
    }
  }
  return dbPath;
}

async function startServer(dbPath) {
  const { createApp } = await import('../server/app.js');
  const expressApp = createApp(dbPath);

  return new Promise((resolve, reject) => {
    httpServer = expressApp.listen(PORT, '127.0.0.1', () => {
      console.log(`[server] running at http://localhost:${PORT}`);
      resolve();
    });
    httpServer.on('error', reject);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Anime Manager',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('dialog:openCover', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择封面图片',
    filters: [{ name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

app.whenReady().then(async () => {
  try {
    const dbPath = getDbPath();
    await startServer(dbPath);
    createWindow();
  } catch (err) {
    console.error('Failed to start:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (httpServer) { httpServer.close(); httpServer = null; }
  app.quit();
});

app.on('before-quit', () => {
  if (httpServer) { httpServer.close(); httpServer = null; }
});

app.on('activate', () => {
  if (mainWindow === null && httpServer) createWindow();
});
