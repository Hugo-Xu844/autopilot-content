/**
 * build-site.js — 从 Markdown 文章生成静态网站
 * 
 * 用法: node scripts/build-site.js
 */

const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8'));
const POSTS_DIR = path.join(__dirname, '..', config.content.outputDir);
const SITE_DIR = path.join(__dirname, '..', 'site');
const PRODUCTS_DIR = path.join(__dirname, '..', config.products.outputDir);

// ---- 解析 Markdown 前置元数据 ----

function parsePost(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontmatter = {};
  let body = content;

  if (content.startsWith('---')) {
    const end = content.indexOf('---', 3);
    if (end > 0) {
      const fm = content.slice(3, end).trim();
      fm.split('\n').forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          let key = line.slice(0, colonIdx).trim();
          let val = line.slice(colonIdx + 1).trim().replace(/^"|"$/g, '');
          
          // 处理数组: [1, 2, 3]
          if (val.startsWith('[') && val.endsWith(']')) {
            try {
              val = JSON.parse(val);
            } catch (e) {
              val = val.slice(1, -1).split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            }
          }
          
          frontmatter[key] = val;
        }
      });
      body = content.slice(end + 3).trim();
    }
  }

  return { frontmatter, body };
}

function getAllPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  
  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse();
  
  return files.map(file => {
    const fullPath = path.join(POSTS_DIR, file);
    const { frontmatter, body } = parsePost(fullPath);
    return {
      slug: file.replace('.md', ''),
      file,
      fullPath,
      frontmatter,
      body,
      excerpt: body.replace(/```[\s\S]*?```/g, '').replace(/[#*`>\-\[\]\(\)]/g, '').slice(0, 200).trim() + '...'
    };
  }).filter(p => p.frontmatter.draft !== true);
}

// ---- Markdown to HTML（简易转换） ----

function mdToHtml(md) {
  let html = md;
  
  // 代码块 (先处理，避免内部被其他规则影响)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre><code class="language-${lang}">${escaped}</code></pre>`;
  });
  
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 标题
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // 粗体和斜体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // 无序列表
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // 有序列表
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // 段落
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  // 清理空的p标签
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p><\/p>/g, '');
  
  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  return html;
}

// ---- 生成页面 ----

function buildPostPage(post) {
  const date = post.frontmatter.date || '';
  const tags = Array.isArray(post.frontmatter.tags) ? post.frontmatter.tags : [];
  const category = post.frontmatter.category || '';
  const description = post.frontmatter.description || '';
  const title = post.frontmatter.title || post.slug;
  
  const contentHtml = mdToHtml(post.body);
  const tagHtml = tags.map(t => `<span class="tag">${t}</span>`).join(' ');
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${config.site.title}</title>
  <meta name="description" content="${description}">
  <link rel="stylesheet" href="../assets/style.css">
</head>
<body>
  <header class="header">
    <div class="container">
      <a href="../" class="logo">${config.site.title}</a>
      <nav>
        <a href="../">首页</a>
        <a href="../products.html">教程产品</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <article class="post-full">
      <header class="post-header">
        <h1>${title}</h1>
        <div class="post-meta">
          <span class="date">📅 ${date}</span>
          <span class="category">📂 ${category}</span>
          <div class="tags">${tagHtml}</div>
        </div>
      </header>
      <div class="post-content">
        ${contentHtml}
      </div>
    </article>
  </main>

  <footer class="footer">
    <div class="container">
      <p>${config.site.title} &copy; ${new Date().getFullYear()} | 用 ❤️ 和 AI 生成</p>
    </div>
  </footer>
</body>
</html>`;
}

function buildIndexPage(posts, pageNum = 1) {
  const perPage = 10;
  const totalPages = Math.ceil(posts.length / perPage);
  const start = (pageNum - 1) * perPage;
  const pagePosts = posts.slice(start, start + perPage);
  
  const postsHtml = pagePosts.map(post => {
    const date = post.frontmatter.date || '';
    const category = post.frontmatter.category || '';
    const tags = Array.isArray(post.frontmatter.tags) ? post.frontmatter.tags : [];
    const tagHtml = tags.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join(' ');
    
    return `
    <article class="post-card">
      <h2><a href="../posts/${post.slug}.html">${post.frontmatter.title || post.slug}</a></h2>
      <div class="post-meta">
        <span class="date">📅 ${date}</span>
        <span class="category">📂 ${category}</span>
        ${tagHtml}
      </div>
      <p class="excerpt">${post.excerpt}</p>
      <a href="posts/${post.slug}.html" class="read-more">继续阅读 →</a>
    </article>`;
  }).join('\n');

  // 分页
  let pagination = '';
  if (totalPages > 1) {
    pagination = '<div class="pagination">';
    if (pageNum > 1) {
      pagination += `<a href="index${pageNum > 2 ? pageNum - 1 : ''}.html" class="page-link">← 上一页</a>`;
    }
    for (let i = 1; i <= totalPages; i++) {
      const active = i === pageNum ? ' class="active"' : '';
      pagination += `<a href="index${i === 1 ? '' : i}.html"${active}>${i}</a>`;
    }
    if (pageNum < totalPages) {
      pagination += `<a href="index${pageNum + 1}.html" class="page-link">下一页 →</a>`;
    }
    pagination += '</div>';
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.site.title} - ${config.site.description}</title>
  <meta name="description" content="${config.site.description}">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <header class="header">
    <div class="container">
      <a href="." class="logo">${config.site.title}</a>
      <nav>
        <a href="." class="active">首页</a>
        <a href="products.html">教程产品</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <h1>${config.site.description}</h1>
      <p>每日更新 AI 教程、编程实战、工具评测 — 全部由 AI 自动生成。</p>
      <p class="post-count">目前已发布 ${posts.length} 篇文章</p>
    </section>

    <section class="posts-list">
      ${postsHtml}
    </section>

    ${pagination}
  </main>

  <footer class="footer">
    <div class="container">
      <p>${config.site.title} &copy; ${new Date().getFullYear()} | 用 ❤️ 和 AI 生成</p>
    </div>
  </footer>
  
  <!-- Adsense 占位 -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-你的广告ID"
     crossorigin="anonymous"></script>
</body>
</html>`;
}

function buildProductsPage() {
  const products = !fs.existsSync(PRODUCTS_DIR) ? [] : 
    fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.md')).map(f => {
      const { frontmatter, body } = parsePost(path.join(PRODUCTS_DIR, f));
      return { file: f, frontmatter, body };
    });

  const productsHtml = products.length > 0 ? products.map(p => {
    const title = p.frontmatter.title || p.file.replace('.md', '');
    const desc = p.frontmatter.description || '高质量技术教程';
    const price = p.frontmatter.price || '免费';
    
    return `
    <div class="product-card">
      <h3>${title}</h3>
      <p>${desc}</p>
      <p class="price">${price}</p>
    </div>`;
  }).join('\n') : '<p class="empty">教程产品即将上线，敬请期待...</p>';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>教程产品 - ${config.site.title}</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <header class="header">
    <div class="container">
      <a href="." class="logo">${config.site.title}</a>
      <nav>
        <a href=".">首页</a>
        <a href="products.html" class="active">教程产品</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <h1>📚 教程产品</h1>
    <p>精心整理的编程与AI教程合集，助你快速提升技能。</p>
    <div class="products-grid">
      ${productsHtml}
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <p>${config.site.title} &copy; ${new Date().getFullYear()}</p>
    </div>
  </footer>
</body>
</html>`;
}

// ---- 构建 ----

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function build() {
  console.log('🏗️  开始构建网站...\n');
  
  const posts = getAllPosts();
  console.log(`📄 找到 ${posts.length} 篇文章`);
  
  // 确保输出目录
  const outDir = SITE_DIR;
  ensureDir(outDir);
  ensureDir(path.join(outDir, 'posts'));
  ensureDir(path.join(outDir, 'categories'));
  ensureDir(path.join(outDir, 'assets'));
  
  // 生成每篇文章
  console.log('📝 生成文章页面...');
  for (const post of posts) {
    const html = buildPostPage(post);
    const dest = path.join(outDir, 'posts', `${post.slug}.html`);
    fs.writeFileSync(dest, html);
  }
  console.log(`   ✓ 生成了 ${posts.length} 个文章页面`);
  
  // 生成首页（分页）
  console.log('🏠 生成首页...');
  const perPage = 10;
  const totalPages = Math.ceil(posts.length / perPage);
  
  if (totalPages === 0) {
    // 没有文章时生成空白首页
    const emptyIndex = buildIndexPage([], 1);
    fs.writeFileSync(path.join(outDir, 'index.html'), emptyIndex);
  } else {
    for (let i = 1; i <= totalPages; i++) {
      const html = buildIndexPage(posts, i);
      const filename = i === 1 ? 'index.html' : `index${i}.html`;
      fs.writeFileSync(path.join(outDir, filename), html);
    }
  }
  
  const categoryPageHtml = buildCategoryPage(posts);
  fs.writeFileSync(path.join(outDir, 'categories.html'), categoryPageHtml);
  
  // 生成每个分类页
  console.log('📂 生成分类页面...');
  for (const cat of config.content.categories) {
    const catPosts = posts.filter(p => p.frontmatter.category === cat);
    if (catPosts.length === 0) continue;
    
    const html = buildCategoryListPage(cat, catPosts);
    const dest = path.join(outDir, 'categories', `${encodeURIComponent(cat)}.html`);
    fs.writeFileSync(dest, html);
  }
  
  // 生成产品页
  console.log('📚 生成产品页面...');
  fs.writeFileSync(path.join(outDir, 'products.html'), buildProductsPage());
  
  // 复制 CSS
  console.log('🎨 复制样式文件...');
  ensureDir(path.join(outDir, 'assets'));
  const stylePath = path.join(__dirname, '..', 'site', 'assets', 'style.css');
  if (!fs.existsSync(stylePath)) {
    fs.writeFileSync(stylePath, generateCSS());
  }
  
  console.log(`\n✅ 网站构建完成！`);
  console.log(`📁 输出目录: ${outDir}`);
  console.log(`🌐 打开 index.html 预览`);
}

function buildCategoryPage(posts) {
  const cats = config.content.categories.map(cat => {
    const count = posts.filter(p => p.frontmatter.category === cat).length;
    return `<a href="categories/${encodeURIComponent(cat)}.html" class="category-card">
      <h3>${cat}</h3>
      <span class="count">${count} 篇</span>
    </a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>分类 - ${config.site.title}</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <header class="header">
    <div class="container">
      <a href="." class="logo">${config.site.title}</a>
      <nav>
        <a href=".">首页</a>
        <a href="categories.html" class="active">分类</a>
        <a href="products.html">教程产品</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <h1>📂 文章分类</h1>
    <div class="categories-grid">
      ${cats}
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <p>${config.site.title} &copy; ${new Date().getFullYear()}</p>
    </div>
  </footer>
</body>
</html>`;
}

function buildCategoryListPage(category, posts) {
  const postsHtml = posts.map(post => {
    const date = post.frontmatter.date || '';
    return `
    <article class="post-card">
      <h2><a href="/posts/${post.slug}.html">${post.frontmatter.title || post.slug}</a></h2>
      <div class="post-meta">
        <span class="date">📅 ${date}</span>
      </div>
      <p class="excerpt">${post.excerpt}</p>
    </article>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${category} - ${config.site.title}</title>
  <link rel="stylesheet" href="../assets/style.css">
</head>
<body>
  <header class="header">
    <div class="container">
      <a href=".." class="logo">${config.site.title}</a>
      <nav>
        <a href="..">首页</a>
        <a href="../categories.html">分类</a>
        <a href="../products.html">教程产品</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <h1>📂 ${category}</h1>
    <p class="post-count">共 ${posts.length} 篇文章</p>
    <section class="posts-list">
      ${postsHtml}
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <p>${config.site.title} &copy; ${new Date().getFullYear()}</p>
    </div>
  </footer>
</body>
</html>`;
}

function generateCSS() {
  return `/* AI 编程实验室 - 网站样式 */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
  line-height: 1.7;
  color: #1a1a2e;
  background: #f8f9fa;
}

.container { max-width: 860px; margin: 0 auto; padding: 0 20px; }

/* 头部 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header .container { display: flex; align-items: center; justify-content: space-between; }
.logo { font-size: 1.3rem; font-weight: 700; color: #fff; text-decoration: none; }
.header nav a { color: rgba(255,255,255,0.85); text-decoration: none; margin-left: 24px; font-size: 0.95rem; }
.header nav a:hover, .header nav a.active { color: #fff; }
.header nav a.active { border-bottom: 2px solid #fff; padding-bottom: 2px; }

/* 英雄区域 */
.hero {
  text-align: center;
  padding: 60px 0 40px;
}
.hero h1 { font-size: 2rem; margin-bottom: 12px; }
.hero p { color: #666; font-size: 1.05rem; }
.post-count { margin-top: 8px; font-size: 0.9rem; color: #999; }

/* 文章卡片 */
.posts-list { margin-top: 10px; }
.post-card {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}
.post-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.post-card h2 { font-size: 1.3rem; margin-bottom: 10px; }
.post-card h2 a { color: #1a1a2e; text-decoration: none; }
.post-card h2 a:hover { color: #667eea; }
.post-meta { font-size: 0.85rem; color: #888; margin-bottom: 12px; }
.post-meta span { margin-right: 14px; }
.tag {
  display: inline-block;
  background: #eef0ff;
  color: #667eea;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-right: 6px;
}
.excerpt { color: #555; font-size: 0.95rem; line-height: 1.6; margin-bottom: 12px; }
.read-more { color: #667eea; text-decoration: none; font-weight: 500; font-size: 0.9rem; }
.read-more:hover { text-decoration: underline; }

/* 文章详情 */
.post-full { background: #fff; border-radius: 12px; padding: 40px; margin: 30px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.post-header { margin-bottom: 30px; }
.post-header h1 { font-size: 1.8rem; line-height: 1.3; margin-bottom: 14px; }
.post-content { font-size: 1rem; color: #333; }
.post-content h2 { font-size: 1.4rem; margin: 32px 0 14px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
.post-content h3 { font-size: 1.15rem; margin: 24px 0 12px; }
.post-content p { margin-bottom: 16px; }
.post-content ul, .post-content ol { margin: 12px 0 16px 24px; }
.post-content li { margin-bottom: 6px; }
.post-content code {
  background: #f0f0f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.post-content pre {
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 20px;
  border-radius: 10px;
  overflow-x: auto;
  margin: 20px 0;
  font-size: 0.9rem;
  line-height: 1.5;
}
.post-content pre code { background: transparent; padding: 0; color: inherit; }
.post-content a { color: #667eea; text-decoration: underline; }
.post-content img { max-width: 100%; border-radius: 8px; margin: 20px 0; }
.post-content blockquote {
  border-left: 4px solid #667eea;
  padding: 12px 20px;
  margin: 20px 0;
  background: #f8f9ff;
  border-radius: 0 8px 8px 0;
  color: #555;
}

/* 分类 */
.categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; margin: 32px 0; }
.category-card {
  display: block;
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  text-decoration: none;
  color: #1a1a2e;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  text-align: center;
  transition: transform 0.2s;
}
.category-card:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.category-card h3 { font-size: 1.1rem; margin-bottom: 8px; }
.category-card .count { font-size: 0.9rem; color: #999; }

/* 产品 */
.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin: 32px 0; }
.product-card {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.product-card h3 { font-size: 1.15rem; margin-bottom: 10px; }
.product-card p { color: #666; font-size: 0.95rem; }
.price { font-size: 1.2rem; font-weight: 700; color: #667eea; margin-top: 12px; }
.empty { text-align: center; color: #999; padding: 60px 0; font-size: 1.1rem; }

/* 分页 */
.pagination { display: flex; justify-content: center; gap: 8px; margin: 40px 0; }
.pagination a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: #fff;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  font-size: 0.9rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.pagination a.active { background: #667eea; color: #fff; }
.pagination a:hover:not(.active) { background: #eef0ff; }

/* 底部 */
.footer {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 0.85rem;
}

/* 响应式 */
@media (max-width: 600px) {
  .post-full { padding: 24px; }
  .hero h1 { font-size: 1.5rem; }
  .header nav a { margin-left: 14px; font-size: 0.85rem; }
}
`;
}

build().catch(err => {
  console.error('❌ 构建失败:', err.message);
  process.exit(1);
});
