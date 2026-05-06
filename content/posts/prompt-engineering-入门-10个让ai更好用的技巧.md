---
title: "Prompt Engineering 入门：10个让AI更好用的技巧"
date: "2026-05-06"
category: "AI入门教程"
tags: ["AI入门教程", "AI", "Prompt工程"]
description: "Prompt Engineering 入门：10个让AI更好用的技巧 - 详细教程与实战指南"
draft: "false"
---

# Prompt Engineering 入门：10个让AI更好用的技巧

你费尽心思写了一个prompt，AI却答非所问？这不是AI笨，而是你没有掌握正确的提问方式。Prompt Engineering（提示工程）就是教你如何用精准的语言，让AI输出你想要的结果。本文分享10个经过实战验证的技巧，帮你从"AI对话小白"变成"提示词高手"。

## 一、基础结构：让AI听懂你的指令

### 1. 明确角色 + 任务 + 输出格式
最基础的prompt结构包含三个要素：你是谁、要做什么、结果长什么样。

**错误示例：**
```
帮我写一段代码。
```

**正确示例：**
```markdown
你是一位资深Python开发者。请编写一个函数，读取CSV文件并统计每列的平均值。输出格式为：函数定义 + 注释说明 + 使用示例。
```

**技巧2：使用分隔符明确边界**
当prompt包含多段内容时，用分隔符让AI清晰区分指令和材料。

```
请分析以下销售数据（用```括起来的部分），生成一份周报摘要：
```
日期,销售额,新客户数
2024-01-01,50000,12
2024-01-02,62000,15
```
要求：用三句话总结趋势，突出增长点和风险点。
```

## 二、进阶技巧：控制AI的思考过程

### 3. 分步指令（Chain-of-Thought）
复杂任务让AI"先思考再回答"，能显著提升准确性。

**不好的prompt：**
```
计算 15 * 8 + 32 / 4 的结果。
```

**好的prompt：**
```
逐步计算以下表达式，每一步都写出中间结果：
表达式：15 * 8 + 32 / 4
步骤1：先算乘法 15 * 8 = 120
步骤2：再算除法 32 / 4 = 8
步骤3：最后加法 120 + 8 = 128
最终答案：128
```

### 4. 少样本学习（Few-shot Learning）
给AI提供2-3个示例，让它模仿你的模式。

```
请将以下中文句子翻译成英文，并保留原句的情感色彩。

示例1：
中文：这个产品太棒了，我超级喜欢！
英文：This product is amazing, I absolutely love it!

示例2：
中文：天气糟透了，让人心情低落。
英文：The weather is terrible, it's bringing me down.

现在翻译：
中文：你做得不错，但还有提升空间。
英文：
```

### 5. 设定约束条件
限制AI的输出范围，防止跑题或过度发挥。

```
你是一位技术面试官。请针对"Python装饰器"知识点，生成3道面试题。
约束条件：
- 每题不超过50字
- 必须包含代码示例
- 难度为中级
- 不涉及类装饰器
```

## 三、实战场景：解决真实问题

### 6. 代码调试助手
```
你是一位经验丰富的后端工程师。以下代码在运行时报错：TypeError: 'int' object is not iterable
请：
1. 指出错误原因
2. 给出修复后的代码
3. 解释两种常见的触发场景

代码：
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total

result = calculate_sum(5)
```

### 7. 文档生成器
```
请根据以下API接口定义，生成完整的API文档（Markdown格式）：

接口：POST /api/users
参数：
- name (string, 必填): 用户名
- email (string, 必填): 邮箱
- age (int, 可选): 年龄

要求：
- 包含请求示例（JSON格式）
- 包含成功/失败响应示例
- 包含错误码说明
- 语言风格：简洁专业
```

### 8. 代码审查员
```
请审查以下Python代码，按优先级列出3个改进点：

def get_data(id):
    db = connect()
    data = db.query("SELECT * FROM users WHERE id="+id)
    return data

改进点格式：[严重程度] 问题描述 -> 建议修改
```

### 9. 测试用例生成器
```
为以下函数生成单元测试用例（pytest风格），覆盖正常输入、边界值和异常情况：

def divide(a, b):
    if b == 0:
        raise ValueError("��数不能为0")
    return a / b
```

### 10. 代码解释器
```
用通俗易懂的语言解释以下代码的功能，假设读者懂基础编程但没接触过机器学习：

from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
```

## 总结

Prompt Engineering的核心不是"魔法咒语"，而是**清晰的沟通**。记住三个原则：
1. **结构化**：用角色、任务、格式三要素搭建框架
2. **示例化**：用少样本学习让AI理解你的意图
3. **约束化**：用限制条件控制输出质量

下次写prompt时，先问自己三个问题：AI知道它扮演什么角色吗？任务描述是否足够具体？输出格式是否明确？按照这个思路，你会发现AI突然变得"聪明"了。