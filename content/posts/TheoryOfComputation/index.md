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
    - 用于证明某些语言**不是**正则语言。
    - 若 $A$ 是正则语言，则存在泵长度 $p$，使得 $\forall s \in A, |s| \ge p$，可以将 $s$ 分割为 $xyz$，满足：
        1. $\forall i \ge 0, xy^iz \in A$
        2. $|y| > 0$
        3. $|xy| \le p$

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
    - **PDA $\to$ CFG (构造思路)**:
        - 目标：构造文法 $G$，使得 $L(G) = L(M)$。
        - 变量：引入非终结符 $A_{pq}$，表示 PDA 从状态 $p$ 读入字符串并到达状态 $q$，且栈在过程结束时回到与开始时相同的高度（净变化为 0）。
        - 产生式规则：
            1. $\forall p \in Q, A_{pp} \to \epsilon$。
            2. $\forall p, q, r \in Q, A_{pq} \to A_{pr} A_{rq}$。
            3. 若 PDA 存在转移 $(r, x) \in \delta(p, a, \epsilon)$ (推入 x) 和 $(q, \epsilon) \in \delta(s, b, x)$ (弹出 x)，则添加规则 $A_{pq} \to a A_{rs} b$。
- **确定性下推自动机 (DPDA)**:
    - 确定性的 PDA（每一步转移是唯一的，且 $\epsilon$ 转移有限制）。
    - **能力差异**: DPDA 识别的语言类（确定性上下文无关语言, DCFL）是 CFL 的真子集 ($DCFL \subsetneq CFL$)。
    - 例如：$\{ww^R\}$ 是 CFL 但不是 DCFL；$\{wcw^R\}$ 是 DCFL。
    - DPDA 能够被确定性地解析，这对编译器设计很重要。
- **封闭性 (Closure Properties)**:
    - CFL 在 **并、连接、星号** 运算下封闭。
    - CFL 在 **交、补** 运算下 **不封闭**。
    - CFL 与正则语言的交集是 CFL。
- **泵引理 (Pumping Lemma for CFL)**: 用于证明某些语言不是上下文无关语言。
    - 字符串 $s$ 可分为 $uvxyz$，满足 $|vxy| \le p, |vy| > 0$，且 $\forall i \ge 0, uv^ixy^iz \in A$。

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
