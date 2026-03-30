# GitHub CI/CD 完整教程

> 基于 Vue 3 + Vite 项目的 GitHub Actions + GitHub Pages 部署指南

---

## 📚 目录

1. [什么是 CI/CD](#什么是-cicd)
2. [准备工作](#准备工作)
3. [创建配置文件](#创建配置文件)
4. [GitHub 设置](#github-设置)
5. [部署与验证](#部署与验证)
6. [日常使用](#日常使用)
7. [常见问题](#常见问题)

---

## 什么是 CI/CD

### CI (Continuous Integration) 持续集成
每次代码提交后，自动进行：
- 代码检查 (Lint)
- 单元测试 (Test)
- 项目构建 (Build)

### CD (Continuous Deployment) 持续部署
构建成功后，自动部署到生产环境

```
┌─────────────────────────────────────────────────────────────┐
│                        本地开发                              │
│                   修改代码 → git push                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              GitHub Actions 工作流自动触发                    │
├─────────────────────────────────────────────────────────────┤
│  🔧 CI (持续集成)                                           │
│  ├── 📥 检出代码                                           │
│  ├── 📦 安装依赖 (npm ci)                                  │
│  ├── 🔍 代码检查 (lint)                                    │
│  ├── 🧪 运行测试 (test)                                    │
│  ├── 🏗️ 构建项目 (npm run build)                          │
│  └── 📤 上传构建产物                                        │
├─────────────────────────────────────────────────────────────┤
│  🚀 CD (持续部署)                                          │
│  └── 部署到 GitHub Pages                                   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              ✅ 网站自动更新，立即可访问                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 准备工作

### 1. 创建 GitHub 仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 **+** → **New repository**
3. 填写仓库信息：
   - **Repository name**：例如 `my-vue-app`
   - 设为 **Public**（GitHub Pages 免费版需要）
   - 不要勾选 "Add a README file"
4. 点击 **Create repository**

### 2. 本地项目初始化 Git

```bash
# 进入项目目录
cd /path/to/your/project

# 初始化 Git
git init

# 添加所有文件
git add .

# 创建首次提交
git commit -m "feat: 初始化项目"

# 添加远程仓库（替换为您的地址）
git remote add origin https://github.com/[用户名]/[仓库名].git

# 重命名分支为 main
git branch -M main

# 推送代码
git push -u origin main
```

---

## 创建配置文件

### 目录结构

```
your-project/
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD 工作流配置
├── src/                     # 源代码
├── package.json
├── vite.config.js           # 需要配置 base 路径
└── ...
```

### 1. 创建工作流文件

创建 `.github/workflows/deploy.yml`：

```yaml
# GitHub Actions CI/CD 工作流配置
# 功能：自动构建并部署 Vue 项目到 GitHub Pages

# 触发条件
on:
  # 当代码推送到 main 分支时自动触发
  push:
    branches: [ main ]
  # 允许在 GitHub 网页上手动触发工作流
  workflow_dispatch:

# 设置必要的权限
permissions:
  contents: read      # 读取代码内容
  pages: write        # 写入 GitHub Pages
  id-token: write     # 用于 OIDC 认证

# 并发控制：避免同时运行多个部署任务
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  # 任务1：构建项目
  build:
    name: 构建项目
    runs-on: ubuntu-latest

    # 如果项目在子目录中，设置工作目录
    defaults:
      run:
        working-directory: ./frontend

    steps:
      # 步骤1：检出代码
      - name: 📥 检出代码
        uses: actions/checkout@v4

      # 步骤2：设置 Node.js 环境
      - name: 🔧 配置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          # 如果项目在子目录，指定锁文件路径
          cache-dependency-path: ./frontend/package-lock.json

      # 步骤3：安装项目依赖
      - name: 📦 安装依赖
        run: npm ci

      # 步骤4：运行代码检查（如果有配置）
      - name: 🔍 代码检查
        run: npm run lint --if-present

      # 步骤5：运行测试（如果有配置）
      - name: 🧪 运行测试
        run: npm run test --if-present

      # 步骤6：构建生产版本
      - name: 🏗️ 构建项目
        run: npm run build

      # 步骤7：上传构建产物
      - name: 📤 上传构建产物
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./frontend/dist

  # 任务2：部署到 GitHub Pages
  deploy:
    name: 部署到 GitHub Pages
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build  # 依赖 build 任务成功完成

    steps:
      # 步骤8：部署
      - name: 🚀 部署
        id: deployment
        uses: actions/deploy-pages@v4
```

### 2. 配置 Vite 路径

修改 `vite.config.js`，添加 `base` 配置：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  // GitHub Pages 路径配置
  base: process.env.NODE_ENV === 'production'
    ? '/[仓库名]/'  // 替换为您的仓库名，如 '/my-vue-app/'
    : '/',
})
```

**重要说明**：
- 如果仓库名是 `username.github.io`（个人主页），使用 `base: '/'`
- 如果仓库名是 `my-vue-app`，使用 `base: '/my-vue-app/'`

### 3. 添加 Lint 和 Test 脚本（可选）

在 `package.json` 中添加：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "echo \"代码检查通过\"",
    "test": "echo \"测试通过\""
  }
}
```

---

## GitHub 设置

### 配置 GitHub Pages

1. 打开仓库的 **Settings**（设置）
2. 左侧菜单找到 **Pages**
3. 在 **Build and deployment** 部分：
   - **Source** 选择：`GitHub Actions`
4. 保存后显示：`GitHub Actions is the current source`

![GitHub Pages 设置示意图](https://docs.github.com/assets/cb-47661/mw-1440/images/help/pages/publishing-source-drop-down.png)

---

## 部署与验证

### 1. 推送代码

```bash
git add .
git commit -m "feat: 添加 CI/CD 配置"
git push
```

### 2. 查看运行状态

访问仓库的 **Actions** 标签页：
```
https://github.com/[用户名]/[仓库名]/actions
```

您会看到：
- 📥 🔧 📦 🔍 🧪 🏗️ 📤 **构建项目**
- 🚀 **部署到 GitHub Pages**

等待约 1-2 分钟，状态变为绿色 ✓

### 3. 访问部署的网站

```
https://[用户名].github.io/[仓库名]/
```

例如：
```
https://zxyfanta.github.io/cicd/
```

---

## 日常使用

### 修改代码后的流程

```bash
# 1. 修改代码
# ...

# 2. 提交更改
git add .
git commit -m "feat: 新功能描述"

# 3. 推送到 GitHub
git push

# 4. CI/CD 自动运行，网站自动更新！
```

### 手动触发部署

如果需要手动触发工作流：

1. 访问 **Actions** 标签页
2. 选择 **构建项目** 工作流
3. 点击 **Run workflow** → **Run workflow**

---

## 常见问题

### Q1: 网站显示 404

**解决方案**：
1. 检查 `vite.config.js` 的 `base` 是否与仓库名一致
2. 确认仓库是 Public 的
3. 确认 GitHub Pages 的 Source 是 `GitHub Actions`

### Q2: Actions 运行失败

**解决方案**：
1. 点击红色 ❌ 查看详细日志
2. 常见原因：
   - 依赖安装失败 → 检查 `package.json`
   - 构建失败 → 本地运行 `npm run build` 测试
   - 路径错误 → 检查 `working-directory` 配置

### Q3: 样式丢失，页面空白

**解决方案**：
检查 `vite.config.js` 的 `base` 配置是否正确。

### Q4: 更新后网站没有变化

**解决方案**：
1. 等待 1-2 分钟让部署完成
2. 清除浏览器缓存（Ctrl+Shift+R / Cmd+Shift+R）
3. 检查 Actions 是否成功运行

### Q5: `.github/workflows` 不生效

**解决方案**：
确保 `.github` 目录在仓库根目录，而不是在子目录中。

---

## 📝 工作流配置详解

### 关键字段说明

| 字段 | 说明 |
|------|------|
| `on.push.branches` | 触发工作流的分支 |
| `permissions` | 工作流需要的权限 |
| `runs-on` | 运行环境（ubuntu-latest 最新版 Ubuntu） |
| `needs` | 任务依赖关系 |
| `--if-present` | 命令存在才执行，避免失败 |

### 常用 Action 版本

| Action | 版本 | 用途 |
|--------|------|------|
| `actions/checkout@v4` | v4 | 检出代码 |
| `actions/setup-node@v4` | v4 | 配置 Node.js |
| `actions/upload-pages-artifact@v3` | v3 | 上传构建产物 |
| `actions/deploy-pages@v4` | v4 | 部署到 Pages |

---

## 🎓 扩展学习

### 添加环境变量

```yaml
- name: 🏗️ 构建项目
  run: npm run build
  env:
    VITE_API_URL: ${{ secrets.API_URL }}
```

### 多环境部署

```yaml
on:
  push:
    branches:
      - main      # 生产环境
      - develop   # 测试环境
```

### 定时任务

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # 每天零点运行
```

---

## 📖 参考资料

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html#github-pages)

---

**文档版本**：v1.0
**更新日期**：2026-03-30
**适用项目**：Vue 3 + Vite + GitHub Pages
