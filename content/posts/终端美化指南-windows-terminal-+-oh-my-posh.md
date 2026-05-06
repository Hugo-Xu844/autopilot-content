---
title: "终端美化指南：Windows Terminal + Oh My Posh"
date: "2026-05-06"
category: "效率工具"
tags: ["效率工具"]
description: "终端美化指南：Windows Terminal + Oh My Posh - 详细教程与实战指南"
draft: "false"
---

# 终端美化指南：Windows Terminal + Oh My Posh

每天面对黑底白字的默认终端，你是否也感到审美疲劳？一个美观且信息丰富的终端不仅能提升编码心情，还能让 Git 状态、命令执行时间等关键信息一目了然。本文将带你一步步把 Windows 终端打造成既好看又实用的开发利器。

## 1. 安装 Windows Terminal

如果你还在用老旧的 cmd 或 PowerShell 控制台，第一步就是升级到 Windows Terminal。它支持多标签页、GPU 加速渲染，以及丰富的个性化配置。

**安装方式（任选其一）：**
- Microsoft Store：搜索 "Windows Terminal" 直接安装
- winget 命令：`winget install Microsoft.WindowsTerminal`

安装后，建议将 Windows Terminal 设为默认终端应用。打开设置 → 启动 → 默认终端应用程序，选择 "Windows Terminal"。

## 2. 安装 Nerd Fonts 字体

要让 Oh My Posh 显示漂亮的图标，必须先安装一款支持图标字体的 Nerd Font。推荐 **MesloLGM Nerd Font**，它的连字效果和图标支持都很出色。

**下载与安装：**
1. 前往 [Nerd Fonts 官网](https://www.nerdfonts.com/font-downloads) 下载 Meslo 字体包
2. ��压后，全选所有 `.ttf` 文件，右键选择 "为所有用户安装"
3. 打开 Windows Terminal 设置，在配置文件 → PowerShell → 外观中，将字体改为 "MesloLGM Nerd Font"

> 小技巧：如果字体列表里找不到，重启 Windows Terminal 即可。

## 3. 安装 Oh My Posh

Oh My Posh 是一个跨平台的终端提示符美化工具，支持自定义主题、显示 Git 分支、Python 虚拟环境、命令执行时间等。

**通过 winget 安装（推荐）：**
```powershell
winget install JanDeDobbeleer.OhMyPosh
```

**或通过 PowerShell Gallery 安装：**
```powershell
Install-Module oh-my-posh -Scope CurrentUser
```

安装完成后，初始化 Oh My Posh。在 PowerShell 配置文件中添加以下内容：

```powershell
# 编辑 $PROFILE
notepad $PROFILE

# 如果提示文件不存在，先创建：
New-Item -Path $PROFILE -Type File -Force
```

在配置文件中加入：
```powershell
oh-my-posh init pwsh | Invoke-Expression
```

保存后重新加载配置：`. $PROFILE`

## 4. 选择与配置主题

Oh My Posh 内置了 100+ 主题，执行以下命令可以预览所有主题：

```powershell
Get-PoshThemes
```

选择一个你喜欢的主题（例如 `powerlevel10k_lean`），然后永久启用：

```powershell
# 在 $PROFILE 中修改
oh-my-posh init pwsh --config "$env:POSH_THEMES_PATH/powerlevel10k_lean.omp.json" | Invoke-Expression
```

**自定义主题**：如果你对现有主题不满意，可以复制一份主题文件进行修改。主题文件是 JSON 格式，你可以调整颜色、显示哪些模块（如 Git、时间、Python 版本等）。例如，创建一个自定义主题：

```powershell
# 复制默认主题
cp "$env:POSH_THEMES_PATH/powerlevel10k_lean.omp.json" "$env:POSH_THEMES_PATH/mytheme.omp.json"

# 用 VSCode 编辑
code "$env:POSH_THEMES_PATH/mytheme.omp.json"
```

在 JSON 中，`"blocks"` 数组定义了提示符的结构，`"segments"` 定义了各个信息模块。你可以删除不需要的模块，或调整 `"style"` 属性改变显示样式。

## 5. 美化 Windows Terminal 配色

最后一步，搭配一套舒适的配色方案。推荐 **Catppuccin** 或 **Dracula** 配色。

**以 Catppuccin 为例：**
1. 下载 [catppuccin.json](https://github.com/catppuccin/windows-terminal/blob/main/themes/catppuccin-macchiato.json)
2. 在 Windows Terminal 设置 → 配色方案 → 添加，导入该 JSON 文件
3. 在配置文件 → PowerShell → 外观中，选择 "Catppuccin Macchiato"

**完整效果示例：**
```powershell
# 最终 $PROFILE 内��
oh-my-posh init pwsh --config "$env:POSH_THEMES_PATH/mytheme.omp.json" | Invoke-Expression

# 设置别名（可选）
Set-Alias ll ls
Set-Alias g git
```

重启 Windows Terminal，你应该能看到：
- 左侧显示当前目录和 Git 分支
- 右侧显示命令执行时间和 Python 版本
- 漂亮的彩色图标和清晰的信息层级

## 总结

通过以上五步，你将拥有一个既美观又高效的开发终端：
1. **Windows Terminal** 提供现代化的终端体验
2. **Nerd Fonts** 确保图标正常显示
3. **Oh My Posh** 提供丰富的主题和自定义能力
4. **个性化主题** 让你按需调整信息展示
5. **配色方案** 提升视觉舒适度

现在，打开你的终端，享受编码的每一刻吧！