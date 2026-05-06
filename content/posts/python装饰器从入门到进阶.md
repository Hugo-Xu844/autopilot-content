---
title: "Python装饰器从入门到进阶"
date: "2026-05-06"
category: "Python编程"
tags: ["Python编程", "Python"]
description: "Python装饰器从入门到进阶 - 详细教程与实战指南"
draft: "false"
---

# Python装饰器从入门到进阶

装饰器是Python中一个强大而优雅的特性，它允许你在不修改原函数代码的情况下，动态地给函数添加新的功能。本文将带你从基础语法到高级应用，彻底掌握装饰器的使用。

## 一、理解装饰器的核心概念

装饰器本质上是一个接收函数作为参数并返回新函数的高阶函数。让我们从最简单的例子开始：

```python
def my_decorator(func):
    def wrapper():
        print("在函数执行前做一些事情")
        func()
        print("在函数执行后做一些事情")
    return wrapper

@my_decorator
def say_hello():
    print("Hello!")

say_hello()
```

输出：
```
在函数执行前做一些事情
Hello!
在函数执行后做一些事情
```

`@my_decorator` 语法糖等价于 `say_hello = my_decorator(say_hello)`。`wrapper`函数包裹了原函数，在调用前后添加了额外逻辑。

## 二、处理带参数的函数

上面的装饰器只能处理无参函数。为了让装饰器通用，我们需要使用`*args`和`**kwargs`：

```python
def timer_decorator(func):
    def wrapper(*args, **kwargs):
        import time
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} 执行耗时: {end - start:.4f}秒")
        return result
    return wrapper

@timer_decorator
def calculate_sum(n):
    return sum(range(n))

@timer_decorator
def greet(name, greeting="Hello"):
    print(f"{greeting}, {name}!")

result = calculate_sum(1000000)
print(f"计算结果: {result}")
greet("Alice", "Hi")
```

这个装饰器可以测量任意函数的执行时间，并保持原函数的返回值。

## 三、保留原函数的元信息

使用`functools.wraps`可以保留被装饰函数的名称、文档字符串等元信息：

```python
from functools import wraps

def log_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"调用函数: {func.__name__}")
        print(f"参数: {args}, {kwargs}")
        result = func(*args, **kwargs)
        print(f"返回值: {result}")
        return result
    return wrapper

@log_decorator
def add(a, b):
    """计算两个数的和"""
    return a + b

print(f"函数名: {add.__name__}")
print(f"文档: {add.__doc__}")
add(3, 5)
```

没有`@wraps`时，`add.__name__`会变成`wrapper`，这会导致调试困难。

## 四、带参数的装饰器

有时我们需要给装饰器传递参数，比如设置日志级别。这需要再嵌套一层函数：

```python
def repeat(times):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(times=3)
def say_hi():
    print("Hi!")

say_hi()
```

这里的`repeat(times=3)`先调用返回`decorator`函数，然后`@decorator`再应用于`say_hi`。

## 五、实际应用场景

### 1. 权限验证
```python
def require_auth(role):
    def decorator(func):
        @wraps(func)
        def wrapper(user, *args, **kwargs):
            if user.get("role") != role:
                raise PermissionError(f"需要{role}权限")
            return func(user, *args, **kwargs)
        return wrapper
    return decorator

@require_auth("admin")
def delete_user(user, user_id):
    print(f"用户 {user_id} 已被删除")

# 测试
admin_user = {"name": "Admin", "role": "admin"}
normal_user = {"name": "User", "role": "user"}

delete_user(admin_user, 123)  # 正常执行
# delete_user(normal_user, 123)  # 抛出PermissionError
```

### 2. 缓存计算结果
```python
def cache_result(func):
    cache = {}
    @wraps(func)
    def wrapper(*args):
        if args in cache:
            print(f"使用缓存: {args}")
            return cache[args]
        result = func(*args)
        cache[args] = result
        return result
    return wrapper

@cache_result
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))  # 第一次计算
print(fibonacci(10))  # 直接从缓存获取
```

### 3. 重试机制
```python
import time

def retry(max_attempts=3, delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    print(f"第{attempt + 1}次失败，{delay}秒后重试...")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3, delay=0.5)
def unstable_network_call():
    import random
    if random.random() < 0.7:
        raise ConnectionError("网络异常")
    return "成功获取数据"

print(unstable_network_call())
```

## 六、多个装饰器的组合

当多个装饰器叠加时，执行顺序���从下往上（离函数最近的先执行）：

```python
@timer_decorator
@log_decorator
def complex_function(x, y):
    return x ** y

complex_function(2, 10)
```

这相当于 `complex_function = timer_decorator(log_decorator(complex_function))`，先执行`log_decorator`，再执行`timer_decorator`。

## 总结

装饰器是Python中实现AOP（面向切面编程）的优雅方式。核心要点：

1. **基本结构**：装饰器是接收函数返回函数的高阶函数
2. **参数传递**：使用`*args, **kwargs`保持通用性
3. **元信息保留**：始终使用`@wraps`装饰wrapper函数
4. **带参数装饰器**：需要三层嵌套函数
5. **实际应用**：日志、权限、缓存、重试等场景非常实用

掌握装饰器后，你会发现代码复用性和可维护性都得到了显著提升。