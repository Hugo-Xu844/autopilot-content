---
title: "Python列表推导式：一行代码的魔法"
date: "2026-05-15"
category: "Python编程"
tags: ["Python编程", "Python"]
description: "Python列表推导式：一行代码的魔法 - 详细教程与实战指南"
draft: "false"
---

# Python列表推导式：一行代码的魔法

你还在用 `for` 循环创建列表吗？列表推导式能让你用一行代码完成同样的工作，代码更简洁、运行更快。本文将带你彻底掌握这个 Python 核心技巧。

## 1. 从循环到推导式：基础语法

先看一个经典场景：生成 1 到 10 的平方数列表。

**传统写法：**
```python
squares = []
for i in range(1, 11):
    squares.append(i ** 2)
print(squares)  # [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

**列表推导式写法：**
```python
squares = [i ** 2 for i in range(1, 11)]
print(squares)  # 输出相同
```

核心语法：`[表达式 for 变量 in 可迭代对象]`。`表达式` 是你要对每个元素执行的操作，`for 变量 in 可迭代对象` 是迭代逻辑。Python 会按顺序执行：遍历 `range(1, 11)` 中的每个 `i`，计算 `i ** 2`，并自动收集结果到列表中。

**练习**：用一行代码生成 0 到 20 之间的偶数列表。

## 2. 条件过滤：if 子句的妙用

很多场景下，我们只需要满足条件的元素。列表推导式通过 `if` 子句轻松实现过滤。

**示例：筛选出列表中所有正数**
```python
numbers = [-2, 5, -1, 0, 8, -3, 10]
positive = [n for n in numbers if n > 0]
print(positive)  # [5, 8, 10]
```

语法扩展：`[表达式 for 变量 in 可迭代对象 if 条件]`。`if` 子句在 `for` 之后，只有条件为 `True` 的元素才会进入表达式计算。

**实际应用**：从一个包含用户信息的字典列表中，提取所有活跃用户的名字。
```python
users = [
    {"name": "Alice", "active": True},
    {"name": "Bob", "active": False},
    {"name": "Charlie", "active": True}
]
active_names = [user["name"] for user in users if user["active"]]
print(active_names)  # ['Alice', 'Charlie']
```

## 3. 嵌套循环：处理多维数据

当数据是多层结构时，列表推导式也能优雅处理。语法是 `for` 子句按嵌套顺序书写。

**示例：将二维矩阵展平为一维列表**
```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [num for row in matrix for num in row]
print(flat)  # [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

解读：外层 `for row in matrix` 遍历每一行，内层 `for num in row` 遍历行中每个元素，最终将所有元素收集。

**对比传统嵌套循环**：
```python
flat = []
for row in matrix:
    for num in row:
        flat.append(num)
```

列表推导式将 3 行代码压缩为 1 行，逻辑却更清晰：从左到右阅读，正好是执行顺序。

## 4. 实战案例：数据处理中的列表推导式

让我们解决一个真实问题：从一份销售数据中提取所有超过 1000 元的订单 ID。

**原始数据**（列表嵌套字典）：
```python
orders = [
    {"id": "A001", "amount": 899, "status": "paid"},
    {"id": "A002", "amount": 1500, "status": "paid"},
    {"id": "A003", "amount": 250, "status": "pending"},
    {"id": "A004", "amount": 2000, "status": "paid"},
    {"id": "A005", "amount": 1200, "status": "refunded"}
]
```

**需求**：找出所有已支付（`status == "paid"`）且金额大于 1000 的订单 ID。

**一行代码解决**：
```python
high_value_orders = [
    order["id"] 
    for order in orders 
    if order["status"] == "paid" and order["amount"] > 1000
]
print(high_value_orders)  # ['A002', 'A004']
```

这种写法比 `for` 循环 + `if` 嵌套更直观，且执行效率更高（Python 内部用 C 优化了迭代逻辑）。

## 5. 性能与可读性的平衡

列表推导式虽好，但并非万能。以下情况请谨慎使用：

- **逻辑过于复杂**：当表达式或条件超过 2 个操作时，可读性会急剧下降。
- **需要��试**：列表推导式无法打断点，复杂逻辑建议用普通循环。

**反例**（可读性差）：
```python
# 不要这样写
result = [x * y for x in range(10) for y in range(10) if x % 2 == 0 if y % 3 == 0 if x + y > 5]
```

**改进建议**：将复杂逻辑拆分为函数，再用于列表推导式。
```python
def condition(x, y):
    return x % 2 == 0 and y % 3 == 0 and x + y > 5

result = [x * y for x in range(10) for y in range(10) if condition(x, y)]
```

## 总结

列表推导式的核心要点：
- **基本语法**：`[表达式 for 变量 in 可迭代对象]`
- **条件过滤**：在 `for` 后加 `if` 子句
- **嵌套循环**：按嵌套顺序书写多个 `for` 子句
- **实用场景**：数据转换、过滤、展平、提取字段
- **注意事项**：保持简单，复杂逻辑拆分为函数

从今天起，遇到需要生成或转换列表的场景，先想想能否用列表推导式一行搞定。熟练后，你会发现自己写出的代码更 Pythonic，也更高效。