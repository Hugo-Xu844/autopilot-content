"""
电子书 Markdown → 精美 HTML
用法: python scripts/to-html.py
结果：在 content/products/html/ 目录生成 .html 文件
       用浏览器打开 → Ctrl+P → 另存为 PDF
"""

import re
import markdown
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent
PRODUCTS_DIR = ROOT / "content" / "products"
OUTPUT_DIR = ROOT / "content" / "products" / "html"

BOOK_NAMES = {
    "python-basics": "Python编程入门到精通",
    "ai-beginners": "AI入门完全指南",
    "ai-tools": "2025 AI工具评测大全",
    "coding-practice": "编程实战项目合集",
    "prompt-master": "Prompt工程大师课",
}

PRICES = {
    "python-basics": "¥19.9",
    "ai-beginners": "¥19.9",
    "ai-tools": "¥9.9",
    "coding-practice": "¥29.9",
    "prompt-master": "¥14.9",
}

CSS = """
@page {
    size: A5;
    margin: 2cm 1.8cm;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 11pt;
    line-height: 1.8;
    color: #1a1a2e;
    max-width: 700px;
    margin: 0 auto;
    padding: 20px;
}
.cover {
    text-align: center;
    padding: 120px 0 60px;
    page-break-after: always;
}
.cover h1 {
    font-size: 26pt;
    font-weight: 800;
    color: #6366f1;
    margin-bottom: 16px;
}
.cover .price {
    display: inline-block;
    margin-top: 20px;
    padding: 8px 32px;
    background: #6366f1;
    color: white;
    border-radius: 8px;
    font-size: 16pt;
    font-weight: 700;
}
.cover .meta {
    margin-top: 40px;
    color: #94a3b8;
    font-size: 9pt;
}
.toc { page-break-after: always; margin-bottom: 40px; }
.toc h2 {
    font-size: 14pt;
    color: #6366f1;
    border-bottom: 2px solid #6366f1;
    padding-bottom: 8px;
    margin-bottom: 16px;
}
h1 { font-size: 18pt; margin: 40px 0 16px; color: #1a1a2e; page-break-before: always; }
h1:first-of-type { page-break-before: avoid; }
h2 { font-size: 14pt; margin: 28px 0 12px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
h3 { font-size: 12pt; margin: 20px 0 10px; color: #475569; }
p { margin-bottom: 10px; }
ul, ol { margin: 8px 0 12px 20px; }
li { margin-bottom: 4px; }
code {
    background: #f1f5f9;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 9pt;
    font-family: Consolas, monospace;
    color: #4f46e5;
}
pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 14px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 14px 0;
    font-size: 8.5pt;
    line-height: 1.5;
    font-family: Consolas, monospace;
}
pre code { background: none; padding: 0; color: inherit; }
table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 9.5pt; }
th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
th { background: #eef2ff; color: #4f46e5; font-weight: 600; }
blockquote {
    border-left: 4px solid #6366f1;
    padding: 10px 16px;
    margin: 14px 0;
    background: #f8f9ff;
    color: #64748b;
}
hr { margin: 30px 0; border: none; border-top: 1px solid #e2e8f0; }
.footer-page { 
    text-align: center; padding: 100px 0; color: #94a3b8; font-size: 10pt;
    page-break-before: always;
}
@media print {
    body { padding: 0; }
}
"""

def parse_md(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    body = re.sub(r"^---[\s\S]*?---\n*", "", content).strip()
    title_match = re.search(r"^# (.+)$", body, re.MULTILINE)
    title = title_match.group(1) if title_match else filepath.stem

    # 提取标题作为目录
    toc_items = re.findall(r"^## (.+)$", body, re.MULTILINE)
    
    return title, body, toc_items

def build_html(title, body, toc_items, filename):
    book_name = BOOK_NAMES.get(filename, title)
    price = PRICES.get(filename, "¥9.9")
    
    # 提取章标题用于目录
    chapter_nums = re.findall(r"^第\s*\d+\s*[章节章].*$", body, re.MULTILINE)
    
    # markdown → html
    html_body = markdown.markdown(body, extensions=["fenced_code", "tables", "codehilite"])
    
    # 目录
    toc_html = ""
    if toc_items:
        toc_html = '<div class="toc"><h2>📖 目录</h2>'
        for i, item in enumerate(toc_items[:20], 1):
            toc_html += f'<p style="padding:3px 0;border-bottom:1px dotted #eee">{i}. {item}</p>'
        toc_html += "</div>"

    date_str = datetime.now().strftime("%Y年%m月%d日")
    
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>{book_name}</title>
<style>{CSS}</style>
</head>
<body>

<div class="cover">
    <h1>{book_name}</h1>
    <p style="color:#64748b;font-size:11pt;margin-top:8px;">精选教程合集</p>
    <div class="price">{price}</div>
    <p class="meta">生成日期: {date_str}<br>{len(toc_items)} 篇精选文章</p>
</div>

{toc_html}

<div class="content">
{html_body}
</div>

<div class="footer-page">
    <p>— END —</p>
    <p style="margin-top:12px;font-size:9pt;color:#94a3b8;">
        更多教程: https://hugo-xu844.github.io/autopilot-content/
    </p>
</div>

</body>
</html>"""

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    files = list(PRODUCTS_DIR.glob("*.md"))
    if not files:
        print("❌ 没找到 .md 文件")
        return
    
    print(f"📚 找到 {len(files)} 个电子书\n")
    
    for f in files:
        name = f.stem
        print(f"📖 转换: {name}")
        title, body, toc = parse_md(f)
        html = build_html(title, body, toc, name)
        
        out_path = OUTPUT_DIR / f"{name}.html"
        out_path.write_text(html, encoding="utf-8")
        
        print(f"   ✅ {out_path.name}")
    
    print(f"\n🎉 全部完成！")
    print(f"📁 HTML 文件在: {OUTPUT_DIR}")
    print(f"\n📌 操作步骤:")
    print(f"   1. 打开上面的 HTML 文件（双击就行）")
    print(f"   2. 浏览器里 Ctrl+P")
    print(f"   3. 「目标打印机」选「另存为 PDF」")
    print(f"   4. 点保存 → 拿去上架卖！")

if __name__ == "__main__":
    main()
