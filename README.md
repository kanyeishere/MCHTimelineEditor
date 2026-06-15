# FF14 机工士 PVE 技能时间轴模拟器

这是一个无外部运行时依赖的静态网页应用。入口文件是 `index.html`，交互逻辑在 `app.js`，样式在 `styles.css`；`npm run build` 会把这些文件复制到 `dist/`，供 GitHub Pages 发布。

## 本地预览

```bash
npm start
```

然后打开 <http://localhost:5173>。

## 部署到 GitHub Pages（推荐：GitHub Actions）

仓库已经包含 `.github/workflows/pages.yml`，每次推送到 `main` 分支时会自动构建并发布 `dist/` 到 GitHub Pages。

第一次启用时需要在 GitHub 仓库页面做一次设置：

1. 打开仓库的 **Settings**。
2. 左侧进入 **Pages**。
3. 在 **Build and deployment** 里，把 **Source** 选择为 **GitHub Actions**。
4. 确认默认分支名是 `main`；如果你的默认分支不是 `main`，请同步修改 `.github/workflows/pages.yml` 中的 `branches: [main]`。
5. 推送代码到 GitHub：

```bash
git push origin main
```

6. 到仓库的 **Actions** 页面等待 `Deploy static site to GitHub Pages` 工作流完成。
7. 部署成功后，访问地址通常是：

```text
https://<你的用户名>.github.io/<仓库名>/
```

例如仓库名是 `MCHTimelineEditor`，地址通常类似：

```text
https://<你的用户名>.github.io/MCHTimelineEditor/
```

## 备用部署方式：直接从分支发布

因为本项目根目录本身就是静态站点，你也可以不用 Actions：

1. 打开 **Settings → Pages**。
2. **Source** 选择 **Deploy from a branch**。
3. **Branch** 选择 `main`，目录选择 `/root`。
4. 保存后等待 GitHub Pages 发布。

如果使用这种方式，GitHub 会直接发布根目录的 `index.html`、`app.js`、`styles.css`。
