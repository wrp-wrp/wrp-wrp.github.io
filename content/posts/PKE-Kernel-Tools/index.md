+++
date = '2025-12-02T12:00:00+08:00'
draft = false
math = false
toc = true
title = 'PKE 内核可用工具总览'
summary = "面向在 riscv-pke 中扩展代理内核时常用的函数、宏、类型与配套设施，按主题归类列举。"
+++

面向在 `riscv-pke` 中扩展代理内核时常用的函数、宏、类型与配套设施，按主题归类列举。每项均包含来源位置（`文件:行`）与推荐用法示例，方便查阅与复用。

## 1. RISC-V 体系结构与 CSR 工具

- `write_csr(name, value)` / `read_csr(name)`（`kernel/riscv.h:170-186`）  
  - **用途**：直接读写 `sstatus`、`sepc`、`stvec`、`satp` 等 CSR。  
  - **参数**：`name` 为 CSR 标识（宏），`value` 为 64 位值。  
  - **常见场景**：保存/恢复 `sepc`，在 trap 前后切换 `stvec`，开启中断位 (`SSTATUS_SIE`)。  
  - **示例**：`uint64 sepc = read_csr(sepc); write_csr(stvec, (uint64)smode_trap_vector);`
- `flush_tlb()`（`kernel/riscv.h:206`）  
  - **用途**：在修改页表后刷新 TLB，避免旧映射残留。  
  - **实现**：执行 `sfence.vma zero, zero`。  
  - **示例**：`map_pages(...); flush_tlb();`
- `MAKE_SATP(pagetable)` / `SATP_SV39`（`kernel/riscv.h:208-211`）  
  - **用途**：根据物理页表根地址构造 `satp` 需要的值。  
  - **返回**：`SATP_SV39 | (pagetable >> 12)`。  
  - **示例**：`write_csr(satp, MAKE_SATP(g_kernel_pagetable));`
- `CAUSE_*` / `SSTATUS_*` / `SIP_*`（`kernel/riscv.h:148-188`）  
  - **用途**：`CAUSE_USER_ECALL`, `CAUSE_MTIMER_S_TRAP` 等常量用于解析 `scause`；`SSTATUS_SPP` 帮助确认陷入前所处特权级；`SIP_SSIP` 可用于屏蔽软件中断。  
  - **示例**：`if (read_csr(scause) == CAUSE_USER_ECALL) handle_syscall(...);`
- 页表宏（`kernel/riscv.h:193-236`）  
  - `PGSIZE`/`PGSHIFT`：定义页大小/偏移位数；用于 `addr & (PGSIZE-1)` 计算页内偏移。  
  - `MAXVA`：超过该值的 VA 被视为非法，通常配合 `if (va >= MAXVA) panic(...)`。  
  - `PX(level, va)` 与 `PXSHIFT(level)`、`PXMASK`：提取 SV39 三层页号，level=2→0 依次对应 VPN[2:0]。  
  - `PTE_V/R/W/X/U/G/A/D`：PTE 权限位。  
  - `PA2PTE(pa)` / `PTE2PA(pte)` / `PTE_FLAGS(pte)`：在 PTE 与物理地址之间转换。  
  - **示例**：  
    ```c
    pte_t *pte = pt + PX(1, va);
    if (!(*pte & PTE_V)) *pte = PA2PTE(new_page) | PTE_V;
    uint64 pa = PTE2PA(*pte) | (va & (PGSIZE-1));
    ```

## 2. 物理内存与虚拟内存

- `pmm_init()` / `alloc_page()` / `free_page()`（`kernel/pmm.h:4-9`）  
  - **pmm_init**：启动早期调用，建立可分配物理页池。  
  - **alloc_page**：返回一页物理内存首地址（`void*`），保证 4KB 对齐；若内存耗尽返回 `NULL`。  
  - **free_page(pa)`**：将 `alloc_page` 返回的地址重新入队。  
  - **示例**：  
    ```c
    void *page = alloc_page();
    if (!page) panic("out of memory");
    memset(page, 0, PGSIZE);
    // ...使用...
    free_page(page);
    ```
- 地址布局常量（`kernel/memlayout.h:5-19`）  
  - `DRAM_BASE`/`KERN_BASE`：物理/虚拟 DRAM 起点（此处相同），保证内核在高地址运行。  
  - `USER_STACK_TOP`：用户栈虚拟顶部（0x7ffff000）；`USER_FREE_ADDRESS_START`：实验 2.2 中简易堆的初始虚拟地址。  
  - **用法**：`proc->trapframe->regs.sp = USER_STACK_TOP;`
- VMM 工具集（`kernel/vmm.h:6-33`, `kernel/vmm.c:14-199`）  
  - `map_pages(pagetable, va, size, pa, perm)`  
    - **参数**：`va/pa` 起始地址，`size` 字节数（会自动对齐），`perm` 为 PTE 权限位（例如 `prot_to_type(PROT_READ|PROT_WRITE, user)`）。  
    - **返回**：成功返回 0，失败（申请 PTE 失败或重复映射）会 `panic` 或返回 -1。  
    - **注意**：传入的 `pagetable` 必须是根目录；`va/pa` 不需要页对齐，函数内部会 `ROUNDDOWN`。  
  - `prot_to_type(prot, user)`  
    - **参数**：`prot` 为 `PROT_*` 位或组合，`user` 非零表示需要 `PTE_U`。  
    - **返回**：对应的 PTE 位组合，会自动添加 `PTE_A`/`PTE_D`。  
    - **示例**：`int perm = prot_to_type(PROT_READ|PROT_WRITE, 1);`
  - `page_walk(pagetable, va, alloc)`  
    - **参数**：`alloc` = 1 时允许为缺失的中间层（level 2/1）分配新页；=0 时遇到无效 PTE 返回 `NULL`。  
    - **返回**：指向 level-0 PTE 的指针，可用于读取或设置映射。  
    - **示例**：  
      ```c
      pte_t *pte = page_walk(pt, va, 1);
      if (!pte) return -1;
      *pte = PA2PTE(pa) | perm | PTE_V;
      ```
  - `lookup_pa(pagetable, va)`  
    - **作用**：只读查询虚拟地址对应的物理页，若 PTE 不存在或仅执行权限则返回 0。  
    - **适用**：在调试 `kern_vm_init()` 时验证映射是否成功。  
  - `kern_vm_init()` / `kern_vm_map()`  
    - **`kern_vm_init` 步骤**：分配页目录→清零→映射 `[KERN_BASE,_etext)`（RX）→映射 `[_etext,PHYS_TOP)`（RW）→保存至 `g_kernel_pagetable`。  
    - **`kern_vm_map`**：`map_pages` 的内核包装，失败时立即 `panic("kern_vm_map")`。  
  - `user_vm_map()` / `user_vm_unmap()` / `user_va_to_pa()`  
    - `user_vm_map`：与 `kern_vm_map` 类似，用于用户空间。返回非零表示错误。  
    - `user_vm_unmap`：实验后续要求实现虚拟区间解除映射并可选释放物理页。  
    - `user_va_to_pa`：输入用户页表根和虚拟地址，若映射存在，返回对应的物理地址（加上页内偏移）；否则返回 `NULL`。syscall 需要用它把用户缓冲区转成内核可访问的 PA。  
    - **示例**：`char *pa = user_va_to_pa(current->pagetable, buf); if (!pa) return -1;`

## 3. 进程、上下文与调度钩子

- `trapframe`（`kernel/process.h:6-20`）  
  - **字段**：  
    - `regs`：保存通用寄存器（按 `riscv_regs` 顺序）。  
    - `kernel_sp`：陷入时使用的内核栈指针。  
    - `kernel_trap`：指向 `smode_trap_handler`，`switch_to` 会将其写入 `stvec`。  
    - `epc`：存放用户返回地址。  
    - `kernel_satp`：S→U 切换后恢复内核页表使用。  
  - **初始化**：`memset(trapframe, 0, sizeof(trapframe)); trapframe->regs.sp = USER_STACK_TOP;`
- `process`（`kernel/process.h:22-29`）  
  - `kstack`：trap 时使用的内核栈顶部（`alloc_page()+PGSIZE`）。  
  - `pagetable`：用户页表根。  
  - `trapframe`：指向上述结构。  
- `switch_to(process *proc)`（`kernel/process.h:31`，实现于 `kernel/process.c`）  
  - **流程**：设置 `SSTATUS_SPP` 为 User、`SSTATUS_SPIE` 允许返回后启用中断，配置 `stvec = proc->trapframe->kernel_trap`，设置 `sscratch = proc->trapframe`，填好 `satp = MAKE_SATP(proc->pagetable)`，最后通过 `sret` 跳入用户态。  
  - **调用**：内核加载/调度完成后执行 `switch_to(&user_app);`。  
- `current` / `g_ufree_page`（`kernel/process.h:35-39`）  
  - `current`：全局指针，指向正在运行的 `process`；`smode_trap_handler` 中要 `assert(current)` 后才能访问 `current->trapframe`。  
  - `g_ufree_page`：Lab2_2 的简单堆实现使用的游标，表示下一块可用用户虚拟地址。  
- `smode_trap_handler()`（`kernel/strap.c`, 声明于 `kernel/strap.h:4`）  
  - **入口**：`mentry.S` 在 S 态发生 trap 时保存寄存器并跳转至此。  
  - **核心逻辑**：  
    1. 检查 `SSTATUS_SPP`，确保来自 U 态；保存 `sepc`。  
    2. 读取 `scause`：  
       - `CAUSE_USER_ECALL` → `handle_syscall(current->trapframe)`，并在 `handle_syscall` 中 `tf->epc += 4; tf->regs.a0 = do_syscall(...);`。  
       - `CAUSE_MTIMER_S_TRAP` → `handle_mtimer_trap()`，增加 tick 并清除 `SIP_SSIP`。  
       - `CAUSE_ILLEGAL_INSTRUCTION` → 输出错误并 `shutdown(-1)`。  
       - 其他 → `panic`。  
    3. 调用 `switch_to(current);` 恢复用户上下文。  
  - **扩展**：若新增外部中断或页故障处理，在 `smode_trap_handler` 中添加新的 `cause` case。

## 4. ELF 与用户程序加载

- `load_bincode_from_host_elf(process *p)`（`kernel/elf.h:58-62`，实现见 `kernel/elf.c`）  
  - **输入**：`process` 结构体，其中 `trapframe`/`pagetable` 已分配。  
  - **行为**：读取 `obj/app_*.elf`，校验 `ELF_MAGIC`，对每个 `ELF_PROG_LOAD` 段：分配/复制段内容到对应物理内存，再将段虚拟地址映射到 `p->pagetable`；最后将 `proc->trapframe->epc` 设置为 ELF entry。  
  - **注意**：需要保证段大小按页对齐，`load_bincode_from_host_elf` 内部会调用 `user_vm_map`。  
- `elf_init(elf_ctx *ctx, void *info)` / `elf_load(elf_ctx *ctx)`（`kernel/elf.h:58-60`）  
  - **用途**：若需要自定义加载器（如多个程序或动态库），可使用 `elf_ctx` 组合调用；`info` 通常是文件句柄或内存缓冲区。  
  - **返回值**：`elf_status`，如 `EL_OK`、`EL_NOTELF`、`EL_ENOMEM`。错误时应 `panic` 或向上返回。  
- `load_user_program(process *proc)`（`kernel/kernel.c:38-74`）示例  
  - 分配并清零 `trapframe`/`pagetable`。  
  - 分配用户栈页面并设置 `proc->trapframe->regs.sp = USER_STACK_TOP`。  
  - 调用 `load_bincode_from_host_elf(proc)`。  
  - 通过 `user_vm_map` 映射用户栈、trapframe、trap 向量等特殊页面。  
  - 供参考：编写自定义加载流程时，可仿照此函数的顺序。

## 5. 系统调用与陷入

- Syscall 号（`kernel/syscall.h:7-15`）  
  - `SYS_user_base = 64`，保证与 Spike 自带 syscall 区分。  
  - 已有：`SYS_user_print`、`SYS_user_exit`、`SYS_user_allocate_page`、`SYS_user_free_page`。  
  - **新增流程**：在此定义常量 → `kernel/syscall.c` 中实现处理 → `user/user_lib.c` 添加用户态封装 → `user/user_lib.h` 暴露原型。
- `do_syscall(long a0..a7)`（`kernel/syscall.c:43-51`）  
  - **输入**：S 模式 trap 保存的 `a0..a7`。`a0` 是 syscall 号，其余为参数。  
  - **返回**：写回 `a0`，作为用户态函数返回值。  
  - **扩展**：新增 case 时务必返回成功/错误码，并在必要时使用 `user_va_to_pa` 校验指针。  
- `sys_user_print(const char *buf, size_t n)`（`kernel/syscall.c:18-27`）  
  - **流程**：  
    1. 使用 `user_va_to_pa(current->pagetable, buf)` 翻译用户缓冲区。  
    2. 调用 `sprint(pa)` 输出，返回 0。  
  - **要点**：`buf` 必须为用户虚拟地址，不可直接传给 `sprint`。  
- `sys_user_exit(uint64 code)`（`kernel/syscall.c:32-37`）  
  - **行为**：打印退出码后调用 `shutdown(code)`，终止实验。  
  - **扩展**：多进程实验中可改为清理资源并调度下一个进程。  
- 用户态封装（`user/user_lib.c:13-50`）  
  - `do_user_call(sysnum, a1..a7)`：内联汇编 `ecall`，将参数放入 `a0..a7`。  
  - `printu(const char *fmt, ...)`：堆栈上构造临时缓冲区→`SYS_user_print`。  
  - `exit(int code)`：直接调用 `SYS_user_exit`。  
  - **新增示例**：  
    ```c
    int user_allocate_page(size_t sz) {
      return do_user_call(SYS_user_allocate_page, sz, 0,0,0,0,0,0);
    }
    ```
- Trap 分派（`kernel/strap.c:15-77`）  
  - `handle_syscall(trapframe *tf)`：`tf->epc += 4`（跳过 `ecall`），`tf->regs.a0 = do_syscall(...)`。  
  - `handle_mtimer_trap()`：增加 `g_ticks`，使用 `write_csr(sip, read_csr(sip) & ~SIP_SSIP)` 清除软件中断。  
  - `smode_trap_handler()`：整合上述处理并最终 `switch_to(current)`。

## 6. Spike 接口与调试辅助

- `sprint(const char *fmt, ...)` / `putstring(const char *s)`（`spike_interface/spike_utils.h:9-40`）  
  - **用途**：通过 HTIF 将字符串打印到宿主机控制台。`sprint` 支持格式化，`putstring` 只输出原串。  
  - **示例**：`sprint("user frame 0x%lx\n", proc->trapframe);`
- `panic(const char *fmt, ...)` / `die()` / `assert(x)` / `kassert(x)`  
  - **行为**：打印错误并调用 `poweroff(-1)`。`assert` 打印表达式文本，`kassert` 以 `cond` 字符串为信息。  
  - **使用建议**：在必须终止实验的错误（如页表构建失败）时调用。  
- `shutdown(int code)` / `poweroff(uint16 code)`  
  - **用途**：结束 Spike 仿真。`shutdown` 包装 `poweroff` 并允许传递整数退出码。  
  - **示例**：`if (fatal) shutdown(-1);`
- `frontend_syscall(long n, uint64 a0..a6)`  
  - **用途**：直接调用 Spike 的前端服务（如读取主机文件）。默认实验无需使用，文件系统/设备实验会用到。  
- 调试 & 构建命令（`Makefile:115-151`）  
  - `make run`：编译后运行 `spike`。  
  - `make gdb`：启动 `spike --rbb-port=9824 -H kernel user`，随后 `openocd` + `riscv64-unknown-elf-gdb`，支持断点、寄存器查看。  
  - `make objdump`：生成 `obj/kernel_dump` / `obj/user_dump`，可用 `less` 浏览。  
  - `make cscope`：生成 `cscope.out` 方便代码导航。  
  - `make format`：运行 `format.py` 对 C/ASM 代码格式化。  
  - `make clean`：删除 `obj/`。

## 7. 通用工具库

- 类型别名（`util/types.h:4-22`）  
  - `uint8/16/32/64`, `int8/...`, `size_t`, `ssize_t`, `bool`, `TRUE/FALSE`, `NULL`。  
  - **用法**：在内核/用户代码中统一整数宽度：`uint64 pa = PTE2PA(*pte);`
- 字符串/内存函数（`util/string.h:6-14`）  
  - `memset`, `memcpy`, `memmove`, `strlen`, `strcmp`, `strcpy`, `safestrcpy`, `atol`。  
  - **示例**：`memcpy(dst, src, len);`、`if (strcmp(cmd, "run")==0) ...`。
- `snprintf` / `vsnprintf`（`util/snprintf.h/.c`）  
  - **用途**：生成格式化字符串到指定缓冲区。`printu` 中已示范：生成字符串后交给 syscall 打印。  
  - **示例**：  
    ```c
    char buf[64];
    snprintf(buf, sizeof(buf), "pa=0x%lx", pa);
    sprint("%s\n", buf);
    ```
- 常用宏（`util/functions.h:4-13`）  
  - `ROUNDUP(a,b)` / `ROUNDDOWN(a,b)`：四舍五入到 b 的倍数。  
  - `MAX` / `MIN`：返回较大/小值。  
  - `likely(x)` / `unlikely(x)`：GCC 的分支预测提示。  
  - `ARRAY_SIZE(x)`：统计数组元素个数。  
  - **示例**：`uint64 first = ROUNDDOWN(va, PGSIZE);`
- 汇编辅助（`util/load_store.S`）  
  - 提供 `load_uint8/16/32/64`、`store_uint8/16/32/64` 等函数，在需要按特定宽度访问非对齐地址或与用户态共享代码时可直接调用。  
  - **示例**：`extern uint64 load_uint64(uint64 *); val = load_uint64(addr);`

## 8. 构建与用户空间配套

- `Makefile` 目标（`Makefile:7-151`）  
  - `make`：默认构建内核与用户 ELF。若只想重建某个组件，直接 `make obj/riscv-pke` 亦可。  
  - `make run`：展示横幅 “HUST PKE” 后运行 `spike obj/riscv-pke obj/app_helloworld_no_lds`。  
  - `make gdb`：串联 `spike --rbb-port=9824 -H ...` + `openocd -f ./.spike.cfg` + `riscv64-unknown-elf-gdb -command=./.gdbinit`。可在 GDB 中使用 `target remote localhost:3333`（已写在 `.gdbinit`）调试。  
  - `make objdump`：对 kernel/user ELF 分别运行 `riscv64-unknown-elf-objdump -d`，输出至 `obj/kernel_dump`、`obj/user_dump`。  
  - `make cscope`: 生成 `cscope.out`、`cscope.files`，在终端 `cscope -d` 浏览。  
  - `make format`: 调用 `format.py` 遍历当前目录自动格式化。  
  - `make clean`: 删除整个 `obj/` 目录，清扫中间文件。
- 用户态应用与库  
  - 示例：`user/app_helloworld_no_lds.c`（Lab2 版本）与 `user/app_helloworld.c`（Lab1 版本）展示基本结构：`#include "user_lib.h"` → `main` 中调用 `printu` → `exit(0)`。  
  - `user/user_lib.c`：内含 `do_user_call`（封装 `ecall`），`printu`、`exit` 等接口；后续实验会添加 `malloc/free/yield` 等封装。扩展应用只需在此添加新函数并实现对应 syscall。  
  - `user/user_lib.h`：用户程序需要包含的声明。  
  - `user/user.lds`：用户态链接脚本（指定入口、段布局），必要时可调整以支持新段或特定内存布局。

---

借助以上工具，实验中无需重复搭建底层设施：直接引入相应头文件，即可获得 CSR 访问、页表管理、物理内存分配、Spike I/O、常用字符串/数学宏等能力，专注在实验要求的功能补全与策略实现上即可。
