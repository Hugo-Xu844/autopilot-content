---
title: "Python异步编程：asyncio实战"
date: "2026-05-06"
category: "Python编程"
tags: ["Python编程", "Python"]
description: "Python异步编程：asyncio实战 - 详细教程与实战指南"
draft: "false"
---

# Python异步编程：asyncio实战

在开发网络爬虫、Web服务或需要处理大量I/O操作的应用时，你是否遇到过程序卡在等待响应上，导致整体性能低下？Python的`asyncio`库正是解决这类问题的利器。本文将带你从零掌握asyncio的核心用法，并通过实战案例提升代码执行效率。

## 1. 理解异步编程的核心：协程与事件循环

异步编程的核心是**协程**（Coroutine）和**事件循环**（Event Loop）。协程是可以暂停执行并让出控制权的函数，事件循环则负责调度这些协程。

### 基础示例：定义和运行协程

```python
import asyncio

async def greet(name):
    print(f"Hello, {name}!")
    await asyncio.sleep(1)  # 模拟I/O等待
    print(f"Goodbye, {name}!")

async def main():
    # 创建协程对象，但不会立即执行
    task1 = asyncio.create_task(greet("Alice"))
    task2 = asyncio.create_task(greet("Bob"))
    
    # 等待所有任务完成
    await asyncio.gather(task1, task2)

# 运行事件循环
asyncio.run(main())
```

**关键点**：
- `async def` 定义协程函数
- `await` 挂起当前协程，等待另一个协程完成
- `asyncio.run()` 是Python 3.7+推荐的启动入口

运行上述代码，你会看到两个问候语几乎同时输出，而不是顺序执行——这就是异步的魅力。

## 2. 实际场景：异步HTTP请求

网络请求是最常见的I/O密集型操作。我们使用`aiohttp`库来实现异步HTTP请求。

### 安装依赖
```bash
pip install aiohttp
```

### 实战：批量抓取网页标题

```python
import asyncio
import aiohttp
from bs4 import BeautifulSoup

async def fetch_title(session, url):
    try:
        async with session.get(url) as response:
            html = await response.text()
            soup = BeautifulSoup(html, 'html.parser')
            title = soup.title.string if soup.title else "No title"
            print(f"{url}: {title[:50]}")
            return title
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

async def main():
    urls = [
        "https://www.python.org",
        "https://www.github.com",
        "https://stackoverflow.com",
        "https://www.reddit.com"
    ]
    
    async with aiohttp.ClientSession() as session:
        # 创建所有抓取任务
        tasks = [fetch_title(session, url) for url in urls]
        # 并发执行
        results = await asyncio.gather(*tasks)
    
    print(f"成功抓取 {sum(1 for r in results if r)}/{len(urls)} 个页面")

asyncio.run(main())
```

**性能对比**：如果使用同步方式，4个请求需要至少4秒（假设每个请求1秒）；而异步方式只需约1秒，效率提升明显。

## 3. 控制并发：限制同时进行的任务数

直接使用`asyncio.gather`会一次性发起所有任务，可能导致目标服务器过载或被封IP。我们需要限制并发数。

### 使用信号量控制并发

```python
import asyncio
import aiohttp

async def fetch_url(semaphore, session, url):
    async with semaphore:  # 获取信号量
        async with session.get(url) as response:
            return await response.text()

async def main():
    urls = [f"https://httpbin.org/delay/{i}" for i in range(1, 11)]  # 模拟10个慢请求
    
    # 限制最多3个并发
    semaphore = asyncio.Semaphore(3)
    
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(semaphore, session, url) for url in urls]
        results = await asyncio.gather(*tasks)
    
    print(f"完成 {len(results)} 个请求")

asyncio.run(main())
```

**信号量工作原理**：同时最多允许3个协程进入`async with semaphore`块，其他协程会排队等待。

## 4. 超���处理与错误恢复

在实际应用中，网络请求可能超时或失败。我们需要优雅地处理这些异常。

### 带超时的任务管理

```python
import asyncio
import aiohttp

async def fetch_with_timeout(session, url, timeout=5):
    try:
        async with asyncio.timeout(timeout):  # Python 3.11+ 语法
            async with session.get(url) as response:
                return await response.text()
    except asyncio.TimeoutError:
        print(f"{url} 请求超时")
        return None
    except Exception as e:
        print(f"{url} 请求失败: {e}")
        return None

# 对于Python 3.10及以下版本，使用asyncio.wait_for
async def fetch_with_timeout_legacy(session, url, timeout=5):
    try:
        async with session.get(url) as response:
            # 限制读取操作的时间
            return await asyncio.wait_for(response.text(), timeout=timeout)
    except asyncio.TimeoutError:
        print(f"{url} 请求超时")
        return None
```

**实战建议**：为每个任务设置合理的超时时间，避免单个慢请求拖垮整个程序。

## 5. 异步与同步代码的桥接

有时我们需要在异步代码中调用同步的第三方库。使用`loop.run_in_executor`可以将同步任务交给线程池执行。

### 混合使用示例

```python
import asyncio
import time

def sync_blocking_task(n):
    """模拟一个耗时的CPU操作"""
    time.sleep(n)  # 注意：这里使用time.sleep模拟阻塞
    return f"完成耗时{n}秒的任务"

async def main():
    loop = asyncio.get_running_loop()
    
    # 将同步任务提交到默认线程池
    result = await loop.run_in_executor(None, sync_blocking_task, 2)
    print(result)
    
    # 也可以指定线程池
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = await asyncio.gather(*[
            loop.run_in_executor(pool, sync_blocking_task, i)
            for i in range(1, 4)
        ])
        print(results)

asyncio.run(main())
```

**注意**：`run_in_executor`适用于CPU密集型或阻塞的同步代码，但不要滥用——异步的核心优势是处理I/O等待。

## 总结

本文带你走过了asyncio实战的四个关键环节：
1. **协程与事件循环**：理解`async/await`语法和`asyncio.run`入口
2. **异步HTTP请求**：使用`aiohttp`实现并发网络请求
3. **并发控制**：用`Semaphore`限制同时执行的任务数
4. **错误处理**：添加超时和异常处理机制

记住，异步编程不是银弹——它最适合I/O密集型任务（网络请求、文件读写、数据库操作），对于CPU密集型计算（图像处理、加密解密），请考虑使用多进程或多线程。现在，打开你的编辑器，将学到的技术应用到下一个项目中吧！