/**
 * deploy.js — GitHub Pages 自动部署
 * 
 * 用法: node scripts/deploy.js [--message "部署信息"]
 * 
 * 将 site/ 目录推送到 GitHub Pages
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8'));
const ROOT = path.join(__dirname, '..');
const SITE_DIR = path.join(ROOT, 'site');

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  return execSync(cmd, { 
    cwd: ROOT, 
    stdio: 'pipe',
    encoding: 'utf-8',
    ...opts
  });
}

async function main() {
  const args = process.argv.slice(2);
  const msgIdx = args.indexOf('--message');
  const customMsg = msgIdx >= 0 ? args[msgIdx + 1] : null;

  console.log('🚀 开始部署到 GitHub Pages...\n');

  // 检查 site 目录
  if (!fs.existsSync(SITE_DIR)) {
    console.error('❌ site/ 目录不存在，请先运行 build-site.js');
    process.exit(1);
  }

  const siteFiles = fs.readdirSync(SITE_DIR);
  if (siteFiles.length === 0) {
    console.error('❌ site/ 目录为空，请先运行 build-site.js');
    process.exit(1);
  }

  // 检查 git 配置
  try {
    const userName = run('git config user.name').trim();
    const userEmail = run('git config user.email').trim();
    console.log(`👤 Git 用户: ${userName} <${userEmail}>`);
  } catch {
    console.log('⚠️  Git 用户未配置，部署可能需要配置');
  }

  // 检查是否已初始化 git
  let isRepo = false;
  try {
    run('git rev-parse --git-dir');
    isRepo = true;
    console.log('📂 Git 仓库已初始化');
  } catch {
    console.log('📂 正在初始化 Git 仓库...');
    run('git init');
  }

  // 确保有 .gitignore
  const gitignorePath = path.join(ROOT, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    const ignores = [
      'node_modules/',
      '.env',
      '*.log',
      'content/posts/*.md',
      'site/posts/*.html',
      'site/index*.html',
      'site/categories/',
      'site/products.html'
    ];
    fs.writeFileSync(gitignorePath, ignores.join('\n') + '\n');
    console.log('📝 已创建 .gitignore');
  }

  // 创建 CNAME 文件（如果需要自定义域名）
  // 暂不创建

  // 添加 site/ 到 git
  console.log('\n📦 添加文件到 Git...');
  try {
    run('git add site/');
    const status = run('git status --porcelain');
    
    if (!status.trim()) {
      console.log('   ℹ️  没有变更需要部署');
      return;
    }

    const dateStr = new Date().toISOString().replace(/T/, ' ').slice(0, 19);
    const msg = customMsg || `自动部署: ${dateStr}`;
    run(`git commit -m "${msg}"`);

    // 检查是否有远程仓库
    let remoteUrl = '';
    try {
      remoteUrl = run('git remote get-url origin').trim();
      console.log(`🌐 远程仓库: ${remoteUrl}`);
    } catch {
      console.log('\n⚠️  未配置远程仓库！');
      const repoUrl = config.deploy.repoUrl || '';
      if (repoUrl) {
        console.log(`   正在添加: ${repoUrl}`);
        run(`git remote add origin ${repoUrl}`);
        remoteUrl = repoUrl;
      } else {
        console.log('   请在 config.json 中配置 deploy.repoUrl');
        console.log('   或手动运行:');
        console.log('     git remote add origin https://github.com/你的用户名/你的仓库.git');
        console.log('     git push -u origin main');
        process.exit(0);
      }
    }

    // 推送到 GitHub Pages 分支
    console.log('\n⬆️  推送到 GitHub...');
    const branch = config.deploy.branch || 'gh-pages';
    
    console.log(`   目标分支: ${branch}`);
    
    // 使用 subtree 或直接推送
    console.log('   正在推送...');
    try {
      // 简单方式: 只推送 site/ 子目录到 gh-pages 分支
      run(`git push origin HEAD:${branch} --force`);
      console.log('\n✅ 部署成功！');
    } catch (pushErr) {
      console.log(`\n⚠️  推送失败: ${pushErr.message}`);
      console.log('   可能的原因:');
      console.log('   1. 远程仓库不存在');
      console.log('   2. 没有推送权限');
      console.log('   3. 网络连接问题');
      console.log('\n   请检查后手动运行:');
      console.log(`   git push origin HEAD:${branch} --force`);
    }
  } catch (err) {
    console.error(`\n❌ 部署失败: ${err.message}`);
    process.exit(1);
  }
}

main();
