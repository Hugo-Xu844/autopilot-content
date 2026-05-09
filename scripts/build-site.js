/**
 * build-site.js — v3 从 Markdown 文章生成静态网站
 * 
 * 新增 v3 特性:
 *   - Open Graph / Twitter Card 元标签
 *   - 导航栏增加"关于"页面
 *   - 底部导航链接
 *   - 自动生成 sitemap.xml, robots.txt, feed.xml
 *   - 更好的摘要提取（去掉 markdown 语法残留）
 *   - 文章面包屑导航
 *   
 * 用法: node scripts/build-site.js
 */

const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8'));
const POSTS_DIR = path.join(__dirname, '..', config.content.outputDir);
const SITE_DIR = path.join(__dirname, '..', 'site');
const PRODUCTS_DIR = path.join(__dirname, '..', config.products.outputDir);

const SITE_URL = (config.site.baseUrl || 'https://example.com').replace(/\/+$/, '');

// ---- Shared snippets ----

const HEAD_START = (ogExtra = '') => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>`;

const OG_PREFIX = (title, desc, url) => `
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <link rel="alternate" type="application/rss+xml" title="AI 编程实验室" href="${SITE_URL}/feed.xml">
  <link rel="icon" href="${SITE_URL}/assets/favicon.ico" sizes="any">`;

const CSS_PATH = 'assets/style.css';
const CSS_PATH_POST = '../assets/style.css';

const HEAD_END = `  <link rel="stylesheet" href="${CSS_PATH}">
</head>
<body>
  <div id="reading-progress"></div>`;

const HEAD_END_POST = `  <link rel="stylesheet" href="${CSS_PATH_POST}">
</head>
<body>
  <div id="reading-progress"></div>`;

const HEADER = (activePage) => `
  <header class="header">
    <div class="container">
      <a href="." class="logo"><span class="logo-icon">&#9889;</span>AI 编程实验室</a>
      <div class="header-actions">
        <nav>
          <a href="."${activePage === 'home' ? ' class="active"' : ''}>首页</a>
          <a href="categories.html"${activePage === 'categories' ? ' class="active"' : ''}>分类</a>
          <a href="products.html"${activePage === 'products' ? ' class="active"' : ''}>教程产品</a>
          <a href="about.html"${activePage === 'about' ? ' class="active"' : ''}>关于</a>
        </nav>
        <button id="theme-toggle" class="theme-toggle" aria-label="切换深色/浅色模式">&#127769;</button>
      </div>
    </div>
  </header>`;

const HEADER_POST = `  <header class="header">
    <div class="container">
      <a href="../" class="logo"><span class="logo-icon">&#9889;</span>AI 编程实验室</a>
      <div class="header-actions">
        <nav>
          <a href="../">首页</a>
          <a href="../categories.html">分类</a>
          <a href="../products.html">教程产品</a>
          <a href="../about.html">关于</a>
        </nav>
        <button id="theme-toggle" class="theme-toggle" aria-label="切换深色/浅色模式">&#127769;</button>
      </div>
    </div>
  </header>`;

const FOOTER = (isPost = false) => {
  const base = isPost ? '..' : '.';
  return `  <footer class="footer">
    <div class="container">
      <div class="footer-links">
        <a href="${base}/">首页</a>
        <a href="${base}/categories.html">分类</a>
        <a href="${base}/products.html">教程产品</a>
        <a href="${base}/about.html">关于</a>
        <a href="${base}/feed.xml" class="rss-link">📡 RSS</a>
      </div>
      <p>AI 编程实验室 &copy; ${new Date().getFullYear()} | 用 &#10084;&#65039; 和 AI 生成</p>
    </div>
  </footer>

  <button id="back-to-top" aria-label="回到顶部">&uarr;</button>

  <script src="${isPost ? '..' : '.'}/assets/app.js"></script>
</body>
</html>`;
};

// ---- 解析 Markdown ----

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
          
          if (val.startsWith('[') && val.endsWith(']')) {
            try { val = JSON.parse(val); } catch (e) {
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
    
    // Calculate reading time
    const wordCount = body.replace(/```[\s\S]*?```/g, '').length;
    const readingTime = Math.max(1, Math.round(wordCount / 500));
    
    // Clean excerpt: remove code blocks, markdown syntax, URLs
    let excerpt = body
      .replace(/```[\s\S]*?```/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
      .replace(/[#*`>_~]/g, '')
      .replace(/\|{2,}/g, '')
      .replace(/---+/g, '')
      .replace(/\n{2,}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    excerpt = excerpt.slice(0, 160).trim() + (excerpt.length > 160 ? '...' : '');
    
    return {
      slug: file.replace('.md', ''),
      file,
      fullPath,
      frontmatter,
      body,
      readingTime,
      excerpt
    };
  }).filter(p => p.frontmatter.draft !== true);
}

// ---- Markdown to HTML ----

function mdToHtml(md) {
  let html = md;
  
  // Code blocks (preserve first)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `__CODEBLOCK_START__<pre><code class="language-${lang}">${escaped}</code></pre>__CODEBLOCK_END__`;
  });
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Tables (simple pipe tables)
  html = html.replace(/^(\|.+\|)\n\|[-:| ]+\|\n((?:\|.+\|\n?)*)/gm, (match) => {
    const lines = match.trim().split('\n');
    if (lines.length < 2) return match;
    
    const headers = lines[0].split('|').filter(c => c.trim()).map(c => c.trim());
    // Skip separator line
    const dataRows = lines.slice(2).filter(l => l.includes('|'));
    
    let tableHtml = '<table>\n<thead>\n<tr>';
    headers.forEach(h => { tableHtml += `<th>${h}</th>`; });
    tableHtml += '</tr>\n</thead>\n<tbody>\n';
    
    dataRows.forEach(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.length === 0) return;
      tableHtml += '<tr>';
      cells.forEach(c => { tableHtml += `<td>${c}</td>`; });
      tableHtml += '</tr>\n';
    });
    
    tableHtml += '</tbody>\n</table>';
    return tableHtml;
  });
  
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  
  // Emphasis (bold and italic - handle overlapping patterns)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Headings
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');
  
  // Unordered list items
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, ((match) => {
    if (match.includes('<ul>')) return match;
    return '<ul>' + match.trim() + '</ul>';
  }));
  
  // Ordered list items
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Split by blank lines and wrap paragraphs (skip already wrapped content)
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    // Skip blocks that start with a block-level element
    if (/^<(h[1-6]|ul|ol|li|pre|table|blockquote|hr|img|div)/i.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.startsWith('__CODEBLOCK_START__') || trimmed.includes('__CODEBLOCK_END__')) {
      return trimmed;
    }
    if (/<\/(h[1-6]|ul|ol|pre|table|blockquote)>/.test(trimmed)) {
      return trimmed;
    }
    return '<p>' + trimmed.replace(/\n/g, '<br>') + '</p>';
  }).join('\n\n');
  
  // Collapse consecutive blockquotes into one
  html = html.replace(/<\/blockquote>\n\n<blockquote>/g, '\n\n');
  
  // Restore code block markers
  html = html.replace(/__CODEBLOCK_START__/g, '').replace(/__CODEBLOCK_END__/g, '');
  
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p><\/p>/g, '');
  
  return html;
}

// ---- Page builders ----

function buildPostPage(post) {
  const date = post.frontmatter.date || '';
  const tags = Array.isArray(post.frontmatter.tags) ? post.frontmatter.tags : [];
  const category = post.frontmatter.category || '';
  const description = post.frontmatter.description || post.excerpt;
  const title = post.frontmatter.title || post.slug;
  const slug = post.slug;
  
  const contentHtml = mdToHtml(post.body);
  const tagHtml = tags.map(t => `<span class="tag">${t}</span>`).join(' ');
  
  // Get related posts (same category)
  const allPosts = getAllPosts();
  const related = allPosts
    .filter(p => p.slug !== post.slug && p.frontmatter.category === category)
    .slice(0, 3);
  
  const relatedHtml = related.length > 0 ? `
  <div class="related-posts">
    <h3>📌 相关文章</h3>
    <div class="related-grid">
      ${related.map(p => `
      <a href="${p.slug}.html" class="related-card">
        <h4>${p.frontmatter.title || p.slug}</h4>
        <span class="date">📅 ${p.frontmatter.date || ''}</span>
      </a>`).join('\n')}
    </div>
  </div>` : '';

  const ogUrl = `/posts/${slug}.html`;
  const ogMeta = OG_PREFIX(`${title} - ${config.site.title}`, description, ogUrl);

  return `${HEAD_START()}${title} - ${config.site.title}</title>
  <meta name="description" content="${description}">${ogMeta}
${HEAD_END_POST}
${HEADER_POST}
  <main class="container">
    <div class="breadcrumb">
      <a href="../">首页</a><span class="sep">/</span>
      <a href="../categories.html">分类</a><span class="sep">/</span>
      <span>${title}</span>
    </div>
    <article class="post-full">
      <header class="post-header">
        <h1>${title}</h1>
        <div class="post-meta">
          <span class="date">📅 ${date}</span>
          <span class="category">📂 ${category}</span>
          <span class="reading-time">📖 阅读约 ${post.readingTime} 分钟</span>
          <div class="tags">${tagHtml}</div>
        </div>
      </header>
      <div class="post-content">
        ${contentHtml}
      </div>
      ${relatedHtml}
    </article>
  </main>
${FOOTER(true)}`;
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
      <h2><a href="posts/${post.slug}.html">${post.frontmatter.title || post.slug}</a></h2>
      <div class="post-meta">
        <span class="date">📅 ${date}</span>
        <span class="category">📂 ${category}</span>
        <span class="reading-time">📖 ${post.readingTime} 分钟</span>
        ${tagHtml}
      </div>
      <p class="excerpt">${post.excerpt}</p>
      <a href="posts/${post.slug}.html" class="read-more">继续阅读 →</a>
    </article>`;
  }).join('\n');

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

  const heroSection = `<section class="hero">
      <h1>${config.site.description}</h1>
      <p>每日更新 AI 教程、编程实战、工具评测 — 全部由 AI 自动生成。</p>
      <p class="post-count">目前已发布 ${posts.length} 篇文章</p>
    </section>`;

  const ogMeta = OG_PREFIX(`${config.site.title}`, config.site.description, '/');

  return `${HEAD_START()}${config.site.title} - ${config.site.description}</title>
  <meta name="description" content="${config.site.description}">${ogMeta}
${HEAD_END}
${HEADER('home')}
  <main class="container">
    ${heroSection}

    <h2 class="section-title">最新文章</h2>

    <section class="posts-list">
      ${postsHtml}
    </section>

    ${pagination}
  </main>
${FOOTER(false)}`;
}

function buildProductsPage() {
  const products = !fs.existsSync(PRODUCTS_DIR) ? [] : 
    fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.md')).map(f => {
      const { frontmatter } = parsePost(path.join(PRODUCTS_DIR, f));
      return { 
        id: f.replace('.md', ''),
        title: frontmatter.title || f.replace('.md', ''),
        description: frontmatter.description || '高质量技术教程',
        price: frontmatter.price || '免费',
        articleCount: frontmatter.articleCount || '?'
      };
    });

  const productsHtml = products.length > 0 ? products.map(p => {
    const coverImg = `assets/covers/${p.id}.svg`;
    
    return `
    <div class="product-card">
      <a href="products/${p.id}.html" class="product-card-cover">
        <img src="${coverImg}" alt="${p.title}" loading="lazy">
      </a>
      <div class="product-card-body">
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="product-card-footer">
          <span class="price">${p.price}</span>
          <span class="articles-count">📄 ${p.articleCount} 篇文章</span>
        </div>
        <a href="products/${p.id}.html" class="product-btn" style="margin-top:16px">查看详情 →</a>
      </div>
    </div>`;
  }).join('\n') : '<p class="empty">教程产品即将上线，敬请期待...</p>';

  const ogMeta = OG_PREFIX(`教程产品 - ${config.site.title}`, '精选编程与 AI 教程合集，PDF 电子书，助你快速提升技能', '/products.html');

  return `${HEAD_START()}教程产品 - ${config.site.title}</title>
  <meta name="description" content="精选编程与 AI 教程合集，PDF 电子书，助你快速提升技能">${ogMeta}
${HEAD_END}
${HEADER('products')}
  <main class="container">
    <h1 class="page-title">📚 教程产品</h1>
    <p class="page-subtitle">精心整理的编程与 AI 教程合集，PDF 电子书格式，助你系统化学习。</p>
    <div class="products-grid">
      ${productsHtml}
    </div>
  </main>
${FOOTER(false)}`;
}

function buildCategoryPage(posts) {
  const cats = config.content.categories.map(cat => {
    const count = posts.filter(p => p.frontmatter.category === cat).length;
    return `<a href="categories/${encodeURIComponent(cat)}.html" class="category-card">
      <h3>${cat}</h3>
      <span class="count">${count} 篇</span>
    </a>`;
  }).join('\n');

  const ogMeta = OG_PREFIX(`分类 - ${config.site.title}`, 'AI 编程实验室文章分类浏览', '/categories.html');

  return `${HEAD_START()}分类 - ${config.site.title}</title>
  <meta name="description" content="AI 编程实验室文章分类浏览">${ogMeta}
${HEAD_END}
${HEADER('categories')}
  <main class="container">
    <h1 class="page-title">📂 文章分类</h1>
    <div class="categories-grid">
      ${cats}
    </div>
  </main>
${FOOTER(false)}`;
}

function buildCategoryListPage(category, posts) {
  const postsHtml = posts.map(post => {
    const date = post.frontmatter.date || '';
    return `
    <article class="post-card">
      <h2><a href="../posts/${post.slug}.html">${post.frontmatter.title || post.slug}</a></h2>
      <div class="post-meta">
        <span class="date">📅 ${date}</span>
        <span class="reading-time">📖 ${post.readingTime} 分钟</span>
      </div>
      <p class="excerpt">${post.excerpt}</p>
      <a href="../posts/${post.slug}.html" class="read-more">继续阅读 →</a>
    </article>`;
  }).join('\n');

  return `${HEAD_START()}${category} - ${config.site.title}</title>
  <meta name="description" content="${category} - 共 ${posts.length} 篇文章">
${HEAD_END_POST}
${HEADER_POST.replace(/href="\.\.\/"/g, 'href=".."').replace(/\.\.\/categories/g, '../categories').replace(/\.\.\/products/g, '../products')}
  <main class="container">
    <div class="breadcrumb">
      <a href="../">首页</a><span class="sep">/</span>
      <a href="../categories.html">分类</a><span class="sep">/</span>
      <span>${category}</span>
    </div>
    <h1 class="page-title">📂 ${category}</h1>
    <p class="page-subtitle">共 ${posts.length} 篇文章</p>
    <section class="posts-list">
      ${postsHtml}
    </section>
  </main>
${FOOTER(true)}`;
}

function buildAboutPage() {
  const posts = getAllPosts();
  const totalPosts = posts.length;
  const totalCategories = config.content.categories.length;
  const products = !fs.existsSync(PRODUCTS_DIR) ? [] : 
    fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.md'));
  const totalProducts = products.length;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>关于 - ${config.site.title}</title>
  <meta name="description" content="${config.site.title} — 用 AI 赋能编程学习，每日更新技术教程、编程实战与工具评测。">${OG_PREFIX(`关于 - ${config.site.title}`, '用 AI 赋能编程学习，每日更新技术教程、编程实战与工具评测。', '/about.html')}
  <link rel="stylesheet" href="assets/style.css">
  <style>
    .about-section { max-width: 780px; margin: 40px auto; }
    .about-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 48px; margin-bottom: 24px; transition: background 0.3s, border-color 0.3s; }
    .about-card h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
    .about-card p { color: var(--text-secondary); line-height: 1.8; margin-bottom: 14px; font-size: 0.95rem; }
    .about-card ul { color: var(--text-secondary); margin-left: 20px; margin-bottom: 14px; line-height: 1.8; }
    .about-card li { margin-bottom: 6px; }
    .about-card li::marker { color: var(--primary); }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin: 24px 0; }
    .stat-item { text-align: center; padding: 24px 16px; background: var(--primary-light); border-radius: var(--radius-sm); border: 1px solid var(--border); }
    .stat-item .number { font-size: 2rem; font-weight: 800; color: var(--primary); display: block; }
    .stat-item .label { font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; }
    .stack-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .stack-list span { display: inline-block; padding: 6px 14px; background: var(--primary-light); color: var(--primary); border-radius: 8px; font-size: 0.85rem; font-weight: 500; }
    @media (max-width: 768px) { .about-card { padding: 28px 20px; } .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <div id="reading-progress"></div>
  <header class="header">
    <div class="container">
      <a href="." class="logo"><span class="logo-icon">&#9889;</span>AI 编程实验室</a>
      <div class="header-actions">
        <nav>
          <a href=".">首页</a>
          <a href="categories.html">分类</a>
          <a href="products.html">教程产品</a>
          <a href="about.html" class="active">关于</a>
        </nav>
        <button id="theme-toggle" class="theme-toggle" aria-label="切换深色/浅色模式">&#127769;</button>
      </div>
    </div>
  </header>
  <main class="container">
    <div class="about-section">
      <h1 class="page-title">✨ 关于 ${config.site.title}</h1>
      <p class="page-subtitle">用 AI 赋能编程学习，让技术知识触手可及。</p>
      <div class="stats-grid">
        <div class="stat-item"><span class="number">${totalPosts}</span><span class="label">已发布文章</span></div>
        <div class="stat-item"><span class="number">${totalCategories}</span><span class="label">专题分类</span></div>
        <div class="stat-item"><span class="number">${totalProducts}</span><span class="label">教程产品</span></div>
        <div class="stat-item"><span class="number">100%</span><span class="label">AI 驱动</span></div>
      </div>
      <div class="about-card">
        <h2>🎯 这个网站是做什么的？</h2>
        <p><strong>AI 编程实验室</strong> 是一个由 AI 驱动的技术博客，专注于为开发者提供高质量的编程教程、AI 工具评测和效率提升技巧。</p>
        <p>我们的内容由大语言模型自动生成，覆盖从 AI 入门到编程实战的完整学习路径。每天更新，让你随时随地获取最新技术知识。</p>
        <div class="stack-list"><span>🤖 AI 自动生成</span><span>🐍 Python</span><span>📦 Docker</span><span>⚡ 效率工具</span><span>🕹️ Prompt 工程</span></div>
      </div>
      <div class="about-card">
        <h2>📚 内容分类</h2>
        <p>目前开设 ${totalCategories} 个专题栏目：</p>
        <ul>
          ${config.content.categories.map(cat => {
            const descs = {
              'AI入门教程': '大语言模型、机器学习基础，零基础也能轻松上手',
              'Python编程': '从基础语法到高级特性，系统性提升 Python 技能',
              'AI工具评测': '实测对比市面上最热门的 AI 工具，帮你选出最适合的',
              '编程实战': '从零到一完成项目，在实践中掌握真技术',
              'Prompt工程': '掌握让 AI 输出更精准的提示词设计技巧',
              '效率工具': '发掘那些你不知道的宝藏工具和技巧'
            };
            return `<li><strong>${cat}</strong> — ${descs[cat] || '技术教程与实战分享'}</li>`;
          }).join('\n          ')}
        </ul>
      </div>
      <div class="about-card">
        <h2>🛠️ 技术栈</h2>
        <p>这个网站完全由开源工具构建：</p>
        <ul>
          <li><strong>AI 生成</strong> — DeepSeek API / Ollama（Qwen 模型）</li>
          <li><strong>静态站点</strong> — 纯静态 HTML + CSS + JavaScript</li>
          <li><strong>样式</strong> — 现代极简设计，支持深色/浅色模式</li>
          <li><strong>部署</strong> — GitHub Pages，完全免费托管</li>
          <li><strong>产品</strong> — Markdown 转 PDF，可上架 Gumroad/爱发电</li>
        </ul>
      </div>
      <div class="about-card">
        <h2>🤝 联系与支持</h2>
        <p>如果你有任何问题、建议或合作意向，欢迎联系：</p>
        <p>📧 邮箱：<a href="mailto:wainxu0211@gmail.com">wainxu0211@gmail.com</a><br>🐙 GitHub：<a href="https://github.com/Hugo-Xu844" target="_blank" rel="noopener">Hugo-Xu844</a></p>
        <p style="margin-top:16px;font-size:0.85rem;color:var(--text-light);">觉得内容有帮助？给 <a href="https://github.com/Hugo-Xu844/autopilot-content" target="_blank" rel="noopener">GitHub 仓库</a> 点个 ⭐</p>
      </div>
    </div>
  </main>
  ${FOOTER(false).replace('assets/app.js', 'assets/app.js')}
</body>
</html>`;
}

function buildSitemap(posts) {
  const now = new Date().toISOString().split('T')[0];
  
  const postUrls = posts.map(p => {
    const slug = encodeURIComponent(p.slug);
    const date = p.frontmatter.date || now;
    const cat = encodeURIComponent(p.frontmatter.category || 'uncategorized');
    return `  <url>
    <loc>${SITE_URL}/posts/${slug}.html</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
  }).join('\n');

  const catUrls = config.content.categories.map(cat => {
    const encoded = encodeURIComponent(cat);
    return `  <url>
    <loc>${SITE_URL}/categories/${encoded}.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join('\n');

  const productUrls = ['ai-beginners', 'ai-tools', 'coding-practice', 'prompt-master', 'python-basics']
    .map(id => `  <url>
    <loc>${SITE_URL}/products/${id}.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`)
    .filter(() => fs.existsSync(path.join(SITE_DIR, 'products')))
    .join('\n');

  const totalPages = Math.ceil(posts.length / 10);
  const indexUrls = [];
  for (let i = 1; i <= totalPages; i++) {
    indexUrls.push(`  <url>
    <loc>${SITE_URL}/index${i === 1 ? '' : i}.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${i === 1 ? '1.0' : '0.7'}</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexUrls.join('\n')}
  <url>
    <loc>${SITE_URL}/categories.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/products.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
${catUrls}
${postUrls}
${productUrls}
</urlset>`;
}

function buildRssFeed(posts) {
  const escapeXml = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const items = posts.slice(0, 20).map(p => {
    const title = escapeXml(p.frontmatter.title || p.slug);
    const slug = encodeURIComponent(p.slug);
    const url = `${SITE_URL}/posts/${slug}.html`;
    const date = p.frontmatter.date ? new Date(p.frontmatter.date).toUTCString() : new Date().toUTCString();
    const category = escapeXml(p.frontmatter.category || '');
    const desc = escapeXml(p.excerpt);
    return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${date}</pubDate>
      <category>${category}</category>
      <description>${desc}</description>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.site.title)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(config.site.description)}</description>
    <language>${config.site.language || 'zh-CN'}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

// ---- Build ----

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function build() {
  console.log('🏗️  开始构建网站 v3...\n');
  
  const posts = getAllPosts();
  console.log(`📄 找到 ${posts.length} 篇文章`);
  
  const outDir = SITE_DIR;
  ensureDir(outDir);
  ensureDir(path.join(outDir, 'posts'));
  ensureDir(path.join(outDir, 'categories'));
  ensureDir(path.join(outDir, 'assets'));
  ensureDir(path.join(outDir, 'products'));
  ensureDir(path.join(outDir, 'covers'));
  
  // Generate post pages
  console.log('📝 生成文章页面...');
  for (const post of posts) {
    const html = buildPostPage(post);
    fs.writeFileSync(path.join(outDir, 'posts', `${post.slug}.html`), html);
  }
  console.log(`   ✓ ${posts.length} 个文章页面`);
  
  // Generate index pages
  console.log('🏠 生成首页...');
  const perPage = 10;
  const totalPages = Math.ceil(posts.length / perPage);
  
  if (totalPages === 0) {
    fs.writeFileSync(path.join(outDir, 'index.html'), buildIndexPage([], 1));
  } else {
    for (let i = 1; i <= totalPages; i++) {
      fs.writeFileSync(path.join(outDir, i === 1 ? 'index.html' : `index${i}.html`), buildIndexPage(posts, i));
    }
  }
  console.log(`   ✓ ${totalPages} 个首页页面`);
  
  // Generate categories
  console.log('📂 生成分类页面...');
  fs.writeFileSync(path.join(outDir, 'categories.html'), buildCategoryPage(posts));
  
  for (const cat of config.content.categories) {
    const catPosts = posts.filter(p => p.frontmatter.category === cat);
    if (catPosts.length === 0) continue;
    
    fs.writeFileSync(
      path.join(outDir, 'categories', `${encodeURIComponent(cat)}.html`),
      buildCategoryListPage(cat, catPosts)
    );
  }
  console.log(`   ✓ ${config.content.categories.filter(c => posts.some(p => p.frontmatter.category === c)).length} 个分类页面`);
  
  // Generate products page
  console.log('📚 生成产品页面...');
  fs.writeFileSync(path.join(outDir, 'products.html'), buildProductsPage());
  
  // Generate about page
  console.log('👤 生成关于页面...');
  fs.writeFileSync(path.join(outDir, 'about.html'), buildAboutPage());
  
  // Generate sitemap
  console.log('🗺️  生成 sitemap.xml...');
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), buildSitemap(posts));
  
  // Generate RSS feed
  console.log('📡 生成 RSS feed...');
  fs.writeFileSync(path.join(outDir, 'feed.xml'), buildRssFeed(posts));
  
  // Generate robots.txt if not exists
  const robotsPath = path.join(outDir, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    console.log('🤖 生成 robots.txt...');
    fs.writeFileSync(robotsPath, `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`);
  }
  
  // Check assets
  console.log('🎨 检查资源文件...');
  if (!fs.existsSync(path.join(outDir, 'assets', 'style.css'))) {
    console.log('   ⚠️  style.css 不存在，跳过');
  }
  if (!fs.existsSync(path.join(outDir, 'assets', 'app.js'))) {
    console.log('   ⚠️  app.js 不存在，跳过');
  }
  if (!fs.existsSync(path.join(outDir, '404.html'))) {
    console.log('   ⚠️  404.html 不存在（推荐创建自定义 404 页面）');
  }
  
  console.log(`\n✅ 网站构建完成！`);
  console.log(`📁 输出目录: ${outDir}`);
  console.log(`📊 总计: ${posts.length} 篇文章, ${totalPages} 个首页, ${config.content.categories.length} 个分类`);
}

build().catch(err => {
  console.error('❌ 构建失败:', err.message);
  process.exit(1);
});
