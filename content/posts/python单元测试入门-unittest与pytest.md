---
title: "Python单元测试入门：unittest与pytest"
date: "2026-05-10"
category: "Python编程"
tags: ["Python编程", "Python"]
description: "Python单元测试入门：unittest与pytest - 详细教程与实战指南"
draft: "false"
---

# Python单元测试入门：unittest与pytest

编写代码时，如何确保函数或模块在修改后依然能正常工作？单元测试就是解决这个问题的利器。本文将带你快速掌握Python中最常用的两个测试框架：内置的`unittest`和第三方库`pytest`，并通过实际案例让你立刻上手。

## 为什么需要单元测试？

假设你写了一个计算折扣的函数，上线后发现价格计算错误。如果没有测试，你需要手动调试；而有了单元测试，只需运行一条命令，就能立刻知道哪个环节出了问题。单元测试不仅能提高代码质量，还能在重构时给你十足的信心。

## unittest：Python自带的测试框架

`unittest`是Python标准库的一部分，无需额外安装。它的风格类似于Java的JUnit，使用类和方法组织测试。

### 基本用法

创建一个名为`calculator.py`的文件：

```python
# calculator.py
def add(a, b):
    return a + b

def divide(a, b):
    if b == 0:
        raise ValueError("除数不能为零")
    return a / b
```

再创建测试文件`test_calculator.py`：

```python
import unittest
from calculator import add, divide

class TestCalculator(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(2, 3), 5)
        self.assertEqual(add(-1, 1), 0)

    def test_divide(self):
        self.assertEqual(divide(10, 2), 5)
        with self.assertRaises(ValueError):
            divide(10, 0)

if __name__ == '__main__':
    unittest.main()
```

运行测试：

```bash
python test_calculator.py
```

输出结果会显示测试通过（`.`）或失败（`F`）。`unittest`提供了丰富的断言方法，如`assertEqual`、`assertTrue`、`assertRaises`等。

### 测试前后置处理

使用`setUp`和`tearDown`方法可以在每个测试前后执行特定操作，比如初始化数据库连接或清理临时文件：

```python
class TestDatabase(unittest.TestCase):
    def setUp(self):
        self.db = connect_to_database()

    def tearDown(self):
        self.db.close()

    def test_insert(self):
        self.db.insert("test")
        self.assertTrue(self.db.exists("test"))
```

## pytest：更简洁、更强大

`pytest`是目前最流行的Python测试框架，语法更简洁，功能更丰富。首先安装：

```bash
pip install pytest
```

### 函数式测试

`pytest`不需要类，直接编写函数即可：

```python
# test_calculator_pytest.py
from calculator import add, divide
import pytest

def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0

def test_divide():
    assert divide(10, 2) == 5
    with pytest.raises(ValueError):
        divide(10, 0)
```

运行方式更简单：

```bash
pytest test_calculator_pytest.py
```

### 使用Fixture管理依赖

Fixture是`pytest`的核心功能，用于管理测试所需的资源（如数据库连接、临时文件）。它比`setUp`/`tearDown`更灵活：

```python
import pytest

@pytest.fixture
def database():
    db = connect_to_database()
    yield db  # 测试执行到这里
    db.close()  # 测试结束后执行清理

def test_insert(database):
    database.insert("test")
    assert database.exists("test")
```

Fixture可以自动缓存，还能通过`scope`参数控制生命周期（如`session`级别表示整个测试会话只执行一次）。

### 参数化测试

当需要测试多组数据时，参数化能避免重复代码：

```python
import pytest

@pytest.mark.parametrize("a,b,expected", [
    (2, 3, 5),
    (0, 0, 0),
    (-1, 1, 0),
])
def test_add_param(a, b, expected):
    assert add(a, b) == expected
```

## 实际应用场景：测试一个订单系统

假设我们有一个订单处理模块，需要测试折扣计算和订单总价：

```python
# order.py
class Order:
    def __init__(self, items, discount=0):
        self.items = items  # [(name, price), ...]
        self.discount = discount

    def total_price(self):
        subtotal = sum(price for _, price in self.items)
        return subtotal * (1 - self.discount)

    def apply_discount(self, code):
        if code == "SAVE10":
            self.discount = 0.1
        elif code == "SAVE20":
            self.discount = 0.2
        else:
            raise ValueError("无效折扣码")
```

使用`pytest`编写测试：

```python
import pytest
from order import Order

@pytest.fixture
def sample_order():
    return Order([("苹果", 10), ("香蕉", 5)])

def test_total_price_no_discount(sample_order):
    assert sample_order.total_price() == 15

def test_total_price_with_discount(sample_order):
    sample_order.apply_discount("SAVE10")
    assert sample_order.total_price() == 13.5

def test_invalid_discount_code(sample_order):
    with pytest.raises(ValueError):
        sample_order.apply_discount("INVALID")
```

运行`pytest`，三条测试全部通过，确保订单系统的核心逻辑正确。

## 总结

- **unittest**：Python内置，适合需要严格遵循传统测试风格的项目，无需额外依赖。
- **pytest**：语法简洁、功能强大，支持Fixture、参数化、插件扩展，是大多数项目的首选。
- 无论选择哪个框架，核心都是**编写可重复、自动化的测试**，以验证代码行为符合预期。

从今天开始，为你的每个函数添加测试吧！哪怕只是简单的`assert`，也能在未来的开发中为你节省大量调试时间。