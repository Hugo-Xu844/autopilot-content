"""
清理电子书中的AI生成声明文字，并重新生成干净的HTML
"""

import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
MD_DIR = ROOT / "content" / "products"
HTML_DIR = ROOT / "content" / "products" / "html"

# 需要删除的段落标记（整段删除）
REMOVE_PATTERNS = [
    r"^\*\*声明：\*\*\s*本内容由 .*? 自动整理生成.*?(?=\n\n|\n---|\Z)",
    r"^> \*\*声明：\*\*\s*本内容由 .*? 自动整理生成.*?(?=\n\n|\n---|\Z)",
    r"\*\*声明：\*\*\s*本内容由.*?整理生成，仅供参考学习。",
    r"^---\n\n\*\*声明：\*\*.*?(?=\n#|\n##)",
    r"^---\n\n\*\*声明：\*\*\n.*?(?=\n#|\n##)",
]

# 需要删除的单独行（整行删除）
REMOVE_LINES = [
    r"^\*本文由 .*? 自动生成.*$",
    r"^\*本文由.*?生成，如有不足.*$",
    r"^- 来源：.*$",
    r"^来源：.*$",
    r"^\*如果觉得有帮助.*$",
]

# 需要替换的文本
REPLACE_TEXTS = {
    "AI 编程实验室 · 精选教程": "精选教程合集",
    "由 AI 编程实验室自动生成\n": "",
    "AI 编程实验室 · 出品": "精选教程合集",
    "AI 编程实验室": "技术教程",
}

def clean_md(content):
    """清理 markdown 内容中的生成声明"""
    # 删除整段声明
    for pattern in REMOVE_PATTERNS:
        content = re.sub(pattern, "", content, flags=re.DOTALL | re.MULTILINE)
    
    # 删除特定行
    lines = content.split("\n")
    cleaned = []
    for line in lines:
        skip = False
        for pattern in REMOVE_LINES:
            if re.match(pattern, line):
                skip = True
                break
        if not skip:
            cleaned.append(line)
    
    content = "\n".join(cleaned)
    
    # 替换特定文本
    for old, new in REPLACE_TEXTS.items():
        content = content.replace(old, new)
    
    # 清理多余的空行
    content = re.sub(r"\n{4,}", "\n\n\n", content)
    
    return content.strip()

def main():
    md_files = list(MD_DIR.glob("*.md"))
    
    for md_file in md_files:
        print(f"🧹 清理: {md_file.name}")
        
        content = md_file.read_text(encoding="utf-8")
        cleaned = clean_md(content)
        md_file.write_text(cleaned, encoding="utf-8")
        
        print(f"   ✅ {md_file.name} 清理完成")
    
    print(f"\n🎉 5个文件全部清理完成！")
    print(f"现在重新运行: python scripts/to-html.py 生成干净的HTML")

if __name__ == "__main__":
    main()
