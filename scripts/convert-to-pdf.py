"""
电子书 Markdown → PDF 转换器
用法: python scripts/convert-to-pdf.py
"""

import os
import sys
import re
from pathlib import Path

# 安装 weasyprint + markdown
try:
    from weasyprint import HTML
except ImportError:
    print("正在安装 weasyprint...")
    os.system("pip install weasyprint markdown")
    from weasyprint import HTML

import markdown

# 配置
ROOT = Path(__file__).parent.parent
PRODUCTS_DIR = ROOT / "content" / "products"
OUTPUT_DIR = ROOT / "content" / "products" / "pdf"

# 书名映射
BOOK_NAMES = {
    "python-basics": "Python编程入门到精通",
    "ai-beginners": "AI入门完全指南",
    "ai-tools": "2025 AI工具评测大全",
    "coding-practice": "编程实战项目合集",
    "prompt-master": "Prompt工程大师课",
}

def parse_markdown(filepath):
    """解析 markdown 文件，提取标题和正文"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 去掉 frontmatter (--- 之间的内容)
    body = re.sub(r"^---[\s\S]*?---\n*", "", content).strip()
    
    # 提取标题
    title_match = re.search(r"^# (.+)$", body, re.MULTILINE)
    title = title_match.group(1) if title_match else filepath.stem
    
    return title, body

def build_html(title, body, filename):
    """构建带样式的 HTML"""
    
    # 将 markdown 转为 HTML
    html_body = markdown.markdown(
        body,
        extensions=["fenced_code", "codehilite", "tables", "sane_lists"]
    )
    
    # 书名
    book_name = BOOK_NAMES.get(filename, title)
    
    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>
    @page {{
        size: A5;
        margin: 2cm 1.8cm;
        @bottom-center {{
            content: counter(page) " / " counter(pages);
            font-size: 9px;
            color: #999;
        }}
    }}
    
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    
    body {{
        font-family: -apple-system, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
        font-size: 11pt;
        line-height: 1.8;
        color: #1a1a2e;
    }}
    
    /* 封面页 */
    .cover {{
        page-break-after: always;
        text-align: center;
        padding-top: 40%;
    }}
    
    .cover h1 {{
        font-size: 24pt;
        font-weight: 800;
        color: #6366f1;
        margin-bottom: 16px;
        letter-spacing: 2px;
    }}
    
    .cover .subtitle {{
        font-size: 12pt;
        color: #64748b;
        margin-bottom: 40px;
    }}
    
    .cover .meta {{
        font-size: 10pt;
        color: #94a3b8;
        line-height: 2;
    }}
    
    /* 目录页 */
    .toc {{
        page-break-after: always;
    }}
    
    .toc h2 {{
        font-size: 16pt;
        margin-bottom: 20px;
        color: #6366f1;
        border-bottom: 2px solid #6366f1;
        padding-bottom: 8px;
    }}
    
    .toc-item {{
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px dotted #e2e8f0;
        font-size: 10pt;
    }}
    
    .toc-num {{
        color: #6366f1;
        font-weight: 600;
        margin-right: 12px;
    }}
    
    /* 正文 */
    h1 {{ font-size: 18pt; margin: 32px 0 16px; color: #1a1a2e; page-break-before: always; }}
    h1:first-child {{ page-break-before: avoid; }}
    h2 {{ font-size: 14pt; margin: 24px 0 12px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }}
    h3 {{ font-size: 12pt; margin: 18px 0 10px; color: #475569; }}
    p {{ margin-bottom: 10px; text-align: justify; }}
    
    ul, ol {{ margin: 8px 0 12px 20px; }}
    li {{ margin-bottom: 4px; }}
    
    code {{
        background: #f1f5f9;
        padding: 1px 6px;
        border-radius: 3px;
        font-size: 9pt;
        font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
        color: #4f46e5;
    }}
    
    pre {{
        background: #1e293b;
        color: #e2e8f0;
        padding: 14px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 14px 0;
        font-size: 8.5pt;
        line-height: 1.5;
        font-family: "JetBrains Mono", Consolas, monospace;
    }}
    
    pre code {{
        background: none;
        padding: 0;
        color: inherit;
        font-size: inherit;
    }}
    
    table {{
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0;
        font-size: 9.5pt;
    }}
    
    th, td {{
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
    }}
    
    th {{
        background: #eef2ff;
        color: #4f46e5;
        font-weight: 600;
    }}
    
    blockquote {{
        border-left: 4px solid #6366f1;
        padding: 10px 16px;
        margin: 14px 0;
        background: #f8f9ff;
        color: #64748b;
        font-style: italic;
    }}
    
    a {{ color: #6366f1; text-decoration: none; }}
    
    img {{ max-width: 100%; margin: 14px 0; }}
    
    /* 尾页 */
    .footer-page {{
        page-break-before: always;
        text-align: center;
        padding-top: 30%;
        color: #94a3b8;
        font-size: 10pt;
    }}
</style>
</head>
<body>

<!-- 封面 -->
<div class="cover">
    <h1>{book_name}</h1>
    <p class="subtitle">AI 编程实验室 · 出品</p>
    <p class="meta">
        收录文章 • 精选整理<br>
        生成日期: {__import__("datetime").datetime.now().strftime("%Y年%m月%d日")}
    </p>
</div>

<!-- 正文 -->
<div class="content">
{html_body}
</div>

<!-- 尾页 -->
<div class="footer-page">
    <p>— 感谢阅读 —</p>
    <p style="margin-top: 12px; font-size: 9pt;">
        本文由 AI 编程实验室自动生成<br>
        https://hugo-xu844.github.io/autopilot-content/
    </p>
</div>

</body>
</html>"""
    return html

def main():
    # 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    md_files = list(PRODUCTS_DIR.glob("*.md"))
    
    if not md_files:
        print("❌ content/products/ 目录下没有找到 .md 文件")
        return
    
    print(f"📚 找到 {len(md_files)} 个电子书\n")
    
    for md_file in md_files:
        filename = md_file.stem  # 不含扩展名
        print(f"📖 正在转换: {filename}")
        
        try:
            # 解析 markdown
            title, body = parse_markdown(md_file)
            
            # 提取目录（h1/h2 标题）
            headings = re.findall(r"^#+\s+(.+)$", body, re.MULTILINE)
            
            # 构建 HTML
            html_content = build_html(title, body, filename)
            
            # 生成 PDF
            pdf_path = OUTPUT_DIR / f"{filename}.pdf"
            HTML(string=html_content).write_pdf(str(pdf_path))
            
            size_kb = pdf_path.stat().st_size / 1024
            print(f"   ✅ {pdf_path.name} ({size_kb:.0f}KB)")
            
        except Exception as e:
            print(f"   ❌ 失败: {e}")
    
    print(f"\n🎉 全部完成！PDF 保存在: {OUTPUT_DIR}")
    print("现在去面包多 (https://mbd.pub) 上架即可售卖")

if __name__ == "__main__":
    main()
