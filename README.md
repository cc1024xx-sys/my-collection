# 我的攻略

移动优先的攻略记录 PWA：在浏览器中记录标题、步骤、图片、链接和分类标签，数据保存在本机 IndexedDB。

## 功能

- 新建 / 编辑 / 删除攻略
- 多步骤、多图片、多链接、多标签
- 按标签筛选列表
- 图片自动压缩后本地存储
- 可添加到手机主屏幕（PWA）
- 导出 / 导入 JSON 备份（含图片）

## 开发

```bash
npm install
npm run dev
```

手机调试：电脑与手机同一 WiFi，用手机浏览器访问终端里显示的局域网地址（如 `http://192.168.x.x:5173`）。

## 构建与预览

```bash
npm run build
npm run preview
```

本地开发地址为 `http://localhost:5173/my-collection/`（与 GitHub Pages 路径一致）。

## GitHub Pages 部署

1. 在 GitHub 创建仓库，名称须为 **`my-collection`**（与 `vite.config.ts` 中的 `base` 一致）
2. 推送代码到 `main` 或 `master` 分支
3. 仓库 **Settings → Pages → Build and deployment**：
   - Source 选择 **GitHub Actions**
4. 等待 Actions 工作流完成后，访问：

   **`https://<你的用户名>.github.io/my-collection/`**

若仓库名不是 `my-collection`，需同步修改 `vite.config.ts` 里的 `base` 为 `/<仓库名>/`。

### 首次推送示例

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<你的用户名>/my-collection.git
git push -u origin main
```

## 添加到主屏幕

- **iOS Safari**：分享 →「添加到主屏幕」
- **Android Chrome**：菜单 →「安装应用」或「添加到主屏幕」

## 技术栈

- React + TypeScript + Vite
- Dexie (IndexedDB)
- react-router-dom
- vite-plugin-pwa

## 说明

数据仅保存在当前浏览器的 IndexedDB 中。首页右上角「备份」可导出 JSON；换设备或清缓存前请先导出，再在新环境导入。电脑与手机数据不互通，需通过备份文件迁移。
