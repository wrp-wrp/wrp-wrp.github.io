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
- **有限自动机 (Finite Automata)**
    - **确定性有限自动机 (DFA)**: $M = (Q, \Sigma, \delta, q_0, F)$
    - **非确定性有限自动机 (NFA)**: 允许 $\epsilon$ 转移，同一输入可能有多个转移路径。
    - **等价性与转化**:
        - **NFA $\to$ DFA (子集构造法 / Subset Construction)**: 
            - DFA 的每个状态对应 NFA 状态的一个子集。
            - 转移函数考虑 $\epsilon$-闭包：$\delta_{DFA}(R, a) = \bigcup_{r \in R} E(\delta_{NFA}(r, a))$。
        - **RegEx $\to$ NFA**: 
            - 模块化构造：对 $a, \epsilon, \emptyset$ 建立基础 NFA。
            - 组合：利用 $\epsilon$ 转移实现并 ($A \cup B$)、连接 ($AB$) 和星号 ($A^*$) 运算。
        - **DFA $\to$ RegEx (状态消除法 / GNFA)**: 
            - 转化为 GNFA (边标记为正则表达式)。
            - 逐步消除中间状态，更新剩余状态间的正则表达式路径：$R_{new} = R_{old} \cup (R_{in} R_{loop}^* R_{out})$。
- **正则表达式 (Regular Expressions)**: 描述正则语言的代数表示。
- **封闭性 (Closure Properties)**:
    - 正则语言在 **并、交、补、连接、星号** 运算下封闭。
- **Myhill-Nerode 定理**:
    - 用于证明语言非正则，或证明 DFA 的最小性。
    - $L$ 是正则语言 $\iff$ $L$ 的等价类数目有限。
- **泵引理 (Pumping Lemma for Regular Languages)**：
    - **用途**: 用于证明某些语言**不是**正则语言 (反证法)。
    - **定理**: 若 $A$ 是正则语言，则存在泵长度 $p$ (取决于 $A$ 的 DFA 状态数)，使得 $\forall s \in A, |s| \ge p$，可以将 $s$ 分割为 $xyz$，满足：
        1. $\forall i \ge 0, xy^iz \in A$ (可以将 $y$ 重复任意次，结果仍在语言中)
        2. $|y| > 0$ (中间部分非空)
        3. $|xy| \le p$ (重复部分发生在开头的前 $p$ 个字符内)
    - **直观理解 (鸽巢原理)**: 
        - 设 DFA 有 $p$ 个状态。
        - 如果输入字符串 $s$ 的长度 $|s| \ge p$，则处理 $s$ 的前 $p$ 个字符时，DFA 必须经过 $p+1$ 个状态序列 (包含起始状态)。
        - 根据鸽巢原理，这 $p+1$ 个状态中至少有两个是相同的。
        - 这两个相同状态之间的路径形成了一个环 ($y$)。
        - 我们可以遍历这个环任意次 ($y^i$)，最终仍会到达相同的接受状态。
    - **典型例子**: 证明 $L = \{0^n1^n \mid n \ge 0\}$ 不是正则语言。
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
- **上下文无关文法 (CFG)**: $G = (V, \Sigma, R, S)$
    - 产生式规则形式：$A \to \alpha$，其中 $A \in V, \alpha \in (V \cup \Sigma)^*$。
    - **歧义性 (Ambiguity)**: 如果一个字符串有两棵不同的派生树（最左推导），则称该文法是歧义的。
    - **乔姆斯基范式 (CNF)**: 任何 CFL 都可以由 CNF 文法生成（产生式为 $A \to BC$ 或 $A \to a$）。
- **下推自动机 (Pushdown Automata, PDA)**: 
    - **定义**: $M = (Q, \Sigma, \Gamma, \delta, q_0, F)$，其中 $\Gamma$ 是栈字母表。
    - 相当于 NFA + 一个无限容量的栈 (Stack) (LIFO)。
    - **等价性**: 一个语言是上下文无关的，当且仅当它被某个 PDA 识别。
    - **CFG $\to$ PDA (模拟最左推导)**:
        - 核心思想：PDA 的栈用于存储当前的推导序列。
        - 扩展规则：
            1. **展开**: 若栈顶是**非终结符** $A$，非确定性地选择产生式 $A \to \alpha$，弹出 $A$ 并将 $\alpha$ (逆序) 压栈。
            2. **匹配**: 若栈顶是**终结符** $a$，读取输入字符 $a$，若匹配则弹出栈顶，否则拒绝。
    - **PDA $\to$ CFG (构造算法详解)**:
        1.  **预处理 PDA**:
            - 修改 PDA 使其满足：只有一个接受状态 $q_{accept}$；接受前清空栈；每次转移仅推入或弹出一个符号（或都不做）。
        2.  **变量定义**:
            - 引入非终结符 $A_{pq}$ ($\forall p, q \in Q$)。
            - $A_{pq}$ 生成所有能将 PDA 从状态 $p$ 带到 $q$ 且**栈净变化为 0** 的字符串（即开始和结束时栈高度相同，且中间过程栈不低于该高度）。
        3.  **产生式规则构造**:
            - **简化情形**: $\forall p \in Q, A_{pp} \to \epsilon$。
            - **路径拆分**: $\forall p, q, r \in Q, A_{pq} \to A_{pr} A_{rq}$。
            - **栈操作匹配**: 
                - 若存在转移 $(r, u) \in \delta(p, a, \epsilon)$ (读 $a$, 推 $u$) 和 $(q, \epsilon) \in \delta(s, b, u)$ (读 $b$, 弹 $u$)。
                - 则添加规则 $A_{pq} \to a A_{rs} b$。
                - 含义：$p \xrightarrow{a, +u} r \rightsquigarrow s \xrightarrow{b, -u} q$，中间 $r \to s$ 由 $A_{rs}$ 完成。
        4.  **起始符号**: $S = A_{q_{start}q_{accept}}$。
- **确定性下推自动机 (DPDA)**:
    - 确定性的 PDA（每一步转移是唯一的，且 $\epsilon$ 转移有限制）。
    - **能力差异**: DPDA 识别的语言类（确定性上下文无关语言, DCFL）是 CFL 的真子集 ($DCFL \subsetneq CFL$)。
    - 例如：$\{ww^R\}$ 是 CFL 但不是 DCFL；$\{wcw^R\}$ 是 DCFL。
    - DPDA 能够被确定性地解析，这对编译器设计很重要。
- **封闭性 (Closure Properties)**:
    - CFL 在 **并、连接、星号** 运算下封闭。
    - CFL 在 **交、补** 运算下 **不封闭**。
    - CFL 与正则语言的交集是 CFL。
- **泵引理 (Pumping Lemma for CFL)**:
    - **用途**: 用于证明某些语言**不是**上下文无关语言。
    - **定理**: 若 $A$ 是 CFL，则存在泵长度 $p$，使得 $\forall s \in A, |s| \ge p$，可以将 $s$ 分割为 $uvxyz$，满足：
        1. $\forall i \ge 0, uv^ixy^iz \in A$
        2. $|vy| > 0$ (即 $v$ 和 $y$ 不全为空)
        3. $|vxy| \le p$
    - **直观理解**: 
        - 考虑生成字符串 $s$ 的派生树 (Parse Tree)。
        - 若 $s$ 足够长，树的高度必然很高。
        - 如果树的高度超过 $|V|$ (非终结符的数量)，则在最长路径上必然会出现重复的非终结符 $R$。
        - 设路径上较底层的 $R$ 生成子串 $x$，较高层的 $R$ 生成子串 $vxy$。
        - 我们可以用较高层的子树替换较低层的子树 (泵升)，或者反之 (泵降)，生成的字符串仍由文法生成。
    - **典型例子**: 证明 $L = \{a^nb^nc^n \mid n \ge 0\}$ 不是 CFL。
        1.  **假设** $L$ 是 CFL，设 $p$ 为泵长度。
        2.  **选择** $s = a^pb^pc^p \in L$。
        3.  根据引理，存在分割 $s = uvxyz$，满足 $|vxy| \le p$ 和 $|vy| > 0$。
        4.  **分析情况**: 由于 $|vxy| \le p$，子串 $vxy$ 不可能同时包含 $a, b, c$ 三种字符 (因为 $a$ 区和 $c$ 区中间隔着 $p$ 个 $b$)。
            - 情况 1: $v$ 和 $y$ 只包含一种类型的字符 (例如全 $a$)。泵升后该字符数量增加，其他不变，破坏相等关系。
            - 情况 2: $v$ 和 $y$ 包含两种类型的字符 (例如 $a$ 和 $b$)。泵升后 $a$ 和 $b$ 数量增加，$c$ 不变，破坏相等关系。
        5.  无论哪种情况，$uv^2xy^2z \notin L$。
        6.  **结论**: $L$ 不是 CFL。
- **奥格登引理 (Ogden's Lemma)**:
    - CFL 泵引理的推广，提供了更强的约束力。
    - **定理**: 若 $A$ 是 CFL，则存在长度 $p$。对于任意 $s \in A$ 且我们在 $s$ 中标记了至少 $p$ 个位置，则 $s$ 可分割为 $uvxyz$，满足：
        1. $\forall i \ge 0, uv^ixy^iz \in A$
        2. $v$ 和 $y$ 中至少包含一个**标记**位置。
        3. $vxy$ 中最多包含 $p$ 个**标记**位置。
    - **用途**: 用于证明某些即使满足普通泵引理但仍非 CFL 的语言 (例如某些具有特定结构的语言)。
- **交换引理 (Interchange Lemma)** (进阶):
    - 另一个用于证明非 CFL 的强力工具，特别是当泵引理失效时。
    - **定理**: 设 $L$ 是 CFL。则存在常数 $c > 0$，使得对于 $L$ 的任意长度为 $n$ 的子集 $S_n \subseteq L \cap \Sigma^n$，若 $|S_n|$ 足够大，则存在 $S_n$ 的子集 $Z \subseteq S_n$，使得 $Z$ 中的任意两个串 $w_i, w_j$ 都可以分解为 $w_i = x_i y_i z_i, w_j = x_j y_j z_j$，满足：
        1. $|x_i| = |x_j|, |y_i| = |y_j|, |z_i| = |z_j|$
        2. $|y_i| > 0$
        3. 交换中间部分后仍属于 $L$，即 $x_i y_j z_i \in L$ 且 $x_j y_i z_j \in L$。

### 乔姆斯基谱系 (Chomsky Hierarchy)
文法 $G=(V, \Sigma, R, S)$ 根据产生式规则的限制分为四类：
1.  **0 型文法 (无限制文法)**:
    - 产生式：$\alpha \to \beta$ (无限制)。
    - 对应自动机：**图灵机 (Turing Machine)**。
    - 对应语言：**图灵可识别语言 (Recursively Enumerable)**。
2.  **1 型文法 (上下文有关文法, CSG)**:
    - 产生式：$\alpha A \beta \to \alpha \gamma \beta$，且 $|\gamma| \ge 1$ (即长度不减，除了 $S \to \epsilon$)。
    - 对应自动机：**线性有界自动机 (Linear Bounded Automata, LBA)**。
    - 对应语言：**上下文有关语言 (Context-Sensitive Languages)**。
3.  **2 型文法 (上下文无关文法, CFG)**:
    - 产生式：$A \to \gamma$。
    - 对应自动机：**下推自动机 (PDA)**。
    - 对应语言：**上下文无关语言 (CFL)**。
4.  **3 型文法 (正则文法, Regular Grammar)**:
    - 产生式：$A \to aB$ 或 $A \to a$ (右线性)。
    - 对应自动机：**有限自动机 (DFA/NFA)**。
    - 对应语言：**正则语言 (Regular Languages)**。

**包含关系**: Regular $\subsetneq$ CFL $\subsetneq$ CSL $\subsetneq$ RE。

## 2. 可计算性理论 (Computability Theory)

### 图灵机 (Turing Machines)
- **定义**: $M = (Q, \Sigma, \Gamma, \delta, q_0, q_{accept}, q_{reject})$
    - 拥有无限长的纸带，可读写，读写头可左右移动。
- **变体 (Variants)**:
    - **多带图灵机 (Multitape TM)**: 拥有 $k$ 条纸带。等价于单带图灵机。
    - **非确定性图灵机 (NTM)**: 转移函数 $\delta$ 返回状态集合。等价于确定性图灵机 (DTM)。
    - **枚举器 (Enumerator)**: 带有打印机的图灵机，用于枚举语言中的所有字符串。
- **丘奇-图灵论题 (Church-Turing Thesis)**：任何直观上可计算的算法，都可以由图灵机执行。

### 可判定性 (Decidability)
- **可判定语言 (Decidable Languages)**: 存在一个图灵机，对任何输入都能在有限步内停机并给出“接受”或“拒绝”的判定。
- **图灵可识别语言 (Turing-recognizable / RE)**: 存在一个图灵机，对属于该语言的输入会停机接受；对不属于的输入可能拒绝，也可能无限循环。
    - **补集性质**: 语言 $A$ 是可判定的 $\iff$ $A$ 和 $\bar{A}$ 都是图灵可识别的。
- **停机问题 (Halting Problem)**: $A_{TM} = \{ \langle M, w \rangle \mid M \text{ is a TM and } M \text{ accepts } w \}$
    - 结论：$A_{TM}$ 是不可判定的（Undecidable）。
    - 证明方法：对角线法 (Diagonalization)。
- **不可判定性证明 (Undecidability Proofs)**:
    - **归约 (Reduction)**: 若 $A \le_m B$ 且 $A$ 不可判定，则 $B$ 不可判定。
    - **莱斯定理 (Rice's Theorem)**: 设 $P$ 是图灵可识别语言类的非平凡性质，则判定一个语言是否具有性质 $P$ 是不可判定的。
        - 非平凡性质：至少有一个语言满足 $P$，且至少有一个语言不满足 $P$。
        - 例子：判定 $L(M)$ 是否为空、是否有限、是否包含 "101" 等。
    - **波斯特对应问题 (PCP)**: 给定一组多米诺骨牌，是否存在排列使得上下字符串相同？（不可判定）。

## 3. 计算复杂性理论 (Complexity Theory)

### 时间复杂性类 (Time Complexity Classes)
- **P (Polynomial time)**: 确定性单带图灵机在多项式时间内可判定的语言类。
    - 代表“有效可解”的问题。
- **NP (Nondeterministic Polynomial time)**: 非确定性图灵机在多项式时间内可判定的语言类。
    - 等价定义：可以在多项式时间内**验证**一个解的问题类。
    - $P \subseteq NP$。
- **时间分层定理 (Time Hierarchy Theorem)**:
    - 对于任何时间可构造函数 $t(n)$，存在语言在 $O(t(n))$ 时间内可判定，但不能在 $o(t(n)/\log t(n))$ 时间内判定。
    - 结论：$P \subsetneq EXPTIME$。

### 空间复杂性类 (Space Complexity Classes)
- **PSPACE**: 确定性图灵机在多项式空间内可判定的语言类。
- **NPSPACE**: 非确定性图灵机在多项式空间内可判定的语言类。
- **萨维奇定理 (Savitch's Theorem)**:
    - 对于任何函数 $f(n) \ge n$，有 $NSPACE(f(n)) \subseteq SPACE(f^2(n))$。
    - 推论：$PSPACE = NPSPACE$。
- **PSPACE-Complete**:
    - **TQBF (True Quantified Boolean Formulas)**: 带有全称 ($\forall$) 和存在 ($\exists$) 量词的布尔公式真值问题。
    - 包含关系：$P \subseteq NP \subseteq PSPACE = NPSPACE \subseteq EXPTIME$。

### NP 完全性 (NP-Completeness)
- **多项式时间归约 (Polynomial-time reduction)**: 若问题 A 可以多项式时间归约为问题 B ($A \le_p B$)，则 B 至少和 A 一样难。
- **NP-Complete (NPC)**:
    1. $L \in NP$
    2. $\forall L' \in NP, L' \le_p L$ (即 L 是 NP 中最难的问题)
- **Cook-Levin 定理**: SAT 问题是 NPC 的。
- **常见 NPC 问题**:
    - 3-SAT
    - 团问题 (Clique)
    - 顶点覆盖 (Vertex Cover)
    - 哈密顿路径 (Hamiltonian Path)
    - 旅行商问题 (TSP)
    - 子集和问题 (Subset Sum)

### P vs NP
- 核心问题：$P \stackrel{?}{=} NP$
- 目前普遍猜想 $P \neq NP$。
