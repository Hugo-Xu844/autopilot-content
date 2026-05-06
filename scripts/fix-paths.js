/**
 * fix-paths.js — 将 build-site.js 中的绝对路径改为相对路径
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'build-site.js');
let src = fs.readFileSync(filePath, 'utf-8');

// --- Build page functions use root prefix ---
// For pages at root level: prefix = ''
// For pages in subdirectories: prefix = '..'

// 1. buildPostPage (subdirectory: posts/) - already has ../ from previous edit

// 2. buildIndexPage (root-level)
// Fix CSS link
src = src.replace(
  '<link rel="stylesheet" href="/assets/style.css">',
  '<link rel="stylesheet" href="assets/style.css">'
);

// Fix logo home link (root pages)
src = src.replace(
  '<a href="/" class="logo">${config.site.title}</a>',
  '<a href="." class="logo">${config.site.title}</a>'
);

// Fix nav links (root pages - buildIndexPage)
src = src.replace(
  '<a href="/" class="active">首页</a>',
  '<a href="." class="active">首页</a>'
);
src = src.replace(
  '<a href="/products.html">教程产品</a>',
  '<a href="products.html">教程产品</a>'
);

// 3. buildProductsPage (root-level)
// Fix nav in products page
src = src.replace(
  '<a href="/">首页</a>\n        <a href="/products.html" class="active">教程产品</a>',
  '<a href=".">首页</a>\n        <a href="products.html" class="active">教程产品</a>'
);

// 4. buildCategoryPage (root-level)
// Fix nav in categories page
src = src.replace(
  '<a href="/">首页</a>\n        <a href="/categories.html" class="active">分类</a>\n        <a href="/products.html">教程产品</a>',
  '<a href=".">首页</a>\n        <a href="categories.html" class="active">分类</a>\n        <a href="products.html">教程产品</a>'
);

// Fix category links (root-level)
src = src.replace(
  'href="/categories/${encodeURIComponent(cat)}.html"',
  'href="categories/${encodeURIComponent(cat)}.html"'
);

// 5. buildCategoryListPage (subdirectory: categories/)
// Fix nav - needs ../ prefix
src = src.replace(
  '<a href="/">首页</a>\n        <a href="/categories.html">分类</a>\n        <a href="/products.html">教程产品</a>',
  '<a href="..">首页</a>\n        <a href="../categories.html">分类</a>\n        <a href="../products.html">教程产品</a>'
);

// Fix category list post links (subdirectory)
src = src.replace(
  'href="/posts/${post.slug}.html"',
  'href="../posts/${post.slug}.html"'
);

// Fix post links in index page (root-level)
src = src.replace(
  'href="/posts/${post.slug}.html"',
  'href="posts/${post.slug}.html"'
);

// Fix pagination
src = src.replace(/href="\/index/g, 'href="index');

fs.writeFileSync(filePath, src);
console.log('✅ 路径修复完成');

// Verify no remaining '/assets/' or '"/"' patterns (shouldn't exist now)
const remainingAssets = (src.match(/href="\/assets\//g) || []).length;
const remainingHome = (src.match(/href="\/"/g) || []).length;
console.log(`   ${remainingAssets} 处剩余 /assets/ 路径`);
console.log(`   ${remainingHome} 处剩余 "/" 首页链接`);
