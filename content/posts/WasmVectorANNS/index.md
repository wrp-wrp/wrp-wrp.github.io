+++
date = '2025-12-22T15:41:00+08:00'
draft = false
math = true
title = 'WebAssembly and Vector Index for On-Device ANNS: Quantization Appears Sufficient'
summary = "在端侧 ANNS 的内存约束下，量化索引 + 图搜索 + 小规模精排，走 diskann 路线看起来足够了。"
title_en = "WebAssembly and Vector Index for On-Device ANNS: Quantization Appears Sufficient"
summary_en = "Under strict on-device ANNS memory limits, a quantized index with graph search and lightweight reranking appears to be a practical path."
tags = ["WASM", "向量检索", "ANNS", "量化", "HNSW"]
categories = ["技术调研"]
+++

# WASM + Vector Index 端侧 ANNS 调研

作为一个实习生， 这段时间我在看浏览器端 ANNS。 虽然感觉有各种乱七八糟的方案， 但是看起来**量化似乎已经足够了**。

## 为什么要做端侧 ANNS？

端侧检索的动机很直接：

- 减少网络往返延迟；
- 让部分数据留在本地，提升隐私性；
- 在离线或弱网环境下仍然可用。

但端侧也有硬约束，尤其是浏览器和 WASM 的内存上限。

## 约束：内存小，外部存储慢

以浏览器场景为例：

| 场景 | 限制 |
|:---|:---|
| 传统 Float32 向量 | 480K 条 768 维向量 ≈ 1.4GB |
| 浏览器 Tab 内存限制 | 通常在 2-4GB |
| WASM 线性内存上限 | 4GB |

如果向量放不进内存，就只能走 IndexedDB 之类的外部存储；问题是，外部存储访问延迟比内存高得多。

## 现有思路：复杂缓存 + 懒加载

像 WebANNS 这类工作，会把一部分向量放在外部存储，通过缓存和分批拉取来压内存。

这条路当然能用，但代价也明显：论文里提到在内存压到原数据 20% 时，P99 延迟显著变高（可到原来的数量级数十倍）。从工程角度看，这个交换不一定划算。

## 先量化，再精排 看起来足够了

我更倾向于一条更朴素的路线：

1. 向量先量化，尽量把索引留在内存；
2. 用图索引做近邻搜索；
3. 只把候选集合回源读取，再做精确 reranking。

这样外部存储访问基本是一次批量读取，而不是搜索过程中反复触发随机读取。实现复杂度也低很多。

## 一个更简单的三阶段流水线

```text
量化索引（全内存） -> 图搜索 -> 批量读取原始向量 -> 精确重排序
```

这条流水线的直觉很简单：把“频繁操作”尽量留在内存，把“慢操作”压缩到最后一步、并且只做在小候选集上。

| 策略 | 效果 |
|:---|:---|
| 用量化换内存 | Int8 常见可到 4x 压缩，Int4 可进一步压缩 |
| 图搜索全在内存 | 避免遍历阶段频繁 IO |
| 仅候选向量回源 | 通常只需批量读取几十到几百条向量 |

## 小实验与实现

我做了一个小实现：

> 代码链接：[QuantifyWebANN](https://github.com/wrp-wrp/QuantifyWebANN)

实验报告：

- [Benchmark Report - Top-K=10](benchmark_report-Topk10.pdf)
- [Benchmark Report - Top-K=100](benchmark_report-Topk100.pdf)

## 目前的观察

- 在我测试的数据上，量化后的召回下降没有想象中大；
- 适当提高 reranking 的候选数，通常可以把精度拉回来；
- 和复杂缓存方案相比，这种做法在工程实现上更稳、更容易维护。

## 为什么说“量化似乎已经足够了” ？

1. 高维向量里，Top-K 候选间的距离差距本来就不大；
2. 量化误差可以被后续精排部分抵消；
3. 图索引（如 HNSW）本身对局部误差有一定容忍度。

在内存受限的端侧 ANNS 里，我现在更认可这条路线， 并且我觉得这条路已经很对了：

```text
量化索引（全内存） + HNSW 图搜索 + 精确 reranking
```
