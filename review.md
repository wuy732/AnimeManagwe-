# Code Review: 两个独立版本的代码审查

**审查日期**: 2026-06-15
**分支**: `feat/web-stream` + `feat/local-player`（两个独立产品线，共同基础来自 `main`）
**审查范围**: server 路由/服务、client 组件、Electron 主进程、配置

---

## 一、「公开」/「隐藏」功能专项审查（重点）

两个分支都存在"公开/隐藏"按钮，用于控制在局域网模式下某个动漫是否对外可见。以下是对该功能的完整审查。

### 功能架构

```
[server] db.public_mode (全局开关)
[server] anime.public (每个动漫的可见性, 默认 true)
[server] GET /api/animes?public_only=true → 过滤非公开动漫
[client] AnimeDetail 中每个动漫的 公开/隐藏 切换按钮
```

### 🔴 关键问题

#### 1. 权限过滤形同虚设 — 客户端驱动过滤参数（两个分支）

```js
// server/routes/anime.js:19
if (db.public_mode && req.query.public_only === 'true') {
  list = list.filter(a => a.public !== false);
}
```

过滤依赖客户端传入 `public_only=true`。任何人直接用浏览器或 curl 访问 `GET /api/animes`（不带参数）就能看到全部动漫。这不是服务端权限控制，而是"请求方自愿遵守的约定"。

**影响**: 局域网内任意用户可通过直接调用 API 绕过隐藏设置。

#### 2. 前端从不传递 `public_only=true`（web-stream）

```js
// client/src/api.js:42-45 — 没有任何过滤参数
export async function getAnimes() {
  const res = await fetch(`${BASE}/animes`);
  return res.json();
}
```

`getAnimes()` 从不传递 `public_only=true`。即使在服务器端开启了 `public_mode`，前端的 AnimeGrid 和"继续观看"列表依然显示全部动漫。**整个过滤机制在当前客户端代码中完全无效。**

#### 3. 无 `public_mode` 全局开关 UI（两个分支）

服务器 `GET /api/settings` 返回 `{ anime_path, proxy, public_mode }`，但前端:

- `App.jsx` 只解构 `anime_path`，丢弃 `public_mode`
- `SetupWizard` 只有路径输入，没有 `public_mode` 开关
- `api.js` 的 `updateSettings()` 只发送 `{ anime_path }`，无法修改 `public_mode`

除非用户手动编辑 `db.json` 设置 `"public_mode": true`，否则该功能永远不生效。

#### 4. web-stream: 切换按钮绕过全局 `save()` 函数（`AnimeDetail.jsx:160-165`）

```jsx
// 公开/隐藏按钮 — 直接调用 updateAnime + 手动 onUpdate
<button onClick={async () => {
  const next = !isPublic
  setIsPublic(next)
  try { 
    await updateAnime(anime.id, { public: next }); 
    onUpdate({ ...anime, public: next })  // ⚠️ 浅拷贝 props
  }
  catch { setIsPublic(!next) }
}}>
```

与 tag/episode 的保存模式不一致：

- **无 loading 状态**: tags 修改走 `save()` 函数（有 `saving` 状态和错误展示），但 public 切换没有任何加载指示
- **浅拷贝传播**: `{ ...anime, public: next }` 使用的是来自 props 的 `anime` 对象，而非本地的 `tags`/`episodes` 状态。如果同时修改了标签并切换公开/隐藏，可能丢失数据
- **乐观更新风险**: catch 块中 `setIsPublic(!next)` 恢复 UI，但如果 API 请求已发送而响应延迟，UI 会闪烁

#### 5. local-player: 服务器端完全无过滤逻辑

```js
// feat/local-player: server/routes/anime.js — GET /api/animes
router.get('/', (_req, res) => {
  const db = readDB();
  res.json(db.animes || []);  // 无任何过滤
});
```

local-player 的 `anime.js` 路由中根本没有 `public_mode` 检查。设置路由也不返回/接收 `public_mode`。该分支的公开/隐藏按钮是**纯装饰性的** — 切换按钮改变 `anime.public` 字段但任何地方都不读取它来做过滤。

#### 6. 按钮文案表意不清 — 描述当前状态而非动作

```jsx
{isPublic ? '公开' : '隐藏'}
```

按钮显示的是**当前状态**而非**将要执行的动作**。用户在按钮上看到"公开"时，点击后动漫变为隐藏 — 这违反按钮文案表达"点击后会发生什么"的通用习惯。应该显示"点击隐藏"或使用切换开关（toggle switch）UI。

#### 7. `mergeAnimes` 中 public 保留逻辑有边界情况（两个分支）

```js
// server/routes/scanner.js:31
if (old.public !== undefined) anime.public = old.public;
```

逻辑正确：如果旧数据有 `public` 字段则保留，否则使用扫描默认值 `true`。但对于从旧版本迁移的 db.json（anime 对象无 `public` 字段），首次扫描后所有动漫都变为 `public: true` — 这可能是期望行为，但没有任何日志或迁移提示。

---

## 二、feat/web-stream（在线版：刮削 + 网页播放 + pkg 打包）

### 🔴 Bugs

#### 8. `downloadCover` 重定向时返回空文件 (`server/services/scanner.js:117-121`)

`createWriteStream(dest)` 立即创建空文件。HTTP 3xx 重定向时 `file.close()` 关闭了文件句柄但不删除文件，递归调用中 `existsSync(dest) === true` 直接返回空文件路径。

**建议**: 重定向前删除已创建的空文件，或在确认 200 响应后再创建写入流。

#### 9. `mergeAnimes` 覆盖用户自定义封面 (`server/routes/scanner.js:32`)

`if (old.cover && !anime.cover) anime.cover = old.cover` — 只在扫描未找到封面时保留旧封面。一旦扫描到任何封面文件，用户手动设置的 cover 就丢失了。

**建议**: 恢复或改为 `if (old.cover && old.cover !== anime.cover) anime.cover = old.cover;`

#### 10. `PATCH /api/animes/:id` 竞态条件 (`server/routes/anime.js:32-57`)

读→改→写整个 db.json，非原子。视频播放器暂停保存进度与详情页切换已看状态可同时触发，后者会覆盖前者。

#### 11. `doScan()` / `pollScrape()` 定时器泄漏 (`client/src/App.jsx:57-64, 72-85`)

`setInterval` 在组件卸载时未清理。用户导航到详情页后，定时器继续轮询并更新已卸载组件的 state。

#### 12. 进度条硬编码 24 分钟 (`client/src/components/AnimeDetail.jsx:284`)

```js
style={{ width: `${Math.min((ep.progress / 1440) * 100, 100)}%` }}
```

当前代码已改为 1800 秒（30 分钟），仍然假设所有剧集相同长度。对剧场版、OVA、特别篇完全错误。

#### 13. `cleanName` 正则过于激进 (`server/services/scraper.js:12-19`)

Season 检测 `[-–]\s*(S\d+|Season\s*\d|第[一二三四五六七八九十\d]+季)` 会误匹配标题中合法的破折号。罗马数字过滤 `[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+` 会删除日文标题中合法的罗马数字序列号。

#### 14. 批量刮削路由未向客户端返回错误 (`server/routes/scanner.js:77, 105`)

catch 块只 `console.error`，客户端收到 `{ message: '刮削已启动' }` 后轮询等待，如果刮削全部失败则永远不知道。

### 🟡 安全

#### 15. 任意文件读取 (`server/index.js:61-65`, `server/routes/stream.js:15-18`)

`/api/cover?path=...` 和 `/api/stream?path=...` 无路径校验，服务绑定 `0.0.0.0`（所有接口），局域网内任意设备可读取主机任意文件。

#### 16. 自动终止占用端口进程无确认 (`server/index.js:89-98`)

`killPortProcess()` 用 `Stop-Process -Force` 直接杀进程，如果用户其他应用占用 3001 端口会被静默终止。

### 🟠 代码质量

#### 17. `readDB`/`writeDB` 在三个路由文件中重复定义

#### 18. `scrapeAll` DB 读写模式混乱 — 内部 readDB/writeDB，但单集刮削路由直接写

#### 19. `downloadCover` 缺少响应流错误处理 — 只监听 `file.on('error')`，不监听 `res.on('error')`

#### 20. `var server` 变量提升 (`server/index.js:117`) — ESM 下用 `var` 易造成混淆

#### 21. `__dirname` ESM/CJS 兼容检查冗余 (`server/index.js:13-14`) — `type: module` 下 `__dirname` 永远不存在

#### 22. `AnimeCard` 丢弃用户标签展示 — 详情页才能看到个人标签

#### 23. db.json 含真实用户数据被提交

#### 24. `scraper.js` 新增 `setDbPath` 和 proxy 支持但缺乏类型/错误文档

### 🟢 小问题

25. `server/dist-bundle/server.cjs` 被 Git 跟踪但 `.gitignore` 未包含
26. `searchBangumi` 使用 POST 搜索（非幂等），GET 更合适
27. `cleanName` 重构后仍存在边界情况：season 正则 `[-–]` 在某些 Unicode 文件名中可能误匹配

---

## 三、feat/local-player（离线版：本地播放器 + Electron 桌面壳）

### 🔴 Bugs

#### 28. 公开/隐藏功能完全无效（见第一章第 5 条）

#### 29. `POST /api/play` 无超时/错误反馈 (`server/services/player.js:40-50`)

`execFile` 以 `detached: true` 启动后立即 `resolve()`。播放器启动失败时，API 返回成功但实际什么都没播放。

#### 30. 播放后不自动标记已看 (`client/src/components/AnimeDetail.jsx`)

点击播放后仅显示"已在 X 中打开"，不更新 watched/progress。用户需要看完后手动点已看按钮。

#### 31. `coverPath` state 与 prop 不同步 (`client/src/components/AnimeDetail.jsx:54`)

```js
const [coverPath, setCoverPath] = useState(anime.cover || '')
```

如果父组件通过 `onUpdate` 更新了 `anime.cover`，`coverPath` state 不会自动更新（useState 只在初始化时取 prop 值）。

#### 32. Electron `httpServer` 关闭未 await (`electron/main.js:89-95`)

`httpServer.close()` 是异步的，但未 await 就 `app.quit()`，端口可能未完全释放。

#### 33. 开发模式下 db.json 模板路径复用项目数据 (`electron/main.js:19-21`)

非打包模式下直接复制项目根 `db.json`（含真实数据）作为模板，可能导致数据泄露。

### 🟡 安全

#### 34. 任意文件读取 via `/api/cover` (`server/app.js:22-25`)

同 web-stream 分支。`/api/play` 同样接受任意路径，如果 db.json 被篡改则风险更大。

#### 35. `127.0.0.1` vs `0.0.0.0` 绑定不一致

`server/index.js` 绑定 `127.0.0.1`，但 `app.js` 不主动设置（默认所有接口）。Electron 模式下由 main.js 指定 `127.0.0.1`，但独立启动 `node server/index.js` 时行为取决于调用的入口。

### 🟠 代码质量

#### 36. `detectPlayer` 仅硬编码 Windows 路径

#### 37. `electron-builder` 配置中 `files: ["node_modules/**/*"]` 过于宽泛，打包体积 ~200MB

#### 38. `SetupWizard` 无法在已配置后修改播放器路径

#### 39. `playFile` 中 try/catch 不捕获 `execFile` 错误 — 回调错误不抛出同步异常

#### 40. `save()` 函数签名字符串拼接式参数 — `save(newEpisodes, newTags, newCover, newPublic)` 调用时需传 `null` 占位

### 🟢 小问题

41. 切换按钮在 local-player 中通过 `save()` 传递 `newPublic` 参数，比 web-stream 的内联写法更一致，但 `save()` 的第 4 个位置的参数位置不够清晰

---

## 四、总结

### 按严重度统计

| 严重度    | web-stream | local-player | 共享/通用 |
| ------ | ---------- | ------------ | ----- |
| 🔴 Bug | 7          | 6            | 3     |
| 🟡 安全  | 2          | 2            | 1     |
| 🟠 质量  | 8          | 5            | 3     |
| 🟢 小问题 | 3          | 1            | —     |

### 公开/隐藏功能缺陷汇总

| #   | 问题                          | web-stream | local-player            |
| --- | --------------------------- |:----------:|:-----------------------:|
| 1   | 权限过滤由客户端参数控制，可绕过            | ✅          | N/A（无过滤）                |
| 2   | 前端从不传递 `public_only=true`   | ✅          | N/A                     |
| 3   | 无 `public_mode` 全局开关 UI     | ✅          | ✅                       |
| 4   | 切换按钮绕过 `save()`，无 loading   | ✅          | ❌（local-player 已走 save） |
| 5   | 服务器端完全无过滤逻辑                 | ❌          | ✅                       |
| 6   | 按钮文案描述状态而非动作                | ✅          | ✅                       |
| 7   | mergeAnimes 保留 public 无迁移日志 | ✅          | ✅                       |

### 优先修复建议

1. **最高优先级**: 将 `public_only` 改为服务端强制过滤 — 当 `public_mode` 开启时，未认证请求默认只返回 `public !== false` 的动漫，而非依赖客户端传参
2. **高优先级**: 添加 `public_mode` 全局开关的前端 UI
3. **高优先级**: 修复 local-player 中完全缺失的服务器端过滤
4. **中优先级**: 统一公开/隐藏按钮的保存模式（走 `save()` 函数）、添加 loading 状态
5. **中优先级**: 修复按钮文案（改为"设为隐藏"/"设为公开"或使用 Toggle 组件）
