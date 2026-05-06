/**
 * content-generator.js — 自动化内容生成器
 * 
 * 用法: node scripts/generate-content.js [--count 2] [--force]
 * 
 * 从 Ollama (本地) 或 DeepSeek API 生成技术文章
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 读取配置
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8'));

// ---- 主题库 ----
const TOPICS = {
  "AI入门教程": [
    "什么是大语言模型？零基础入门指南",
    "Prompt Engineering 入门：10个让AI更好用的技巧",
    "AI 图片生成原理简介：从GAN到扩散模型",
    "普通人如何利用AI提高工作效率？",
    "机器学习 vs 深度学习：区别与联系",
    "RAG是什么？检索增强生成技术入门",
    "Agent是什么？AI智能体概念详解",
    "一文搞懂：监督学习、无监督学习、强化学习"
  ],
  "Python编程": [
    "Python装饰器从入门到进阶",
    "用Python写一个简单的Web爬虫",
    "Python列表推导式：一行代码的魔法",
    "Python异步编程：asyncio实战",
    "用Python处理Excel文件：openpyxl教程",
    "Python单元测试入门：unittest与pytest",
    "Python生成器与迭代器：高效处理大数据"
  ],
  "AI工具评测": [
    "2025年最佳AI编程助手对比：Cursor vs Copilot vs Codeium",
    "Claude vs GPT-4：谁更适合写代码？",
    "本地部署大模型指南：Ollama + OpenWebUI",
    "Midjourney vs DALL-E vs Stable Diffusion：AI绘图工具终极对比",
    "Notion AI vs Monica：AI写作工具实测"
  ],
  "编程实战": [
    "从零搭建一个个人博客：Node.js + GitHub Pages",
    "用Python写一个命令行工具：argparse实战",
    "API开发入门：用FastAPI写RESTful服务",
    "Git工作流最佳实践：团队协作指南",
    "Docker入门：容器化你的第一个应用"
  ],
  "Prompt工程": [
    "Prompt设计模式：让AI输出更精准",
    "思维链提示：让大模型学会推理",
    "Few-shot vs Zero-shot：什么时候用哪个？",
    "系统提示词设计：定制AI助手行为",
    "Prompt优化技巧：迭代改进你的提示词"
  ],
  "效率工具": [
    "VS Code 20个必装插件，开发效率翻倍",
    "终端美化指南：Windows Terminal + Oh My Posh",
    "自动化脚本实战：用Python解放重复劳动",
    "Obsidian：打造你的第二大脑",
    "Mac效率工具推荐：Raycast、Alfred等"
  ]
};

// 文章模板前缀
function generateArticle(category, topic) {
  const date = new Date().toISOString().split('T')[0];
  const slug = topic
    .replace(/[：:？?，,。.!！；;、\s]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return {
    slug,
    frontmatter: {
      title: topic,
      date,
      category,
      tags: generateTags(category, topic),
      description: `${topic} - 详细教程与实战指南`,
      draft: false
    }
  };
}

function generateTags(category, topic) {
  const base = [category];
  const keywordTags = {
    "Python": "Python",
    "AI": "AI",
    "LLM": "大模型",
    "GPT": "GPT",
    "Prompt": "Prompt工程",
    "Docker": "Docker",
    "Git": "Git",
    "Node": "Node.js",
    "VS Code": "VS Code"
  };
  
  for (const [keyword, tag] of Object.entries(keywordTags)) {
    if (topic.includes(keyword) && !base.includes(tag)) {
      base.push(tag);
    }
  }
  
  return base;
}

// ---- AI调用函数 ----

function callDeepSeek(prompt) {
  const apiKey = config.generation.model.apiKey;
  if (!apiKey) {
    console.log('⚠️  未配置 DeepSeek API Key，将使用本地模型');
    return callOllama(prompt);
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: config.generation.model.modelName,
      messages: [
        { role: "system", content: "你是一个资深技术作家，擅长用中文写清晰、实用的技术教程。你的文章结构完整、通俗易懂，适合技术新手和有经验的开发者。" },
        { role: "user", content: prompt }
      ],
      max_tokens: config.generation.maxTokens,
      temperature: 0.7
    });

    const url = new URL(config.generation.model.endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json.choices?.[0]?.message?.content || '');
        } catch (e) {
          reject(new Error(`DeepSeek API 解析失败: ${body.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: config.generation.localModel.modelName,
      prompt: `你是一个资深技术作家，擅长用中文写清晰、实用的技术教程。\n\n${prompt}`,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: config.generation.maxTokens
      }
    });

    const url = new URL(config.generation.localModel.endpoint);
    const mod = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = mod.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json.response || '');
        } catch (e) {
          reject(new Error(`Ollama 响应解析失败: ${body.slice(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Ollama 连接失败 (${err.message})。请确认 Ollama 正在运行。回退到模板生成模式。`));
    });
    
    req.write(data);
    req.end();
  });
}

// ---- 文章生成 Prompt ----

function buildPrompt(category, topic) {
  return `请写一篇技术教程文章。

## 要求
- 主题：${topic}
- 分类：${category}
- 语言：中文
- 字数：800-1200字
- 目标读者：有基础编程知识的开发者

## 文章结构
1. **标题**：${topic}
2. **导语**：1-2句话介绍文章要解决的问题
3. **正文**：
   - 分3-5个小节，每个小节有明确的小标题
   - 包含代码示例（用markdown代码块）
   - 包含实际应用场景
   - 步骤清晰，读者能跟着做
4. **总结**：回顾核心要点

## 注意事项
- 代码示例要完整、可运行
- 避免过于基础的讲解
- 实用为主，理论为辅
- 每段不要太长，便于阅读

请直接输出文章内容（不要额外说明）。`;
}

// ---- 保存文章 ----

function saveArticle(article, content) {
  const outputDir = path.join(__dirname, '..', config.content.outputDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `${article.slug}.md`;
  const filePath = path.join(outputDir, filename);

  let fullContent = `---\n`;
  for (const [key, val] of Object.entries(article.frontmatter)) {
    if (Array.isArray(val)) {
      fullContent += `${key}: [${val.map(v => `"${v}"`).join(', ')}]\n`;
    } else {
      fullContent += `${key}: "${val}"\n`;
    }
  }
  fullContent += `---\n\n`;

  // 如果AI返回了高质量内容就使用，否则用模板
  if (content && content.length > 100) {
    fullContent += content.trim();
  } else {
    fullContent += generateFallbackContent(article.frontmatter.title, article.frontmatter.category);
  }

  fs.writeFileSync(filePath, fullContent, 'utf-8');
  console.log(`✅ 已生成: ${filename}`);
  return filePath;
}

// ---- 备选模板（当AI不可用时使用） ----

function generateFallbackContent(title, category) {
  const date = new Date().toISOString().split('T')[0];
  
  return `
## 为什么需要了解${title}？

在当今快速发展的技术领域，掌握新工具和新技术是每个开发者的必修课。${title} 正是一个值得深入学习的主题。

## 核心概念

首先，让我们明确几个关键概念：

### 什么是核心原理？

任何技术都有其底层逻辑。理解这些原理能帮助我们更好地应用它。

\`\`\`python
# 这是一个示例代码
def hello_tech():
    """展示核心概念的简单示例"""
    print("学习新技术从基础开始")
    
hello_tech()
\`\`\`

### 实际应用场景

这项技术在实际项目中有广泛的应用：

1. **场景一**：提升开发效率
2. **场景二**：解决复杂问题
3. **场景三**：优化现有流程

## 实战演练

让我们通过一个实际项目来巩固学习：

\`\`\`python
# 实战示例
import time

def main():
    print("🚀 开始学习 ${title}")
    print("📅 学习日期: ${date}")
    
    steps = [
        "了解基本概念",
        "搭建开发环境",
        "动手写第一个示例",
        "深入理解原理"
    ]
    
    for i, step in enumerate(steps, 1):
        print(f"Step {i}: {step}")
        time.sleep(0.5)
    
    print("🎉 完成！继续前进！")

if __name__ == "__main__":
    main()
\`\`\`

## 进阶技巧

掌握了基础后，可以探索以下进阶方向：

- **优化性能**：寻找更高效的实现方式
- **与其他工具结合**：构建更强大的工作流
- **贡献开源**：参与社区建设

## 总结

${title} 是一个值得投入时间学习的主题。通过本文的学习，你应该已经掌握了基础知识，并能够开始自己的实践。记住，技术学习是一个持续的过程，保持好奇心和实践热情是最重要的。

*本文由 AI 编程实验室自动生成，如有不足欢迎指正。*
`;
}

// ---- 主流程 ----

async function main() {
  const args = process.argv.slice(2);
  const countIdx = args.indexOf('--count');
  const count = countIdx >= 0 ? parseInt(args[countIdx + 1]) || 1 : config.content.dailyPostCount || 1;
  const force = args.includes('--force');
  
  // 选择分类和主题
  const categories = config.content.categories;
  let generatedCount = 0;

  for (let i = 0; i < count; i++) {
    // 轮询分类
    const category = categories[i % categories.length];
    const topics = TOPICS[category] || TOPICS[Object.keys(TOPICS)[0]];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    // 检查是否已生成
    const slug = topic.replace(/[：:？?，,。.!！；;、\s]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
    const existingPath = path.join(__dirname, '..', config.content.outputDir, `${slug}.md`);
    
    if (fs.existsSync(existingPath) && !force) {
      console.log(`⏭️  跳过已存在的文章: ${slug}.md (使用 --force 强制重新生成)`);
      continue;
    }

    const article = generateArticle(category, topic);
    console.log(`\n📝 正在生成 [${i + 1}/${count}]: ${topic}`);
    
    let content = '';
    
    // 尝试用AI生成
    try {
      const prompt = buildPrompt(category, topic);
      
      if (config.generation.useLocal) {
        console.log('🤖 使用本地 Ollama 生成...');
        content = await callOllama(prompt);
      } else {
        console.log('☁️  使用 DeepSeek API 生成...');
        content = await callDeepSeek(prompt);
      }
      
      if (content.length < 50) {
        console.log('⚠️  AI返回内容太短，使用模板');
        content = '';
      }
    } catch (err) {
      console.log(`⚠️  AI 生成失败: ${err.message}`);
      console.log('📄 使用模板内容...');
    }

    // 保存文章
    saveArticle(article, content);
    generatedCount++;

    // 避免太快请求
    if (i < count - 1 && !config.generation.useLocal) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n🎉 完成！本次生成了 ${generatedCount} 篇文章。`);
  console.log(`📁 位置: ${path.join(__dirname, '..', config.content.outputDir)}`);
}

// 创建日志目录
const logDir = path.join(__dirname, '..', 'content', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

main().catch(err => {
  console.error('❌ 出错:', err.message);
  process.exit(1);
});
