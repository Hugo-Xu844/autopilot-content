---
title: "RAG是什么？检索增强生成技术入门"
date: "2026-05-10"
category: "AI入门教程"
tags: ["AI入门教程"]
description: "RAG是什么？检索增强生成技术入门 - 详细教程与实战指南"
draft: "false"
---

# RAG是什么？检索增强生成技术入门

大语言模型虽然强大，但它的知识截止于训练数据，无法回答最新的信息，也无法引用可靠来源。RAG（检索增强生成）正是为解决这个问题而生的技术——让模型在生成回答前，先从外部知识库中检索相关信息，从而给出更准确、可溯源的结果。

## 1. RAG的核心流程：检索 + 生成

RAG的全称是Retrieval-Augmented Generation，它的工作流程可以分为三个步骤：

1. **索引**：将文档（如PDF、网页）切分成小块，用嵌入模型（如text-embedding-ada-002）转换为向量，存入向量数据库（如Chroma、Pinecone）。
2. **检索**：收到用户问题时，将问题也转为向量，在数据库中查找最相似的文档片段。
3. **生成**：将检索到的片段作为“上下文”，连同原始问题一起发给LLM，让模型基于这些材料生成回答。

下面是一个基于LangChain的简化示例：

```python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA

# 1. 加载文档并切分
with open("knowledge.txt", "r") as f:
    text = f.read()
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = splitter.split_text(text)

# 2. 创建向量数据库
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_texts(chunks, embeddings)

# 3. 构建RAG链
llm = ChatOpenAI(model="gpt-4", temperature=0)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3})
)

# 4. 提问
response = qa_chain.run("2024年诺贝尔文学奖得主是谁？")
print(response)
```

这段代码展示了RAG的最小实现：将本地知识库中的文档向量化，检索最相关的3个片段，然后让GPT-4基于这些片段回答。

## 2. 为什么需要RAG？它解决了什么痛点？

LLM本身有两个硬伤：

- **知识陈旧**：GPT-4的知识截止于2023年，问它“今天天气”或“最新政策”会得到错误答案。
- **幻觉问题**：模型会“编造”看似合理但实际不存在的信息，尤其在专业领域（如医学、法律）。

RAG通过引入外部知识库，让模型“先查后答”，既解决了时效性问题，又提供了可验证的引用来源。例如，一个客服系统可以实时检索最新的产品手册，而不是依赖模型训练时的记忆。

## 3. 关键组件详解：嵌入、检索、重排序

### 3.1 文本嵌入
文本必须转为向量才能进行相似度计算。常用的嵌入模型有：
- OpenAI `text-embedding-3-small`（1536维，性价比高）
- 开源 `BAAI/bge-large-zh-v1.5`（中文效果优秀）

### 3.2 检索策略
简单的向量检索有时不够精准，可以组合多种策略：
- **混合检索**：同时使用向量相似度和关键词匹配（BM25）
- **重排序**：先用向量检索出Top 50，再用更精细的交叉编码器模型重新排序

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CohereRerank

# 重排序示例
retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
compressor = CohereRerank()
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor, base_retriever=retriever
)
```

### 3.3 分块策略
分块大小直接影响检索质量：
- **过小**（<100字）：缺乏上下文，模型难以理解
- **过大**（>1000字）：可能包含无关信息，降低精度
- 推荐500-800字，配合10%-20%的重叠

## 4. 实战：搭建一个RAG问答系统

假设你要为一个企业内部文档构建智能问答系统：

```python
import chromadb
from chromadb.utils import embedding_functions

# 初始化客户端
client = chromadb.PersistentClient(path="./chroma_db")
sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="BAAI/bge-small-zh-v1.5"
)

# 创建集合
collection = client.create_collection(
    name="company_docs",
    embedding_function=sentence_transformer_ef
)

# 添加文档（假设已分块）
collection.add(
    documents=["文档片段1...", "文档片段2..."],
    metadatas=[{"source": "policy.pdf"}, {"source": "handbook.pdf"}],
    ids=["doc1", "doc2"]
)

# 检索
results = collection.query(
    query_texts=["年假政策是什么？"],
    n_results=3
)
print(results['documents'])  # 输出最相关的文档片段
```

这个系统可以部署到Slack或飞书机器人中，让员工用自然语言查询公司政策、技术文档。

## 5. RAG的局限与优化方向

RAG并非银弹，实际应用中会遇到：
- **检索失败**：问题太模糊或知识库不完整，导致检索不到相关内容
- **上下文窗口限制**：检索到的片段可能超出LLM的token限制
- **多跳推理**：需要组合多个文档信息才能回答的问题（如“A部门去年的预算比B部门多多少？”）

优化方向包括：
- **Query改写**：将用户问题重写为更利于检索的形式
- **HyDE**：先生成一个假设性答案，再用它去检索
- **Agent+RAG**：让LLM自主决定何时检索、检索什么

## 总结

RAG通过“检索+生成”的架构，让LLM能够访问外部知识库，解决了知识陈旧和幻觉问题。它的核心组件包括文本分块、向量嵌入、相似度检索和上下文增强生成。对于开发者来说，借助LangChain、Chroma等工具，几行代码就能搭建一个实用的RAG系统。下一篇文章将深入探讨如何评估RAG系统的检索质量，欢迎持续关注。