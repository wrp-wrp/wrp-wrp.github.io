+++
date = '2025-11-26T10:00:00+08:00'
draft = false
math = true
title = '计算理论学习笔记'
summary = "计算理论核心概念复习，涵盖自动机、可计算性与计算复杂性理论。"
tags = ["计算理论", "自动机", "图灵机", "复杂性"]
categories = ["学习笔记"]
+++

# 计算理论导引

## 1. 自动机与语言 (Automata and Languages)

### 正则语言 (Regular Languages)

#### 有限自动机 (Finite Automata)
- **确定性有限自动机 (DFA)**: $M = (Q, \\Sigma, \\delta, q_0, F)$
- **非确定性有限自动机 (NFA)**: 允许 $\\epsilon$ 转移，同一输入可能有多个转移路径。
- **等价性与转化**:
    - **NFA $\\to$ DFA (子集构造法 / Subset Construction)**: 
        - DFA 的每个状态对应 NFA 状态的一个子集。
        - 转移函数考虑 $\\epsilon$-闭包：$\\delta\_{DFA}(R, a) = \\bigcup_{r \\in R} E(\\delta\_{NFA}(r, a))$。
    - **RegEx $\\to$ NFA**: 
        - 模块化构造：对 $a, \\epsilon, \\emptyset$ 建立基础 NFA。
        - 组合：利用 $\\epsilon$ 转移实现并 ($A \\cup B$)、连接 ($AB$) 和星号 ($A^*$) 运算。
    - **DFA $\\to$ RegEx (状态消除法 / GNFA)**: 
        - 转化为 GNFA (边标记为正则表达式)。
        - 逐步消除中间状态，更新剩余状态间的正则表达式路径：$R\_{new} = R\_{old} \\cup (R\_{in} R\_{loop}^* R\_{out})$。

#### 正则表达式 (Regular Expressions)
- **定义**: 描述正则语言的代数表示。

#### 封闭性 (Closure Properties)
- 正则语言在 **并、交、补、连接、星号** 运算下封闭。

#### Myhill-Nerode 定理
- **用途**: 用于证明语言非正则，或证明 DFA 的最小性。
- **定理**: $L$ 是正则语言 $\\iff$ $L$ 的等价类数目有限。

#### 泵引理 (Pumping Lemma for Regular Languages)
> **用途**: 用于证明某些语言**不是**正则语言 (反证法)。

**定理**: 若 $A$ 是正则语言，则存在泵长度 $p$ (取决于 $A$ 的 DFA 状态数)，使得 $\\forall s \\in A, |s| \\ge p$，可以将 $s$ 分割为 $xyz$，满足：
1. $\\forall i \\ge 0, xy^iz \\in A$ (可以将 $y$ 重复任意次，结果仍在语言中)
2. $|y| > 0$ (中间部分非空)
3. $|xy| \\le p$ (重复部分发生在开头的前 $p$ 个字符内)

**直观理解 (鸽巢原理)**: 
- 设 DFA 有 $p$ 个状态。
- 如果输入字符串 $s$ 的长度 $|s| \ge p$，则处理 $s$ 的前 $p$ 个字符时，DFA 必须经过 $p+1$ 个状态序列 (包含起始状态)。
- 根据鸽巢原理，这 $p+1$ 个状态中至少有两个是相同的。
- 这两个相同状态之间的路径形成了一个环 ($y$)。
- 我们可以遍历这个环任意次 ($y^i$)，最终仍会到达相同的接受状态。

**典型例子**: 证明 $L = \{0^n1^n \mid n \ge 0\}$ 不是正则语言。
1.  **假设** $L$ 是正则语言。
2.  设 $p$ 为泵引理给出的泵长度。
3.  **选择** 字符串 $s = 0^p1^p$。显然 $s \in L$ 且 $|s| = 2p \ge p$。
4.  根据泵引理，存在分割 $s = xyz$，满足 $|xy| \le p$ 和 $|y| > 0$。
5.  由于 $|xy| \le p$，且 $s$ 以 $p$ 个 $0$ 开头，因此 $x$ 和 $y$ 必定完全由 $0$ 组成。即 $y = 0^k$，其中 $1 \le k \le p$。
6.  **泵升**: 取 $i=2$，考虑字符串 $s' = xy^2z = xyyz$。
7.  $s'$ 中 $0$ 的数量为 $p+k$，而 $1$ 的数量仍为 $p$。
8.  因为 $k \ge 1$，所以 $p+k \ne p$。故 $s' \notin L$。
9.  这与泵引理的条件 1 矛盾。
10. **结论**: 假设不成立，$L$ 不是正则语言。

### 上下文无关语言 (Context-Free Languages)

#### 上下文无关文法 (CFG)
- **定义**: $G = (V, \\Sigma, R, S)$
    - 产生式规则形式：$A \\to \\alpha$，其中 $A \\in V, \\alpha \\in (V \\cup \\Sigma)^*$。
- **歧义性 (Ambiguity)**: 如果一个字符串有两棵不同的派生树（最左推导），则称该文法是歧义的。
- **乔姆斯基范式 (CNF)**: 任何 CFL 都可以由 CNF 文法生成（产生式为 $A \\to BC$ 或 $A \\to a$）。

#### 下推自动机 (Pushdown Automata, PDA)
- **定义**: $M = (Q, \\Sigma, \\Gamma, \\delta, q_0, F)$，其中 $\\Gamma$ 是栈字母表。
- 相当于 NFA + 一个无限容量的栈 (Stack) (LIFO)。
- **等价性**: 一个语言是上下文无关的，当且仅当它被某个 PDA 识别。
- **CFG $\\to$ PDA (模拟最左推导)**:
    - 核心思想：PDA 的栈用于存储当前的推导序列。
    - 扩展规则：
        1. **展开**: 若栈顶是**非终结符** $A$，非确定性地选择产生式 $A \\to \\alpha$，弹出 $A$ 并将 $\\alpha$ (逆序) 压栈。
        2. **匹配**: 若栈顶是**终结符** $a$，读取输入字符 $a$，若匹配则弹出栈顶，否则拒绝。
- **PDA $\\to$ CFG (构造算法详解)**:
    1.  **预处理 PDA**:
        - 修改 PDA 使其满足：只有一个接受状态 $q\_{accept}$；接受前清空栈；每次转移仅推入或弹出一个符号（或都不做）。
    2.  **变量定义**:
        - 引入非终结符 $A\_{pq}$ ($\\forall p, q \\in Q$)。
        - $A\_{pq}$ 生成所有能将 PDA 从状态 $p$ 带到 $q$ 且**栈净变化为 0** 的字符串（即开始和结束时栈高度相同，且中间过程栈不低于该高度）。
    3.  **产生式规则构造**:
        - **简化情形**: $\\forall p \\in Q, A\_{pp} \\to \\epsilon$。
        - **路径拆分**: $\\forall p, q, r \\in Q, A\_{pq} \\to A\_{pr} A\_{rq}$。
        - **栈操作匹配**: 
            - 若存在转移 $(r, u) \\in \\delta(p, a, \\epsilon)$ (读 $a$, 推 $u$) 和 $(q, \\epsilon) \\in \\delta(s, b, u)$ (读 $b$, 弹 $u$)。
            - 则添加规则 $A\_{pq} \\to a A\_{rs} b$。
            - 含义：$p \\xrightarrow{a, +u} r \\rightsquigarrow s \\xrightarrow{b, -u} q$，中间 $r \\to s$ 由 $A\_{rs}$ 完成。
    4.  **起始符号**: $S = A\_{q\_{start}q\_{accept}}$。

#### 确定性下推自动机 (DPDA)
- 确定性的 PDA（每一步转移是唯一的，且 $\epsilon$ 转移有限制）。
- **能力差异**: DPDA 识别的语言类（确定性上下文无关语言, DCFL）是 CFL 的真子集 ($DCFL \subsetneq CFL$)。
- 例如：$\{ww^R\}$ 是 CFL 但不是 DCFL；$\{wcw^R\}$ 是 DCFL。
- DPDA 能够被确定性地解析，这对编译器设计很重要。

#### 封闭性 (Closure Properties)
- CFL 在 **并、连接、星号** 运算下封闭。
- CFL 在 **交、补** 运算下 **不封闭**。
- CFL 与正则语言的交集是 CFL。

#### 泵引理 (Pumping Lemma for CFL)
> **用途**: 用于证明某些语言**不是**上下文无关语言。

**定理**: 若 $A$ 是 CFL，则存在泵长度 $p$，使得 $\\forall s \\in A, |s| \\ge p$，可以将 $s$ 分割为 $uvxyz$，满足：
1. $\\forall i \\ge 0, uv^ixy^iz \\in A$
2. $|vy| > 0$ (即 $v$ 和 $y$ 不全为空)
3. $|vxy| \\le p$

**直观理解**: 
- 考虑生成字符串 $s$ 的派生树 (Parse Tree)。
- 若 $s$ 足够长，树的高度必然很高。
- 如果树的高度超过 $|V|$ (非终结符的数量)，则在最长路径上必然会出现重复的非终结符 $R$。
- 设路径上较底层的 $R$ 生成子串 $x$，较高层的 $R$ 生成子串 $vxy$。
- 我们可以用较高层的子树替换较低层的子树 (泵升)，或者反之 (泵降)，生成的字符串仍由文法生成。

**典型例子**: 证明 $L = \{a^nb^nc^n \mid n \ge 0\}$ 不是 CFL。
1.  **假设** $L$ 是 CFL，设 $p$ 为泵长度。
2.  **选择** $s = a^pb^pc^p \in L$。
3.  根据引理，存在分割 $s = uvxyz$，满足 $|vxy| \le p$ 和 $|vy| > 0$。
4.  **分析情况**: 由于 $|vxy| \le p$，子串 $vxy$ 不可能同时包含 $a, b, c$ 三种字符 (因为 $a$ 区和 $c$ 区中间隔着 $p$ 个 $b$)。
    - 情况 1: $v$ 和 $y$ 只包含一种类型的字符 (例如全 $a$)。泵升后该字符数量增加，其他不变，破坏相等关系。
    - 情况 2: $v$ 和 $y$ 包含两种类型的字符 (例如 $a$ 和 $b$)。泵升后 $a$ 和 $b$ 数量增加，$c$ 不变，破坏相等关系。
5.  无论哪种情况，$uv^2xy^2z \notin L$。
6.  **结论**: $L$ 不是 CFL。

#### 进阶引理
- **奥格登引理 (Ogden's Lemma)**:
    - CFL 泵引理的推广，提供了更强的约束力。
    - **定理**: 若 $A$ 是 CFL，则存在长度 $p$。对于任意 $s \\in A$ 且我们在 $s$ 中标记了至少 $p$ 个位置，则 $s$ 可分割为 $uvxyz$，满足：
        1. $\\forall i \\ge 0, uv^ixy^iz \\in A$
        2. $v$ 和 $y$ 中至少包含一个**标记**位置。
        3. $vxy$ 中最多包含 $p$ 个**标记**位置。
    - **用途**: 用于证明某些即使满足普通泵引理但仍非 CFL 的语言 (例如某些具有特定结构的语言)。
- **交换引理 (Interchange Lemma)**:
    - 另一个用于证明非 CFL 的强力工具，特别是当泵引理失效时。
    - **定理**: 设 $L$ 是 CFL。则存在常数 $c > 0$，使得对于 $L$ 的任意长度为 $n$ 的子集 $S_n \\subseteq L \\cap \\Sigma^n$，若 $|S_n|$ 足够大，则存在 $S_n$ 的子集 $Z \\subseteq S_n$，使得 $Z$ 中的任意两个串 $w_i, w_j$ 都可以分解为 $w_i = x_i y_i z_i, w_j = x_j y_j z_j$，满足：
        1. $|x_i| = |x_j|, |y_i| = |y_j|, |z_i| = |z_j|$
        2. $|y_i| > 0$
        3. 交换中间部分后仍属于 $L$，即 $x_i y_j z_i \\in L$ 且 $x_j y_i z_j \\in L$。

### 乔姆斯基谱系 (Chomsky Hierarchy)

| 文法类型 | 文法名称 | 产生式规则 | 对应自动机 | 对应语言 |
| :--- | :--- | :--- | :--- | :--- |
| **0 型** | 无限制文法 | $\\alpha \\to \\beta$ | 图灵机 (TM) | 递归可枚举 (RE) |
| **1 型** | 上下文有关文法 (CSG) | $\\alpha A \\beta \\to \\alpha \\gamma \\beta, |\\gamma| \\ge 1$ | 线性有界自动机 (LBA) | 上下文有关 (CSL) |
| **2 型** | 上下文无关文法 (CFG) | $A \\to \\gamma$ | 下推自动机 (PDA) | 上下文无关 (CFL) |
| **3 型** | 正则文法 | $A \\to aB$ 或 $A \\to a$ | 有限自动机 (DFA/NFA) | 正则语言 (Regular) |

**包含关系**: Regular $\\subsetneq$ CFL $\\subsetneq$ CSL $\\subsetneq$ RE。

## 2. 可计算性理论 (Computability Theory)

### 图灵机 (Turing Machines)

#### 形式化定义 (Formal Definition)
图灵机是一个 7 元组 $M = (Q, \\Sigma, \\Gamma, \\delta, q\_0, q\_{accept}, q\_{reject})$，其中：
1.  $Q$: 有限状态集合。
2.  $\\Sigma$: 输入字母表 (不包含空白符 $\\textvisiblespace$)。
3.  $\\Gamma$: 纸带字母表 (包含 $\\Sigma$ 和 $\\textvisiblespace$)。
4.  $\\delta$: 转移函数 $Q \\times \\Gamma \\to Q \\times \\Gamma \\times \\{L, R\\}$。
    - 含义：根据当前状态和读写头下的字符，决定(1)新状态，(2)写入的新字符，(3)读写头移动方向(左/右)。
5.  $q\_0 \\in Q$: 起始状态。
6.  $q\_{accept} \\in Q$: 接受状态。
7.  $q\_{reject} \\in Q$: 拒绝状态 ($q\_{reject} \\ne q\_{accept}$)。

#### 组态与计算 (Configuration and Computation)
- **组态 (Configuration)**: 包含当前状态、当前纸带内容和读写头位置的快照。
    - 表示为 $u q v$，其中 $q \\in Q$，纸带内容为 $uv$，读写头位于 $v$ 的第一个字符上。
- **计算过程**: 从起始组态 $q\_0 w$ 开始，根据转移函数 $\\delta$ 一步步更新组态。
- **停机**: 当进入 $q\_{accept}$ 或 $q\_{reject}$ 时，计算立即停止。

#### 语言识别 (Language Recognition)
- **图灵可识别 (Turing-recognizable / Recursively Enumerable)**:
    - 语言 $L$ 被图灵机 $M$ 识别，即 $L(M) = L$。
    - 对 $w \\in L$，M 最终进入 $q\_{accept}$。
    - 对 $w \\notin L$，M 可能进入 $q\_{reject}$，也可能**无限循环 (Loop)**。
- **图灵可判定 (Turing-decidable / Recursive)**:
    - 语言 $L$ 被图灵机 $M$ 判定。
    - M 是一个**判定器 (Decider)**：对任何输入，M 都能在有限步内停机 (接受或拒绝)，**绝不循环**。

#### 变体 (Variants)
- **多带图灵机 (Multitape TM)**:
    - 拥有 $k$ 条独立的纸带和读写头。
    - **等价性**: 多带 TM 等价于单带 TM (可以相互模拟，时间复杂度仅差平方级别)。
- **非确定性图灵机 (NTM)**:
    - 转移函数 $\\delta: Q \\times \\Gamma \\to \\mathcal{P}(Q \\times \\Gamma \\times \\{L, R\\})$。
    - **等价性**: NTM 等价于 DTM (可以通过广度优先搜索模拟 NTM 的所有分支)。
- **枚举器 (Enumerator)**:
    - 带有打印机的图灵机，用于枚举语言中的所有字符串。
    - $L$ 是图灵可识别的 $\\iff$ 存在枚举器枚举 $L$。

#### 通用图灵机 (Universal Turing Machine)
- **定义**: 一个能模拟任何其他图灵机的图灵机 $U$。
- **输入**: $\\langle M, w \\rangle$，其中 $M$ 是图灵机的编码，$w$ 是输入串。
- **工作原理**: $U$ 在自己的纸带上模拟 $M$ 在 $w$ 上的运行过程。
- **意义**: 证明了“存储程序计算机”的可行性，是现代计算机的理论基础。

#### 丘奇-图灵论题 (Church-Turing Thesis)
> **核心观点**: 任何直观上“可计算”的算法，都可以由图灵机执行。
> 这意味着图灵机不仅仅是一种数学模型，它捕捉到了计算的本质极限。

### 可判定性 (Decidability)
- **可判定语言 (Decidable Languages)**: 存在一个图灵机，对任何输入都能在有限步内停机并给出“接受”或“拒绝”的判定。
- **图灵可识别语言 (Turing-recognizable / RE)**: 存在一个图灵机，对属于该语言的输入会停机接受；对不属于的输入可能拒绝，也可能无限循环。
    - **补集性质**: 语言 $A$ 是可判定的 $\\iff$ $A$ 和 $\\bar{A}$ 都是图灵可识别的。

#### 停机问题 (Halting Problem)
- **定义**: $A\_{TM} = \\{ \\langle M, w \\rangle \\mid M \\text{ is a TM and } M \\text{ accepts } w \\}$
- **结论**: $A\_{TM}$ 是不可判定的（Undecidable）。
- **证明方法**: 对角线法 (Diagonalization)。

#### 不可判定性证明 (Undecidability Proofs)
- **归约 (Reduction)**: 若 $A \\le\_m B$ 且 $A$ 不可判定，则 $B$ 不可判定。
- **莱斯定理 (Rice's Theorem)**: 
    - **定理**: 设 $P$ 是图灵可识别语言类的非平凡性质，则判定一个语言是否具有性质 $P$ 是不可判定的。
    - **非平凡性质**: 至少有一个语言满足 $P$，且至少有一个语言不满足 $P$。
    - **例子**: 判定 $L(M)$ 是否为空、是否有限、是否包含 "101" 等。
- **波斯特对应问题 (PCP)**: 给定一组多米诺骨牌，是否存在排列使得上下字符串相同？（不可判定）。

## 3. 计算复杂性理论 (Complexity Theory)

### 时间复杂性类 (Time Complexity Classes)
- **P (Polynomial time)**: 确定性单带图灵机在多项式时间内可判定的语言类。
    - 代表“有效可解”的问题。
- **NP (Nondeterministic Polynomial time)**: 非确定性图灵机在多项式时间内可判定的语言类。
    - 等价定义：可以在多项式时间内**验证**一个解的问题类。
    - $P \\subseteq NP$。

### P vs NP 问题
- **核心问题**: $P \\stackrel{?}{=} NP$
    - 即：对于所有易于验证解的问题，是否也都易于求解？
- **普遍猜想**: $P \\neq NP$。
    - 这意味着存在一些问题，虽然验证其解很容易，但找到解却非常困难。

### NP 完全性 (NP-Completeness)
- **多项式时间归约 (Polynomial-time reduction)**: 若问题 A 可以多项式时间归约为问题 B ($A \\le\_p B$)，则 B 至少和 A 一样难。
- **NP-Complete (NPC)**:
    1. $L \\in NP$
    2. $\\forall L' \\in NP, L' \\le\_p L$ (即 L 是 NP 中最难的问题)
- **Cook-Levin 定理**: SAT 问题是 NPC 的。
- **常见 NPC 问题**:
    - 3-SAT
    - 团问题 (Clique)
    - 顶点覆盖 (Vertex Cover)
    - 哈密顿路径 (Hamiltonian Path)
    - 旅行商问题 (TSP)
    - 子集和问题 (Subset Sum)

### 空间复杂性类 (Space Complexity Classes)
- **PSPACE**: 确定性图灵机在多项式空间内可判定的语言类。
- **NPSPACE**: 非确定性图灵机在多项式空间内可判定的语言类。
- **萨维奇定理 (Savitch's Theorem)**:
    - 对于任何函数 $f(n) \\ge n$，有 $NSPACE(f(n)) \\subseteq SPACE(f^2(n))$。
    - 推论：$PSPACE = NPSPACE$。
- **PSPACE-Complete**:
    - **TQBF (True Quantified Boolean Formulas)**: 带有全称 ($\\forall$) 和存在 ($\\exists$) 量词的布尔公式真值问题。
    - 包含关系：$P \\subseteq NP \\subseteq PSPACE = NPSPACE \\subseteq EXPTIME$。

### 进阶定理 (Advanced Theorems)
- **时间分层定理 (Time Hierarchy Theorem)**:
    - 对于任何时间可构造函数 $t(n)$，存在语言在 $O(t(n))$ 时间内可判定，但不能在 $o(t(n)/\\log t(n))$ 时间内判定。
    - 结论：$P \\subsetneq EXPTIME$。

### 复杂性类关系图谱

| 复杂性类 | 定义 (自动机/资源) | 典型问题 | 备注 |
| :--- | :--- | :--- | :--- |
| **P** | DTM + Poly Time | 排序, 最短路径 | 有效可解 |
| **NP** | NTM + Poly Time | SAT, TSP, Clique | 易验证，难求解 |
| **PSPACE** | DTM + Poly Space | TQBF, 广义地理游戏 | 空间资源受限 |
| **EXPTIME** | DTM + Exp Time | 广义国际象棋 | 极其困难 |

**包含链**:
$$ P \\subseteq NP \\subseteq PSPACE = NPSPACE \\subseteq EXPTIME $$
