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

> 本笔记涵盖计算理论的三大核心领域：**自动机与语言**、**可计算性理论**和**计算复杂性理论**，系统梳理从有限自动机到图灵机，从可判定性到NP完全性的核心概念与定理。

---

## 1. 自动机与语言 (Automata and Languages)

### 正则语言 (Regular Languages)

#### 有限自动机 (Finite Automata)

> [!NOTE]
> **确定性有限自动机 (DFA)**: $M = (Q, \Sigma, \delta, q_0, F)$
> **非确定性有限自动机 (NFA)**: 允许 $\epsilon$ 转移，同一输入可能有多个转移路径。

**等价性与转化**:
- **NFA $\to$ DFA (子集构造法)**: 
    - DFA 的每个状态对应 NFA 状态的一个子集。
    - 转移函数考虑 $\epsilon$-闭包：
      $$\delta_{DFA}(R, a) = \bigcup_{r \in R} E(\delta_{NFA}(r, a))$$
- **RegEx $\to$ NFA (Thompson 构造法)**: 
    - 模块化构造基础 NFA，利用 $\epsilon$ 转移实现并 ($A \cup B$)、连接 ($AB$) 和星号 ($A^*$) 运算。
- **DFA $\to$ RegEx (状态消除法)**: 
    - 转化为 GNFA 后逐步消除中间状态。
    - 路径更新公式：
      $$R_{new} = R_{old} \cup (R_{in} R_{loop}^* R_{out})$$

#### 正则表达式 (Regular Expressions)
- **定义**: 描述正则语言的代数表示。

#### 封闭性 (Closure Properties)

正则语言在以下运算下**封闭**：
- ✓ 并 (Union)
- ✓ 交 (Intersection)  
- ✓ 补 (Complement)
- ✓ 连接 (Concatenation)
- ✓ 星号 (Kleene Star)

#### Myhill-Nerode 定理
- **用途**: 用于证明语言非正则，或证明 DFA 的最小性。
- **定理**: $L$ 是正则语言 $\\iff$ $L$ 的等价类数目有限。

#### 泵引理 (Pumping Lemma for Regular Languages)

> [!IMPORTANT]
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
- **定义**: $G = (V, \Sigma, R, S)$
    - 产生式规则形式：$A \to \alpha$，其中 $A \in V, \alpha \in (V \cup \Sigma)^*$.

##### 派生与派生树 (Derivations & Parse Trees)
- **派生 (Derivation)**: 通过反复应用产生式规则，从起始符 $S$ 生成字符串的过程。
- **最左派生 (Leftmost Derivation)**: 在推导的每一步中，总是选择字符串中最左边的非终结符进行替换。
- **最右派生 (Rightmost Derivation)**: 总是替换最右边的非终结符。
- **派生树 (Parse Tree)**: 派生的图形化表示，它忽略了替换的顺序，只关注“谁生成了谁”。

##### 歧义性 (Ambiguity)
- **定义**: 如果一个文法对同一个字符串存在**两棵不同的派生树**（或两个不同的最左/最右派生），则称该文法是**歧义的 (Ambiguous)**。

> [!WARNING]
> **为什么歧义性很糟糕？**  
> 在编译器设计中，派生树决定了程序的语义。例如，在算术表达式中，不同的派生树可能导致不同的运算优先级：
> - 文法: $E \to E + E \mid E \times E \mid \text{id}$
> - 字符串: $a + b \times c$
> - **歧义**: 它可以被解析为 $(a+b) \times c$ 或 $a + (b \times c)$。

- **固有歧义 (Inherently Ambiguous Language)**: 有些语言（如 $\{a^i b^j c^k \mid i=j \text{ 或 } j=k\}$）无论用什么 CFG 描述都是歧义的。
##### 乔姆斯基范式 (CNF)
- **定义**: 产生式规则仅限于以下两种形式：
    1. $A \to BC$ (两个非终结符)
    2. $A \to a$ (一个终结符)
    - (可选) $S \to \epsilon$ (如果语言包含空串，且 $S$ 不出现在规则右侧)。

> [!TIP]
> **为什么要用 CNF？**  
> 1. **二叉树性质**: CNF 生成的派生树始终是二叉树，这使得算法处理（如动态规划）变得极其高效。
> 2. **解析算法**: 它是 **CYK 算法**（在 $O(n^3)$ 时间内判定一个串是否属于该语言）的基础。
> 3. **长度预测**: 对于长度为 $n$ 的字符串，CNF 的派生步数正好是 $2n-1$。

##### 任意 CFG 转化为 CNF 的算法
任何不包含空串（或修正后）的上下文无关语言都可以转化为 CNF，分为四个步骤：

1.  **引入新起始符**: 
    - 添加 $S_0 \to S$，确保原有起始符不出现在产生式的右侧。
2.  **消除 $\epsilon$-产生式**: 
    - 找出所有能推导出空串的变量 $A$ ($A \Rightarrow^* \epsilon$)。
    - 对于每条包含 $A$ 的规则（如 $B \to uAv$），添加一条不含该 $A$ 的规则（如 $B \to uv$）。
3.  **消除单位产生式**: 
    - 找出所有 $A \to B$ 的规则。
    - 如果有 $B \to u$，则直接添加 $A \to u$。重复此过程直至消除所有单纯的非终结符替换。
4.  **转换剩余规则**: 
    - **混合规则**: 对于 $A \to Ba$，改写为 $A \to BU$ 和 $U \to a$。
    - **过长规则**: 对于 $A \to B_1 B_2 \dots B_k$ ($k > 2$)，改写为串联的二元规则：$A \to B_1 C_1, C_1 \to B_2 C_2 \dots$。

#### 下推自动机 (Pushdown Automata, PDA)

> [!NOTE]
> **形式化定义**: $M = (Q, \Sigma, \Gamma, \delta, q_0, F)$
> - $\Gamma$: 栈字母表。
> - PDA $\approx$ 拥有无限容量栈 (LIFO) 的 NFA。

**等价性**: 一个语言是上下文无关的 $\iff$ 它被某个 PDA 识别。

##### 1. CFG $\to$ PDA (自顶向下模拟解析)
- **核心逻辑**: 在 PDA 栈中模拟 CFG 的**最左推导**。栈用于存储尚未匹配的推导符号。
- **PDA 构造**: 
    - 设 CFG 为 $G = (V, \Sigma, R, S)$。构造 PDA $P = (\{q_{start}, q_{loop}, q_{accept}\}, \Sigma, V \cup \Sigma, \delta, q_{start}, \{q_{accept}\})$。
- **转移函数规则**:
    1. **初始化**: $\delta(q_{start}, \epsilon, \epsilon) = \{(q_{loop}, S\$)\}$ (将起始符和结束标志压栈)。
    2. **展开非终结符**: 对于每个产生式 $A \to w \in R$:
       $$\delta(q_{loop}, \epsilon, A) = \{(q_{loop}, w)\}$$
       *(若栈顶是变量，则非确定性地替换为其右部)*。
    3. **匹配终结符**: 对于每个 $a \in \Sigma$:
       $$\delta(q_{loop}, a, a) = \{(q_{loop}, \epsilon)\}$$
       *(若栈顶是终结符且与输入匹配，则弹出并读取输入)*。
    4. **结束**: $\delta(q_{loop}, \epsilon, \$) = \{(q_{accept}, \epsilon)\}$。

##### 2. PDA $\to$ CFG (状态对路径构造)
- **目标**: 定义变量 $A_{pq}$，使其生成所有能让 PDA 从状态 $p$ 开始（栈为空）运行到状态 $q$（栈再次为空）的字符串。
- **构造三部曲**:
    1. **基础规则 (Base Case)**:
       - $\forall p \in Q: A_{pp} \to \epsilon$ (原地不动产生空串)。
    2. **串联规则 (Concatenation)**:
       - $\forall p, q, r \in Q: A_{pq} \to A_{pr} A_{rq}$ (路径可以拆分为经过中间状态 $r$ 的两段)。
    3. **嵌套规则 (Nested Step)**:
       - 如果 $p$ 读取 $a$ 压入 $t$，且 $s$ 读取 $b$ 弹出 $t$ 后到达 $q$：
       $$A_{pq} \to a A_{rs} b$$
       *(这表示栈顶符号 $t$ 的生命周期始于 $p \to r$，终于 $s \to q$)*。

> [!TIP]
> **算法直觉**: 这个转换本质上是将 PDA 的**运行轨迹**映射回文法的**派生树**。PDA 的压栈对应树的生长，弹栈对应树枝的结束。

#### 确定性下推自动机 (DPDA)
- 确定性的 PDA（每一步转移是唯一的，且 $\epsilon$ 转移有限制）。
- **能力差异**: DPDA 识别的语言类（确定性上下文无关语言, DCFL）是 CFL 的真子集 ($DCFL \subsetneq CFL$)。
- 例如：$\{ww^R\}$ 是 CFL 但不是 DCFL；$\{wcw^R\}$ 是 DCFL。
- DPDA 能够被确定性地解析，这对编译器设计很重要。

#### 封闭性 (Closure Properties)

CFL 的封闭性：
- ✓ 并 (Union)
- ✓ 连接 (Concatenation)  
- ✓ 星号 (Kleene Star)
- ✗ 交 (Intersection) - **不封闭**
- ✗ 补 (Complement) - **不封闭**

> [!NOTE]
> CFL 与正则语言的交集仍是 CFL。

#### 泵引理 (Pumping Lemma for CFL)

> [!IMPORTANT]
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

#### CFL 的判定问题与不可判定性 (Decidability Boundary)

虽然 CFL 比正则语言更强大，但这种能力的提升也带来了代价：许多在正则语言中可判定的问题，在 CFL 中变成了**不可判定**的。

| 问题 (Decision Problem) | 是否可判定 | 常用方法 / 备注 |
| :--- | :---: | :--- |
| **$A_{CFG}$ (成员资格)** | **✓ 是** | **CYK 算法**: 基于动态规划，复杂度 $O(n^3)$。 |
| **$E_{CFG}$ (空性)** | **✓ 是** | **标记算法**: 从终结符开始向上标记可达非终结符。 |
| **$ALL_{CFG}$ (通用性)** | **✗ 否** | 判定 $L(G) = \Sigma^*$ 是不可判定的（可通过 TM 接受轨迹规约）。 |
| **$EQ_{CFG}$ (相等性)** | **✗ 否** | 判定两个 CFG 是否生成相同语言是不可判定的。 |

> [!CAUTION]
> **危险的“相等性”**: 
> 能够判定两个 DFA 是否等价（通过最小化等），但**无法判定两个 CFG 是否等价**。这意味着对于复杂的代码语法，没有通用的算法能判断两套文法规则是否完全一致。

#### 经典案例深度探讨: $ww, ww^R$ 与 $\overline{ww}$

通过对比这三个极具代表性的语言，可以深入理解 PDA 的限制与能力：

| 语言 | 是否为 CFL | 核心 Insight (物理直觉) |
| :--- | :---: | :--- |
| **$ww^R$** | **✓ 是** | **栈的 LIFO 特性**: 栈天然支持“后进先出”。当我们把 $w$ 压入栈时，弹出的顺序正好是 $w^R$。非确定性 PDA 可以“猜”中点。 |
| **$ww$** | **✗ 否** | **先进先出的缺失**: 栈无法直接匹配“先进先出”的序列。要匹配第二个 $w$ 的第一个字符，它被压在栈底，无法触达。 |
| **$\overline{ww}$** | **✓ 是** | **非确定性的力量**: 虽然判定相等很难，但在非确定性下“寻找一个错误”很简单。只要存在一个位置 $i$ 使得 $s_i \neq s_{i+n}$，就是非 $ww$。 |

---

##### 1. 为什么 $ww^R$ 是 CFL？
- **PDA 构造**: 
    1. 处于状态 $q_1$ 时，读取字符并压入栈。
    2. **非确定性地**猜测字符串的中点，跳转到状态 $q_2$。
    3. 在 $q_2$ 中，每读取一个字符，就从栈顶弹出一个字符进行对比。
    4. 如果全部匹配且栈正好清空，则接受。
- **Key Insight**: 栈的**局部性 (Locality)**。匹配 $ww^R$ 只需要知道“最近”读到了什么，这与栈的顶端操作完美契合。

##### 2. 为什么 $ww$ 不是 CFL？
- **直观证明**: 考虑 $s = a^p b^p a^p b^p$。泵引理的 $vxy$ 窗口长度为 $p$，它只能跨越 $a^p$ 或 $a^p b^p$ 或 $b^p$ 等局部区域，无法同时改变第一段 $w$ 和第二段 $w$ 中对应的位置而保持它们相同。
- **Key Insight**: **远距离关联 (Long-range correlation)**。栈只能处理嵌套结构的关联（如括号匹配），无法处理平行的跨度关联。

##### 3. 为什么 $\overline{ww}$ (非 $ww$) 竟然是 CFL？
这是一个违反直觉的结论，因为 CFL 在补集运算下不封闭。
- **核心逻辑**: 一个偶数长度字符串 $s \in \overline{ww}$ 当且仅当 $\exists i, j$ 满足 $|i-j| = n$ 且 $s_i \neq s_j$ ($n$ 为半长)。
- **CFG 设计思路**:
    - 一个非 $ww$ 的字符串可以表示为：$A B$ 或 $B A$。
    - 其中 $A$ 是一个形如 $x \dots y$ 的序列，其中第 $k$ 个字符和倒数第 $k$ 个字符... 这种构造比较复杂，更简单的理解是：
    - 它可以转化为检测是否存在 $s_i \neq s_{j}$ 且中间隔了刚好 $n-1$ 个字符。
- **Key Insight**: **非确定性的不对称性**。证明“所有位置都对等”需要全局一致性（PDA 做不到）；但证明“存在一个位置不对”只需要非确定性地选中那个位置并局部验证（PDA 擅长）。

#### 深度讨论：非确定性与语法分析 (Deeper Insights)

在理解 CFG 与 PDA 时，有两个极其关键的理论与工程问题值得讨论：

##### 1. 为什么“非确定性”对 PDA 如此重要？
在**有限自动机**中，$NFA = DFA$。但在**下推自动机**中，$NPDA > DPDA$。
- **原因**: 栈是 LIFO 的。在 NPDA 中，我们可以在不知道后续输入的情况下，“非确定性地”尝试不同的栈操作分支。即便某个分支失败了，栈的状态在其他分支中是独立保留的。
- **直觉**: 想象一个迷宫（PDA 的纸带+栈）。NFA 只是在房间里走，标记过的地方可以记下来；而 PDA 带着一卷无限长的绳子（栈），非确定性允许它在分岔路口同时尝试多条路径，每条路径都有自己的“解绳子”进度。

##### 2. 语法分析器 (Parser) 是如何解决非确定性的？
虽然 NPDA 更有能力，但现代编程语言几乎都设计成 **Deterministic (DCFL)**，以便编译器能快速解析。
- **向前看 (Lookahead)**: 编译器（如 Yacc, Bison）通过查看后续的 1 个或 $k$ 个符号来消除非确定性分支。
- **文法分级**: 
    - **LL(k)**: 自顶向下，从左到右，最左派生。
    - **LR(k)**: 自底向上，从左到右，最右派生（更强大，能处理更多文法）。

### 乔姆斯基谱系 (Chomsky Hierarchy)

> [!NOTE]
> 乔姆斯基谱系将形式语言按生成能力划分为四个层次，每一层对应不同的文法类型和自动机模型。

| 文法类型 | 文法名称 | 产生式规则 | 对应自动机 | 对应语言 |
|:---:|:---|:---|:---|:---|
| **0 型** | 无限制文法 | $\alpha \to \beta$ | 图灵机 (TM) | 递归可枚举 (RE) |
| **1 型** | 上下文有关文法 (CSG) | $\alpha A \beta \to \alpha \gamma \beta$ | 线性有界自动机 (LBA) | 上下文有关 (CSL) |
| **2 型** | 上下文无关文法 (CFG) | $A \to \gamma$ | 下推自动机 (PDA) | 上下文无关 (CFL) |
| **3 型** | 正则文法 | $A \to aB$ 或 $A \to a$ | 有限自动机 (DFA/NFA) | 正则语言 (Regular) |

**包含关系**:
```
Regular ⊊ CFL ⊊ CSL ⊊ RE
```

## 2. 可计算性理论 (Computability Theory)

### 图灵机 (Turing Machines)

#### 形式化定义 (Formal Definition)

> [!NOTE]
> 图灵机是一个 7 元组 $M = (Q, \Sigma, \Gamma, \delta, q_0, q_{accept}, q_{reject})$

1.  **$Q$**: 有限状态集合。
2.  **$\Sigma$**: 输入字母表 (不含空白符 $\sqcup$)。
3.  **$\Gamma$**: 纸带字母表 (包含 $\Sigma$ 和 $\sqcup$)。
4.  **$\delta$**: 转移函数 $Q \times \Gamma \to Q \times \Gamma \times \{L, R\}$。
    - 决定：(新状态, 写入字符, 移动方向)。
5.  **$q_0$**: 起始状态。
6.  **$q_{accept}$**: 接受状态。
7.  **$q_{reject}$**: 拒绝状态 ($q_{reject} \neq q_{accept}$)。

计算理论（Theory of Computation）是计算机科学的数学基础，主要研究计算过程及其界限。
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

> [!TIP]
> **核心观点**: 任何直观上"可计算"的算法，都可以由图灵机执行。
> 
> 这意味着图灵机不仅仅是一种数学模型，它捕捉到了**计算的本质极限**。

### 可判定性 (Decidability)

**可判定语言 (Decidable Languages)**  
存在一个图灵机，对任何输入都能在有限步内停机并给出"接受"或"拒绝"的判定。

**图灵可识别语言 (Turing-recognizable / RE)**  
存在一个图灵机，对属于该语言的输入会停机接受；对不属于的输入可能拒绝，也可能无限循环。

> [!NOTE]
> **补集性质**: 语言 $A$ 是可判定的 $\iff$ $A$ 和 $\\bar{A}$ 都是图灵可识别的。

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

> [!CAUTION]
> **千禧年大奖难题**: $P \stackrel{?}{=} NP$ 是计算机科学最重要的未解问题之一。
> 
> **问题本质**: 对于所有易于验证解的问题，是否也都易于求解？

**普遍猜想**: $P \neq NP$
- 这意味着存在一些问题，虽然**验证其解很容易**，但**找到解却非常困难**。

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

| 复杂性类 | 定义 (自动机/资源) | 典型问题 | 特点 |
|:---:|:---|:---|:---|
| **P** | DTM + 多项式时间 | 排序, 最短路径 | 有效可解 |
| **NP** | NTM + 多项式时间 | SAT, TSP, Clique | 易验证，难求解 |
| **PSPACE** | DTM + 多项式空间 | TQBF, 广义地理游戏 | 空间资源受限 |
| **EXPTIME** | DTM + 指数时间 | 广义国际象棋 | 极其困难 |

**包含链**:
```
P ⊆ NP ⊆ PSPACE = NPSPACE ⊆ EXPTIME
```

> [!NOTE]
> 已知 $P \subsetneq EXPTIME$（时间分层定理），但 $P$ 与 $NP$、$NP$ 与 $PSPACE$ 的关系仍未解决。
