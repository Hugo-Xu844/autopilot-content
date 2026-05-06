---
title: "VS Code 20个必装插件，开发效率翻倍"
date: "2026-05-06"
category: "效率工具"
tags: ["效率工具", "VS Code"]
description: "VS Code 20个必装插件，开发效率翻倍 - 详细教程与实战指南"
draft: "false"
---

# VS Code 20个必装插件，开发效率翻倍

写代码时频繁切换窗口、手动格式化代码、调试时反复加`console.log`？这些痛点是时候终结了。本文精选20款VS Code插件，覆盖编码、调试、协作和界面优化四大场景，帮你把开发效率拉满。

## 一、编码加速器：让写代码像开挂

### 1. Prettier - Code formatter
自动格式化代码，团队协作时统一风格。安装后只需在项目根目录创建`.prettierrc`：

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2
}
```

然后开启“保存时格式化”：在VS Code设置中搜索`editor.formatOnSave`，勾选即可。

### 2. ESLint
代码质量守护者，实时检测语法错误和风格问题。配合Prettier使用，先在项目安装：

```bash
npm install eslint prettier eslint-config-prettier -D
```

然后在`.eslintrc.js`中配置：

```js
module.exports = {
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off'
  }
};
```

**场景**：团队新成员提交的代码经常有未定义变量，ESLint在保存时自动标红，省去Code Review的琐碎纠错。

### 3. Path Intellisense
智能路径补全，再也不用手动输入`../../utils/`。输入`./`或`../`时自动弹出文件列表，支持`@`别名映射。

### 4. GitLens — Git supercharged
在每一行代码旁显示最后修改者、提交时间和commit message。右键还能快速查看文件的完整修改历史。

**场景**：排查“这行代码是谁改的”时，不需要打开终端敲`git blame`，鼠标悬停即可看到。

### 5. Error Lens
错误信息直接显示在代码行尾，不用再把鼠标移到波浪线上查看提示。红色波浪线+文字说明，一眼定位问题。

## 二、调试与测试：告别console.log

### 6. Debugger for Chrome / JavaScript Debugger
直接在VS Code里打断点调试前端代码。按`F5`启动，选择“Chrome”环境，配置`launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

**场景**：调试复杂的状态逻辑时，在`useEffect`里打上断点，逐行执行查看变量变化，比`console.log`高效10倍。

### 7. Jest
运行和调试Jest测试用例的专用插件。自动发现测试文件，在测试代码行旁��示运行按钮。支持单用例执行、断点调试。

### 8. REST Client
替代Postman，在VS Code里直接发送HTTP请求。创建`.http`文件：

```
### 获取用户列表
GET https://api.example.com/users
Authorization: Bearer {{token}}

### 创建用户
POST https://api.example.com/users
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com"
}
```

点击“Send Request”，结果直接显示在右侧面板，支持环境变量和请求历史。

## 三、协作与项目管理：团队效率倍增器

### 9. Live Share
实时协作编辑代码，类似Google Docs的协同体验。点击侧边栏的Live Share图标，生成分享链接，队友加入后能同时编辑、跟踪光标位置、共享终端。

**场景**：远程Pair Programming时，不用再截图或录屏，直接共享编辑器，双方都能运行代码。

### 10. GitHub Pull Requests and Issues
在VS Code内完成PR的创建、审查和合并。打开GitHub面板，查看PR列表，添加评论，甚至直接修改代码并提交。

### 11. TODO Highlight
高亮代码中的`TODO`、`FIXME`、`HACK`等注释。在设置中自定义关键词：

```json
"todohighlight.keywords": [
  {
    "text": "TODO",
    "color": "#ff6600",
    "backgroundColor": "#fff3cd"
  },
  {
    "text": "FIXME",
    "color": "#ff0000",
    "backgroundColor": "#f8d7da"
  }
]
```

**场景**：在大型项目中快速定位遗留问题，双击TODO注释直接跳到代码位置。

### 12. Project Manager
管理多个项目，一键切换。按`Ctrl+Shift+P`，输入“Project Manager: Save Project”，保存当前工作区。之后通过侧边栏快速打开。

## 四、界面与体验优化：让编辑器更顺手

### 13. Material Icon Theme
为文件和文件夹提供精美的图标，一眼识别文件类型。安装后在设置中搜索`workbench.iconTheme`，选择`material-icon-theme`。

### 14. Bracket Pair Colorizer 2
给不同层级的括号着色，嵌套代码结构一目了然。支持圆括号、方括号、花括号等。

**场景**：处理React组件的多层回调时，括号匹配不再眼花缭乱。

### 15. Indent-Rainbow
缩进级别用彩虹色区分，快速定位缩进错误。在设置中调整颜色：

```json
"indentRainbow.colors": [
  "rgba(255,255,64,0.07)",
  "rgba(127,255,127,0.07)",
  "rgba(255,127,255,0.07)",
  "rgba(79,236,236,0.07)"
]
```

### 16. Code Runner
一键运行代码片段，支持40+种语言。选中代码后按`Ctrl+Alt+N`，结果输出在OUTPUT面板。适合快速测试小逻辑。

### 17. Better Comments
让注释更清晰：红色表示警告，绿色表示提示，蓝色表示TODO。在注释前添加特定标记：

- `// !` 红色警告
- `// ?` 蓝色疑问
- `// *` 绿色高亮
- `// TODO` 橙色待办

### 18. Markdown Preview Enhanced
实时预览Markdown文件，支持图表、数学公式、目录生成。写技术文档时，按`Ctrl+K V`打开侧边预览。

### 19. Remote - SSH
远程连接服务器开发，本地编辑远程代码。配置`~/.ssh/config`后，在VS Code中点击“Remote Explorer”选择服务器，就像在本地开发一样流畅。

**场景**：开发部署在Linux服务器上的后端服务时，不需要在服务器上装图形界面，本地用VS Code就能编辑、调试。

### 20. Settings Sync
同步所有设置、插件、快捷键到GitHub Gist。换电脑时一键恢复，告别手动配置。按`Shift+Alt+U`上传，`Shift+Alt+D`下载。

## 总结

这20个插件覆盖了编码、调试、协作和界面四大维度，没有一个是“花架子”。安装后建议花10分钟配置关键设置（如Prettier的保存时格式化、ESLint的规则），然后立刻在项目中体验效果。你会发现，过去需要手动完成的重复操作，现在都被自动化了。开发效率翻倍，从这20个插件开始。