/**
 * generate-product.js — 信息产品生成器
 * 
 * 从已发布的文章中精选内容，打包成电子书/教程合集
 * 
 * 用法: node scripts/generate-product.js
 */

const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8'));
const POSTS_DIR = path.join(__dirname, '..', config.content.outputDir);
const PRODUCTS_DIR = path.join(__dirname, '..', config.products.outputDir);

// 解析文章
function parsePost(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let title = '';
  let body = content;
  let frontmatter = {};

  if (content.startsWith('---')) {
    const end = content.indexOf('---', 3);
    if (end > 0) {
      const fm = content.slice(3, end).trim();
      fm.split('\n').forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          let val = line.slice(colonIdx + 1).trim().replace(/^"|"$/g, '');
          frontmatter[key] = val;
        }
      });
      title = frontmatter.title || '';
      body = content.slice(end + 3).trim();
    }
  }

  return { title, body, frontmatter };
}

// 产品模板定义
const PRODUCT_TEMPLATES = [
  {
    id: 'python-basics',
    title: 'Python 编程入门到精通',
    description: '从零开始的 Python 学习指南，涵盖基础语法、实战项目、最佳实践。',
    price: '¥19.9',
    categoryFilter: ['Python编程'],
    maxArticles: 8
  },
  {
    id: 'ai-beginners',
    title: 'AI 入门完全指南',
    description: '大语言模型、机器学习、Prompt工程 — AI 时代必备知识手册。',
    price: '¥19.9',
    categoryFilter: ['AI入门教程', 'Prompt工程'],
    maxArticles: 8
  },
  {
    id: 'ai-tools',
    title: '2025 AI 工具评测大全',
    description: '最实用的 AI 工具评测与对比，帮你选出最适合的工具。',
    price: '¥9.9',
    categoryFilter: ['AI工具评测'],
    maxArticles: 6
  },
  {
    id: 'coding-practice',
    title: '编程实战项目合集',
    description: '从命令行工具到 Web 应用，一步步带你完成实战项目。',
    price: '¥29.9',
    categoryFilter: ['编程实战', 'Python编程'],
    maxArticles: 10
  },
  {
    id: 'prompt-master',
    title: 'Prompt 工程大师课',
    description: '系统学习 Prompt 设计，让 AI 输出你想要的结果。',
    price: '¥14.9',
    categoryFilter: ['Prompt工程'],
    maxArticles: 6
  }
];

function generateProduct(template) {
  console.log(`\n📚 正在生成产品: ${template.title}`);

  // 获取符合条件的文章
  const posts = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const fullPath = path.join(POSTS_DIR, f);
      const { title, body, frontmatter } = parsePost(fullPath);
      return { file: f, title, body, frontmatter };
    })
    .filter(p => {
      const cat = p.frontmatter.category || '';
      return template.categoryFilter.includes(cat);
    })
    .slice(0, template.maxArticles);

  if (posts.length === 0) {
    console.log(`   ⚠️  没有符合条件的内容，跳过`);
    return null;
  }

  console.log(`   📄 选取了 ${posts.length} 篇文章`);

  // 生成目录
  const toc = posts.map((p, i) => {
    const date = p.frontmatter.date || '';
    return `  ${i + 1}. ${p.title} (${date})`;
  }).join('\n');

  // 拼合全文
  const content = posts.map((p, i) => {
    const divider = '\n\n' + '='.repeat(60) + '\n\n';
    const header = `# 第 ${i + 1} 章：${p.title}\n\n`;
    return divider + header + p.body;
  }).join('\n');

  // 生成完整电子书
  const fullContent = `---
title: "${template.title}"
description: "${template.description}"
price: "${template.price}"
date: "${new Date().toISOString().split('T')[0]}"
productId: "${template.id}"
articleCount: ${posts.length}
---

# ${template.title}

> ${template.description}

---

## 📖 目录

${toc}

---

**声明：** 本内容由 AI 编程实验室自动整理生成，仅供参考学习。

---

${content}

---

## 📌 关于本产品

- 来源：AI 编程实验室
- 文章数：${posts.length} 篇
- 生成时间：${new Date().toISOString()}

*如果觉得有帮助，欢迎分享给需要的朋友！*
`;

  // 保存
  const filename = `${template.id}.md`;
  const filePath = path.join(PRODUCTS_DIR, filename);
  fs.writeFileSync(filePath, fullContent, 'utf-8');
  console.log(`   ✅ 已生成: ${filename} (${Math.round(fullContent.length / 1024)}KB)`);

  return filePath;
}

async function main() {
  if (!fs.existsSync(PRODUCTS_DIR)) {
    fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
  }

  console.log('📚 AI 编程实验室 - 信息产品生成器\n');
  console.log(`⏰ ${new Date().toLocaleString('zh-CN')}\n`);

  const args = process.argv.slice(2);
  let productIds;

  if (args.length > 0 && !args.includes('--all')) {
    productIds = args;
  } else {
    productIds = PRODUCT_TEMPLATES.map(t => t.id);
  }

  let count = 0;
  for (const pid of productIds) {
    const template = PRODUCT_TEMPLATES.find(t => t.id === pid);
    if (!template) {
      console.log(`   ⚠️  未知产品 ID: ${pid}`);
      continue;
    }
    const result = generateProduct(template);
    if (result) count++;
  }

  console.log(`\n🎉 完成！生成了 ${count} 个信息产品。`);
  console.log(`📁 位置: ${PRODUCTS_DIR}`);
  console.log(`💡 将 .md 文件转换为 PDF 后可上架销售`);
}

main().catch(err => {
  console.error('❌ 出错:', err.message);
  process.exit(1);
});
