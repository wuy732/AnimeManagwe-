# Anime Manager

本地动漫资源管理器 — 扫描本地文件夹，自动刮削 Bangumi 元数据，海报墙浏览，在线/本地播放。

## 分支

| 分支  | 定位  | 播放方式 | 打包  |
| --- | --- | --- | --- |
| `feat/web-stream` | 在线刮削 + 网页播放 | 浏览器 HTML5 播放器（支持 MKV 流） | pkg → `anime-manager-web.exe` (~44MB，单文件) |
| `feat/local-player` | 纯离线 + 本地播放 | 调用系统播放器（VLC/PotPlayer/MPC/mpv） | Electron → 绿色免安装目录 (~200MB) |

## 快速开始

```bash
git checkout feat/web-stream   # 或 feat/local-player

npm run install:all            # 安装所有依赖
npm run dev                    # 启动开发环境（前后端热重载）
```

- 前端: `http://localhost:5173`
- 后端: `http://localhost:3001`

## 功能

### 核心

- 扫描本地文件夹（支持二级目录），自动识别 mp4/mkv/avi
- 自动识别封面图（cover/poster/folder/front + jpg/png）
- 手动标签管理、已看标记、播放进度追踪
- 本地 txt 文件自动解析为备注
- 深色主题海报墙 + 搜索过滤

### `feat/web-stream` 额外特性

- Bangumi API 自动刮削（封面/简介/评分/标签），支持重新刮削
- 网页 HTML5 视频播放器 + HTTP Range 流传输（拖进度条）
- 暂停/关闭自动保存进度，下次打开提示续播
- 局域网共享（`0.0.0.0` 监听，前端显示局域网 IP）
- 双击 exe 自动打开浏览器，端口被占用自动杀旧进程
- pkg 单文件打包（~44MB），复制即用

### `feat/local-player` 额外特性

- 纯离线，零网络请求
- 网页点击 → 调用本地专业播放器（VLC/PotPlayer/MPC-HC/MPC-BE/mpv）秒开 MKV/4K
- 首次配置自动检测系统已安装播放器
- Electron 桌面壳：独立窗口，无需浏览器
- electron-builder 绿色打包，解压即用
- 手动更换封面（Electron 原生文件对话框）

## 生产构建

### web-stream（单文件 exe）

```bash
npm run build:exe
# → release/anime-manager-web.exe
```

### local-player（Electron 桌面应用）

```bash
npm run build && npx electron-builder --win dir --x64
# → release/win-unpacked/  （整个目录打包为 zip 分发）
```

## 技术栈

- 后端: Node.js + Express
- 前端: React (Vite) + Tailwind CSS
- 数据: db.json 轻量文件数据库
- 刮削: Bangumi API v0
- 桌面: Electron / pkg

## 项目结构

```
├── server/                 # Express 后端
│   ├── index.js            # 入口
│   ├── app.js              # Express app 工厂（Electron 集成用）
│   ├── routes/             # 路由
│   │   ├── settings.js     # 路径配置
│   │   ├── scanner.js      # 扫描 + 刮削
│   │   ├── anime.js        # 动漫 CRUD
│   │   ├── stream.js       # 视频流（web-stream）
│   │   └── player.js       # 本地播放器调用（local-player）
│   └── services/
│       ├── scanner.js      # 文件夹扫描
│       ├── scraper.js      # Bangumi API
│       └── player.js       # 播放器检测与启动
├── client/                 # React 前端
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       └── components/     # UI 组件
├── electron/               # Electron 主进程（local-player）
├── db.json                 # 数据库
└── package.json
```
