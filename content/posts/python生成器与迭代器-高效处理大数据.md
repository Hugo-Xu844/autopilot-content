---
title: "Python生成器与迭代器：高效处理大数据"
date: "2026-05-06"
category: "Python编程"
tags: ["Python编程", "Python"]
description: "Python生成器与迭代器：高效处理大数据 - 详细教程与实战指南"
draft: "false"
---

# Python生成器与迭代器：高效处理大数据

当你的Python程序需要处理数百万行日志、超大CSV文件或无限数据流时，直接使用列表存储所有数据往往会耗尽内存，甚至导致程序崩溃。生成器与迭代器正是解决这类问题的利器——它们通过**惰性计算**方式，只在需要时生成数据，从而大幅降低内存占用。

## 一、迭代器：数据流的生产者

任何实现了`__iter__()`和`__next__()`方法的对象都是迭代器。它像一个“数据管道”，每次调用`next()`才吐出下一个元素。

### 基础示例：手动实现迭代器
```python
class Counter:
    def __init__(self, start, end):
        self.current = start
        self.end = end
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.current >= self.end:
            raise StopIteration
        value = self.current
        self.current += 1
        return value

# 使用迭代器
counter = Counter(1, 5)
for num in counter:
    print(num)  # 输出: 1 2 3 4
```

**关键点**：`for`循环本质上是不断调用`next()`直到捕获`StopIteration`异常。

## 二、生成���：迭代器的优雅实现

生成器是Python提供的一种更简洁的迭代器创建方式。用`yield`关键字替代`return`，函数就变成了生成器函数。

### 对比：列表 vs 生成器
```python
# 列表方式（一次性生成所有数据）
def get_squares_list(n):
    return [x**2 for x in range(n)]

# 生成器方式（按需生成）
def get_squares_gen(n):
    for x in range(n):
        yield x**2

# 测试内存占用
import sys
squares_list = get_squares_list(100000)
squares_gen = get_squares_gen(100000)

print(f"列表大小: {sys.getsizeof(squares_list)} bytes")  # 约824456
print(f"生成器大小: {sys.getsizeof(squares_gen)} bytes")  # 约112
```

**实际效果**：生成器对象无论生成多少数据，自身大小恒定，而列表会随着数据量线性增长。

### 生成器表达式：一行代码搞定
```python
# 列表推导式
list_comp = [x*2 for x in range(1000)]

# 生成器表达式（只需将方括号改为圆括号）
gen_expr = (x*2 for x in range(1000))

print(type(gen_expr))  # <class 'generator'>
```

## 三、实战：处理大文件

假设有一个10GB的日志文件`access.log`，我们需要统计每个IP的访问次数。

### 错误做法（内存爆炸）
```python
def parse_log_bad(filepath):
    with open(filepath) as f:
        lines = f.readlines()  # 一次性加载全部内容到内存
    ip_counts = {}
    for line in lines:
        ip = line.split()[0]
        ip_counts[ip] = ip_counts.get(ip, 0) + 1
    return ip_counts
```

### 正确做法（流式处理）
```python
def parse_log_good(filepath):
    ip_counts = {}
    with open(filepath) as f:
        for line in f:  # 文件对象本身就是迭代器，逐行读取
            ip = line.split()[0]
            ip_counts[ip] = ip_counts.get(ip, 0) + 1
    return ip_counts

# 或者使用生成器函数封装读取逻辑
def read_lines(filepath):
    with open(filepath) as f:
        for line in f:
            yield line.strip()

# 使用生成器处理
for line in read_lines("huge_log.txt"):
    process(line)  # 逐行处理，内存占用极低
```

**原理**：`open()`返回的文件对象是一个迭代器，`for line in f`不会将整个文件读入内存，而是每次读取一行。

## 四、生成器的进阶用法

### 1. 无限序列生成
```python
def fibonacci():
    a, b = 0, 1
    while True:  # 无限循环
        yield a
        a, b = b, a + b

# 只取前10个
fib = fibonacci()
first_10 = [next(fib) for _ in range(10)]
print(first_10)  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

### 2. 生��器管道（数据流水线）
```python
# 构建处理管道
def read_data(filepath):
    with open(filepath) as f:
        for line in f:
            yield line.strip()

def filter_empty(data):
    for item in data:
        if item:  # 过滤空行
            yield item

def to_uppercase(data):
    for item in data:
        yield item.upper()

# 串联管道
pipeline = to_uppercase(filter_empty(read_data("data.txt")))
for processed_line in pipeline:
    print(processed_line)
```

### 3. 使用`yield from`简化嵌套生成器
```python
def chain(*iterables):
    for it in iterables:
        yield from it  # 委托给子迭代器

# 合并多个列表
combined = chain([1,2,3], "abc", [4,5])
print(list(combined))  # [1, 2, 3, 'a', 'b', 'c', 4, 5]
```

## 五、性能对比与选择建议

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 数据量 < 1000条 | 列表 | 简单直观，访问速度快 |
| 数据量 > 10000条 | 生成器/迭代器 | 内存占用低，避免OOM |
| 需要多次遍历 | 列表/重新创建生成器 | 生成器只能遍历一次 |
| 无限数据流 | 生成器 | 无法用列表表示无限序列 |

**测试代码**：比较列表和生成器的性能
```python
import time

# 列表方式
start = time.time()
result = sum([x for x in range(10_000_000)])
print(f"列表耗时: {time.time() - start:.2f}s")

# 生成器方式
start = time.time()
result = sum(x for x in range(10_000_000))
print(f"生成器耗时: {time.time() - start:.2f}s")
# 两者耗时相近，但生成器内存占用几乎为0
```

## 总结

- **迭代器**是实现了`__iter__`和`__next__`的对象，支持惰性计算
- **生成器**是用`yield`创建的迭代器，更简洁易用
- 处理大文件、无限序列时，优先使用生成器
- 生成器表达式是列表推导式的内存友好版本
- 通过`yield from`可以轻松构建数据管道

掌握生成器和迭代器，你的Python程序就能以极低的内存开销处理海量数据——这正是Python在数据处理领域广受欢迎的重要原因之一。