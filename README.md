# 🤖 AI 编程实验室 — 自动化内容体系

> 用 AI 自动生成技术教程、构建网站、打包信息产品。

## 快速开始

### 1️⃣ 配置

编辑 `config.json`，主要设置：

- **API Key**: 填入 DeepSeek API Key（推荐）或使用本地 Ollama
- **网址**: 你的 GitHub Pages 地址
- **输出频率**: 每天自动生成的文章数量

### 2️⃣ 一键运行

```bash
# 完整流程：生成内容 → 建站 → 打包产品 → 部署
node scripts/run-all.js

# 只生成内容
node scripts/run-all.js --generate-only

# 只构建网站
node scripts/run-all.js --build-only

# 只部署
node scripts/run-all.js --deploy-only
```

### 3️⃣ 单独使用

```bash
# 生成2篇文章
node scripts/generate-content.js --count 2

# 构建网站
node scripts/build-site.js

# 生成信息产品
node scripts/generate-product.js

# 部署到 GitHub Pages
node scripts/deploy.js
```

## 信息产品

运行 `generate-product.js` 后，在 `content/products/` 目录生成教程合集 (.md 格式)。

**上架步骤：**
1. 用 [md-to-pdf](https://www.npmjs.com/package/md-to-pdf) 或 Pandoc 转 PDF
2. 到 Gumroad / 爱发电 / 淘宝上架
3. 设置自动发货

```bash
# 将电子书转 PDF（需安装 md-to-pdf）
npx md-to-pdf content/products/*.md
```

## 自动化部署

### GitHub Pages 设置

1. 在 GitHub 新建一个仓库
2. 复制仓库 URL 到 `config.json` 的 `deploy.repoUrl`
3. 运行 `node scripts/deploy.js`
4. 在 GitHub 仓库 Settings → Pages 设置：
   - Source: **Deploy from a branch**
   - Branch: `gh-pages` → `/ (root)`

## 付费内容方案 (方案二)

文章数量积累到一定程度后：

1. **电子书合集** — 按主题打包，9.9~29.9 元
2. **付费专栏** — 持续更新的付费内容
3. **会员制** — 每月付费获取所有内容
4. **代码模板** — 实战项目源码、工具脚本

## 目录结构

```
autopilot-content/
├── config.json              # 配置文件
├── scripts/
│   ├── generate-content.js  # 内容生成器
│   ├── build-site.js        # 网站构建器
│   ├── generate-product.js  # 信息产品生成器
│   ├── deploy.js            # GitHub Pages 部署
│   └── run-all.js           # 一键运行
├── content/
│   ├── posts/               # 生成的文章 (markdown)
│   └── products/            # 生成的信息产品 (markdown)
├── site/                    # 构建的静态网站
├── templates/               # 模板文件
└── assets/                  # 样式资源
```
