/**
 * run-all.js — 一键运行：生成内容 → 构建网站 → 生成产品 → 部署
 * 
 * 用法: node scripts/run-all.js [--generate-only] [--build-only] [--deploy-only]
 * 
 * 不带参数则执行完整流程
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPTS_DIR = __dirname;
const ROOT = path.join(SCRIPTS_DIR, '..');

function runScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, scriptName);
    if (!fs.existsSync(scriptPath)) {
      console.log(`\n⚠️  脚本不存在: ${scriptName}`);
      resolve(false);
      return;
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`▶️  运行: ${scriptName} ${args.join(' ')}`);
    console.log(`${'='.repeat(50)}\n`);

    const child = spawn('node', [scriptPath, ...args], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`${scriptName} 退出码: ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const generateOnly = args.includes('--generate-only');
  const buildOnly = args.includes('--build-only');
  const deployOnly = args.includes('--deploy-only');

  console.log('🤖 AI 编程实验室 - 全自动工作流\n');
  console.log(`⏰ ${new Date().toLocaleString('zh-CN')}\n`);

  const steps = [];

  if (buildOnly) {
    steps.push({ script: 'build-site.js', label: '构建网站' });
  } else if (deployOnly) {
    steps.push({ script: 'deploy.js', label: '部署到 GitHub Pages' });
  } else if (generateOnly) {
    steps.push({ script: 'generate-content.js', args: ['--count', '2'], label: '生成内容' });
    steps.push({ script: 'build-site.js', label: '构建网站' });
    steps.push({ script: 'generate-product.js', label: '生成信息产品' });
  } else {
    // 完整流程
    steps.push({ script: 'generate-content.js', args: ['--count', '2'], label: '生成内容' });
    steps.push({ script: 'build-site.js', label: '构建网站' });
    steps.push({ script: 'generate-product.js', label: '生成信息产品' });
    steps.push({ script: 'deploy.js', label: '部署到 GitHub Pages' });
  }

  let completed = 0;
  let failed = 0;

  for (const step of steps) {
    try {
      await runScript(step.script, step.args || []);
      completed++;
    } catch (err) {
      console.error(`\n❌ ${step.label} 失败: ${err.message}`);
      failed++;
      // 根据用户选择是否继续
      if (deployOnly || generateOnly || buildOnly) {
        break;
      }
      console.log('   继续执行下一步...\n');
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 执行结果`);
  console.log(`${'='.repeat(50)}`);
  console.log(`   ✅ 完成: ${completed}/${steps.length}`);
  if (failed > 0) console.log(`   ❌ 失败: ${failed}`);
  
  if (completed > 0) {
    const siteDir = path.join(ROOT, 'site');
    const postCount = fs.existsSync(path.join(ROOT, 'content', 'posts')) 
      ? fs.readdirSync(path.join(ROOT, 'content', 'posts')).length : 0;
    const productCount = fs.existsSync(path.join(ROOT, 'content', 'products'))
      ? fs.readdirSync(path.join(ROOT, 'content', 'products')).length : 0;
    
    console.log(`\n📈 当前状态:`);
    console.log(`   📝 文章数: ${postCount} 篇`);
    console.log(`   📚 产品数: ${productCount} 个`);
    console.log(`   📁 网站位于: site/`);
    console.log(`\n💡 打开 site/index.html 预览效果`);
  }
}

main().catch(err => {
  console.error('\n❌ 运行失败:', err.message);
  process.exit(1);
});
