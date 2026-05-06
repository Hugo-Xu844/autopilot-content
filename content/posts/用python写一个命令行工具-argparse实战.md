---
title: "用Python写一个命令行工具：argparse实战"
date: "2026-05-06"
category: "编程实战"
tags: ["编程实战", "Python"]
description: "用Python写一个命令行工具：argparse实战 - 详细教程与实战指南"
draft: "false"
---

# 用Python写一个命令行工具：argparse实战

你是否写过这样的脚本：每次运行都要手动修改代码里的文件路径、参数数值？或者想给同事提供一个易用的工具，却不知道怎么处理命令行参数？Python标准库中的`argparse`模块正是解决这些问题的利器。本文将通过三个实战场景，带你掌握argparse的核心用法。

## 基础入门：从零搭建参数解析框架

首先，我们用最简单的例子认识argparse的工作流程。假设我们要写一个文件处理工具，需要接收文件名和操作模式。

```python
import argparse

def main():
    parser = argparse.ArgumentParser(description='文件处理工具')
    parser.add_argument('filename', help='要处理的文件名')
    parser.add_argument('--mode', choices=['read', 'write'], default='read',
                        help='操作模式：read或write')
    
    args = parser.parse_args()
    print(f'处理文件：{args.filename}')
    print(f'操作模式：{args.mode}')

if __name__ == '__main__':
    main()
```

运行效果：
```bash
$ python file_tool.py data.txt --mode write
处理文件：data.txt
操作模式：write
```

关键点解析：
- `add_argument()`的第一个参数是参数名，不带`--`的是位置参数（必须提供），带`--`的是可选参数
- `choices`限制参数值范围，`default`设置默认值
- `help`为每个参数添加说明，运行`python file_tool.py -h`时会自动生成帮助信息

## 进阶实战：构建多功能计算器

现在我们来做一个更实用的例子：一个支持加、减、乘、除的计算器，可以处理任意数量的数字，还能选择输出格式。

```python
import argparse

def calculate(numbers, operation):
    if operation == 'add':
        return sum(numbers)
    elif operation == 'sub':
        result = numbers[0]
        for n in numbers[1:]:
            result -= n
        return result
    elif operation == 'mul':
        result = 1
        for n in numbers:
            result *= n
        return result
    elif operation == 'div':
        result = numbers[0]
        for n in numbers[1:]:
            result /= n
        return result

def main():
    parser = argparse.ArgumentParser(description='多功能计算器')
    parser.add_argument('numbers', nargs='+', type=float,
                        help='要计算的数字，至少两个')
    parser.add_argument('-o', '--operation', choices=['add', 'sub', 'mul', 'div'],
                        default='add', help='运算类型')
    parser.add_argument('--precision', type=int, default=2,
                        help='结果保留小数位数')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='显示详细计算过程')
    
    args = parser.parse_args()
    
    if len(args.numbers) < 2:
        parser.error('至少需要两个数字')
    
    result = calculate(args.numbers, args.operation)
    
    if args.verbose:
        op_symbols = {'add': '+', 'sub': '-', 'mul': '*', 'div': '/'}
        expression = f' {op_symbols[args.operation]} '.join(
            [str(n) for n in args.numbers])
        print(f'计算表达式：{expression}')
        print(f'运算类型：{args.operation}')
    
    print(f'结果：{result:.{args.precision}f}')

if __name__ == '__main__':
    main()
```

运行示例：
```bash
$ python calculator.py 10 5 3 -o sub --precision 3 -v
计算表达式：10 - 5 - 3
运算类型：sub
结果：2.000
```

新技能点：
- `nargs='+'`表示接受一个或多个参数，`type=float`自动转换类型
- `action='store_true'`创建布尔开关，指定`-v`时值为True
- `--precision`展示如何定义整数参数

## 实战技巧：子命令与配置文件

当你的工具功��逐渐增多时，可以使用子命令来组织。下面是一个数据处理工具，包含`convert`和`analyze`两个子命令。

```python
import argparse
import json

def handle_convert(args):
    print(f'转换文件：{args.input} -> {args.output}')
    print(f'编码：{args.encoding}')
    if args.pretty:
        print('启用美化输出')

def handle_analyze(args):
    print(f'分析文件：{args.input}')
    print(f'统计指标：{args.metrics}')
    if args.quiet:
        print('静默模式')

def main():
    parser = argparse.ArgumentParser(description='数据处理工具')
    parser.add_argument('--config', help='配置文件路径')
    
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # convert 子命令
    convert_parser = subparsers.add_parser('convert', help='文件格式转换')
    convert_parser.add_argument('input', help='输入文件')
    convert_parser.add_argument('output', help='输出文件')
    convert_parser.add_argument('--encoding', default='utf-8', help='文件编码')
    convert_parser.add_argument('--pretty', action='store_true', help='美化输出')
    
    # analyze 子命令
    analyze_parser = subparsers.add_parser('analyze', help='数据分析')
    analyze_parser.add_argument('input', help='输入文件')
    analyze_parser.add_argument('--metrics', nargs='+', 
                                choices=['count', 'mean', 'max', 'min'],
                                default=['count'], help='统计指标')
    analyze_parser.add_argument('--quiet', action='store_true', help='减少输出')
    
    args = parser.parse_args()
    
    # 支持从配置文件读取参数
    if args.config:
        with open(args.config, 'r') as f:
            config = json.load(f)
            for key, value in config.items():
                if hasattr(args, key) and getattr(args, key) is None:
                    setattr(args, key, value)
    
    if args.command == 'convert':
        handle_convert(args)
    elif args.command == 'analyze':
        handle_analyze(args)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
```

运行效果：
```bash
$ python data_tool.py convert input.csv output.json --pretty
转换文件：input.csv -> output.json
编码：utf-8
启用美化输出

$ python data_tool.py analyze data.csv --metrics mean max
分析文件：data.csv
统计指标：['mean', 'max']
```

高级特性：
- `add_subparsers()`创建子命令体系，`dest='command'`用于判断用户输入了哪个子命令
- 支持从JSON配置文件加载参数，方便批量使用
- 不同子命令可以有完全不同的参数集合

## 总结

通过三个实战案例，我们掌握了argparse的核心用法：
1. **基础用法**：位置参数、可选参数、类型转换、参数验证
2. **进阶技巧**：多值参数、布尔开关、自定义错误提示
3. **高级应用**：子命令体系、配置文件支持

argparse的强大之处在于：它自动生成帮助信息、处理错误输入、支持类型转换，让开发者可以专注于业务逻辑。下次当你需要给脚本添加命令行参数时，不妨试试argparse，让你的工具更加专业易用。