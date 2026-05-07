/**
 * build-site.js — v2 从 Markdown 文章生成静态网站
 * 
 * 用法: node scripts/build-site.js
 */

const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8'));
const POSTS_DIR = path.join(__dirname, '..', config.content.outputDir);
const SITE_DIR = path.join(__dirname, '..', 'site');
const PRODUCTS_DIR = path.join(__dirname, '..', config.products.outputDir);

// ---- Shared snippets ----

const HEAD_START = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>`;

const HEAD_END = `  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <div id="reading-progress"></div>`;

const HEADER = (activePage) => `
  <header class="header">
    <div class="container">
      <a href="." class="logo">AI 编程实验室</a>
      <div class="header-actions">
        <nav>
          <a href="."${activePage === 'home' ? ' class="active"' : ''}>首页</a>
          <a href="categories.html"${activePage === 'categories' ? ' class="active"' : ''}>分类</a>
          <a href="products.html"${activePage === 'products' ? ' class="active"' : ''}>教程产品</a>
        </nav>
        <button id="theme-toggle" class="theme-toggle" aria-label="切换深色/浅色模式">&#127769;</button>
      </div>
    </div>
  </header>`;

const HEADER_POST = `  <header class="header">
    <div class="container">
      <a href="../" class="logo">AI 编程实验室</a>
      <div class="header-actions">
        <nav>
          <a href="../">首页</a>
          <a href="../categories.html">分类</a>
          <a href="../products.html">教程产品</a>
        </nav>
        <button id="theme-toggle" class="theme-toggle" aria-label="切换深色/浅色模式">&#127769;</button>
      </div>
    </div>
  </header>`;

const FOOTER = `  <footer class="footer">
    <div class="container">
      <p>AI 编程实验室 &copy; ${new Date().getFullYear()} | 用 &#10084;&#65039; 和 AI 生成</p>
    </div>
  </footer>

  <button id="back-to-top" aria-label="回到顶部">&uarr;</button>

  <script src="assets/app.js"></script>
</body>
</html>`;

const FOOTER_POST = `  <footer class="footer">
    <div class="container">
      <p>AI 编程实验室 &copy; ${new Date().getFullYear()} | 用 &#10084;&#65039; 和 AI 生成</p>
    </div>
  </footer>

  <button id="back-to-top" aria-label="回到顶部">&uarr;</button>

  <script src="../assets/app.js"></script>
</body>
</html>`;

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
    
    return {
      slug: file.replace('.md', ''),
      file,
      fullPath,
      frontmatter,
      body,
      readingTime,
      excerpt: body.replace(/```[\s\S]*?```/g, '').replace(/[#*`>\-\[\]\(\)]/g, '').slice(0, 200).trim() + '...'
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
  
  // Emphasis
  html = html.replace(/\*\*(.+?)\b\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\b\*(.+?)\*\b/g, '<em>$1</em>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // Headings (at start of line, after removing list markers)
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  
  // Unordered list items
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  
  // Ordered list items
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Split by blank lines and wrap paragraphs
  // But skip blocks that already contain block-level elements
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    // Skip blocks that start with a block-level element
    if (/^<(h[1-6]|ul|ol|li|pre|table|blockquote|div)/.test(trimmed)) {
      return trimmed;
    }
    // Skip code blocks
    if (trimmed.startsWith('__CODEBLOCK_START__') || trimmed.includes('__CODEBLOCK_END__')) {
      return trimmed;
    }
    // Wrap in paragraph
    // But not if it looks like it contains block elements already
    if (/<\/(h[1-6]|ul|ol|pre|table|blockquote)>/.test(trimmed)) {
      return trimmed;
    }
    return '<p>' + trimmed.replace(/\n/g, '<br>') + '</p>';
  }).join('\n\n');
  
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
  const description = post.frontmatter.description || '';
  const title = post.frontmatter.title || post.slug;
  
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

  return `${HEAD_START}${title} - ${config.site.title}</title>
  <meta name="description" content="${description}">
${HEAD_END}
${HEADER_POST}
  <main class="container">
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
${FOOTER_POST}`;
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

  return `${HEAD_START}${config.site.title} - ${config.site.description}</title>
  <meta name="description" content="${config.site.description}">
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
${FOOTER}`;
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

  return `${HEAD_START}教程产品 - ${config.site.title}</title>
  <meta name="description" content="精选编程与 AI 教程合集，PDF 电子书，助你快速提升技能">
${HEAD_END}
${HEADER('products')}
  <main class="container">
    <h1 class="page-title">📚 教程产品</h1>
    <p class="page-subtitle">精心整理的编程与 AI 教程合集，PDF 电子书格式，助你系统化学习。</p>
    <div class="products-grid">
      ${productsHtml}
    </div>
  </main>
${FOOTER}`;
}

function buildCategoryPage(posts) {
  const cats = config.content.categories.map(cat => {
    const count = posts.filter(p => p.frontmatter.category === cat).length;
    return `<a href="categories/${encodeURIComponent(cat)}.html" class="category-card">
      <h3>${cat}</h3>
      <span class="count">${count} 篇</span>
    </a>`;
  }).join('\n');

  return `${HEAD_START}分类 - ${config.site.title}</title>
  <meta name="description" content="AI 编程实验室文章分类浏览">
${HEAD_END}
${HEADER('categories')}
  <main class="container">
    <h1 class="page-title">📂 文章分类</h1>
    <div class="categories-grid">
      ${cats}
    </div>
  </main>
${FOOTER}`;
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

  return `${HEAD_START}${category} - ${config.site.title}</title>
  <meta name="description" content="${category} - 共 ${posts.length} 篇文章">
${HEAD_END}
${HEADER_POST.replace(/href="\.\.\/"/g, 'href=".."').replace(/\.\.\/categories/g, '../categories').replace(/\.\.\/products/g, '../products')}
  <main class="container">
    <h1 class="page-title">📂 ${category}</h1>
    <p class="page-subtitle">共 ${posts.length} 篇文章</p>
    <section class="posts-list">
      ${postsHtml}
    </section>
  </main>
${FOOTER_POST}`;
}

// ---- Build ----

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function build() {
  console.log('🏗️  开始构建网站 v2...\n');
  
  const posts = getAllPosts();
  console.log(`📄 找到 ${posts.length} 篇文章`);
  
  const outDir = SITE_DIR;
  ensureDir(outDir);
  ensureDir(path.join(outDir, 'posts'));
  ensureDir(path.join(outDir, 'categories'));
  ensureDir(path.join(outDir, 'assets'));
  ensureDir(path.join(outDir, 'products'));
  
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
  
  // Generate products page
  console.log('📚 生成产品页面...');
  fs.writeFileSync(path.join(outDir, 'products.html'), buildProductsPage());
  
  // Copy assets if not exist
  console.log('🎨 检查资源文件...');
  const stylePath = path.join(outDir, 'assets', 'style.css');
  const jsPath = path.join(outDir, 'assets', 'app.js');
  
  // Only create default files if they don't exist (user-customized files take priority)
  if (!fs.existsSync(stylePath)) {
    console.log('   ⚠️  style.css 不存在，跳过（请手动放置）');
  }
  if (!fs.existsSync(jsPath)) {
    console.log('   ⚠️  app.js 不存在，跳过（请手动放置）');
  }
  
  console.log(`\n✅ 网站构建完成！`);
  console.log(`📁 输出目录: ${outDir}`);
}

build().catch(err => {
  console.error('❌ 构建失败:', err.message);
  process.exit(1);
});
