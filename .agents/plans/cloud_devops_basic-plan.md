# Curriculum Build Plan: `cloud_devops_basic`

> Owner: `teacher-orchestrator`. This file is the **manifest** for building lesson folders and files for the 4 courses in `cloud_devops_basic/` (`os`, `network`, `linux`, `windows`).
> It is a plan, not curriculum. Nothing in it is a verified technical fact. Every fact must still pass gates G1 to G5 (`.agents/rules/05-verification-gates.md`).

---

## 1. Target Layout

The checklist stays at `cloud_devops_basic/CHECKLIST.md` and remains the single tracker. Domain folders live **inside the course folder that owns them**. Each module of a course README becomes one Tier-2 topic folder.

```text
cloud_devops_basic/
├── CHECKLIST.md                                   # single tracker, 5 domains, 154 items
├── .evidence/research/TASK-CDB-<module>-R<n>.md   # Claim Ledgers (written by researchers)
├── .evidence/WRITE-CDB-<id>.md                    # evidence index per lesson (written by writers)
├── os/
│   ├── README.md                                  # existing roadmap (edit links only)
│   └── 1 Domain 1 - Operating System Core Fundamentals/
│       └── 1_1 OS Architecture and Hardware Privilege Modes/
│           ├── README.md                          # module overview (written last)
│           └── 1_1_1 The Role of an Operating System.md
├── network/
│   ├── 2 Domain 2 - Computer Networking Core Fundamentals/
│   └── 5 Domain 5 - Wire-Level Network Inspection and Diagnostics/
├── linux/
│   └── 3 Domain 3 - Linux Systems Realization and Diagnostics/
└── windows/
    └── 4 Domain 4 - Windows Systems Realization and Diagnostics/
```

Naming rules: English names. Use ` - ` and never `:`. Use `and` instead of `&`. No `/`, backticks, `?`, or `'` in names (so `/proc` becomes `proc Filesystem`).

Totals: **154 lesson files + 33 module `README.md` files**.

---

## 2. Phase 0: Repair the Checklist (One Run, Before Any Lesson)

The checker currently fails on `cloud_devops_basic` with 8 errors. Every writer's G4 check fails until these are fixed. Run Phase 0 as a single writing task (`WRITE-CDB-P0`) with partial `edit_file` edits only.

| # | File | Change |
| :--- | :--- | :--- |
| P0-1 | `CHECKLIST.md` | Domain 1 heading and tracker row: `35` becomes `45`. Progress becomes `0 / 45`. |
| P0-2 | `CHECKLIST.md` | Domain 2 heading `35` and tracker row `39` both become `33`. Progress becomes `0 / 33`. |
| P0-3 | `CHECKLIST.md` | TOTAL `109` becomes `113` in both places. |
| P0-4 | `CHECKLIST.md` | Domain 3: add `#### 3.1` to `#### 3.5` topic headings and renumber item IDs per the mapping in section 4.3. Do not change item text other than the ID. |
| P0-5 | `CHECKLIST.md` | Domain 4: add `#### 4.1` to `#### 4.4` topic headings and renumber item IDs per section 4.4. |
| P0-6 | `CHECKLIST.md` | Domain 5: add a `#### 5.1 Wire-Level Inspection and Diagnostic Toolkit` heading. IDs are unchanged. |
| P0-7 | `os/README.md` line 4 | Anchor `...-35-items` becomes `#domain-1-operating-system-core-fundamentals-45-items`. |
| P0-8 | `network/README.md` line 4 | Anchor `...-39-items` becomes `#domain-2-computer-networking-core-fundamentals-33-items`. |
| P0-9 | `README.md` line 15 | Change `109 core competencies` to `113`. |

Exit condition: `python3 .agents/skills/curriculum-verify/scripts/check_curriculum.py cloud_devops_basic --online` returns exit `0`. The existing `generic homepage citation` warnings may remain.
Phase 0 changes no technical claims, so it needs only G4. G1 to G3 and G5 do not apply.

---

## 3. Per-Module Run (Repeat 33 Times)

One run = one Tier-2 module folder. IDs: research `TASK-CDB-<lesson id>` (one per lesson, claim prefix `R<P>`; older ledgers use `TASK-CDB-<module>-R1/R2`), writing `WRITE-CDB-<lesson id>`, module overview `WRITE-CDB-<module>-README`.

1. **Scope**: Read the module's section in the course README, the checklist items listed in section 4, and the "Claims to Verify" in section 5.
2. **Research (parallel, one `researcher` per lesson)**: each contract covers one lesson completely: its mechanisms, definitions, state machines and data structures, **and** its numbers, header sizes, ports, defaults, commands and flags, code examples from Tier-1 pages (for example the `EXAMPLES` section of man7 pages), version and platform currency, and the section 5 claims that belong to that lesson. 12–25 claims (hard maximum 25), one `LEDGER_FILE` per lesson, `ID_PREFIX: R<P>`. Acceptance criteria are phrased as claims to prove.
3. **G1 + G2**: Each researcher's summary shows a clean `evidence.py quotes` line (no `MISSING`). Every lesson has enough `VERIFIED` claims to fill sections 1, 3, and 4 of the template. Remove or re-research any claim marked `CONFLICT` or `NOT_FOUND`.
4. **Write (parallel)**: one **fresh** `writer` per lesson (`WRITE-` task), with ledger paths and claim IDs (not pasted ledgers). It creates the folders with `mkdir -p`, plans the size, writes the file once, tags every fact with `<!-- ev: R<P>.<m> -->` as it writes, stays under the 24 KB hard limit (no soft target), saves an evidence index to `.evidence/`, and runs `check_curriculum.py --only` and `evidence.py lesson` at most 3 times (offline, fix batch, `--online` once before reporting).
5. **G5 Verify**: Send `verifier` (`Model: "pro"`) at most 3 lesson paths per call. On `FAIL` or `INCOMPLETE`, the writer fixes and a new verifier runs in re-check mode (failed claims and changed lines only).
6. **Module overview**: After every lesson in the module has a PASS, one writer writes `<module folder>/README.md` (template in section 6). Then run G4 and G5 on it.
7. **Close**: The writer marks the module's items `[x]` in `CHECKLIST.md` and updates the counters. Then the writer adds one link line under the module's heading in the course README (template in section 6), and runs the checker once on the whole course (`--online`, no `--only`). The teacher teaches the module to the learner and states the verification results.

Recommended order (follows the checklist's 4-phase path):
`1_1 → 1_8` → `2_1 → 2_8` → `3_1 → 3_9` → `4_1 → 4_7` → `5_1`.

---

## 4. Module Manifest

### 4.1 Course `os/` — `1 Domain 1 - Operating System Core Fundamentals` (45 lessons)

| Module folder | What the module teaches (for the learner) | Lesson files (`.md`) |
| :--- | :--- | :--- |
| `1_1 OS Architecture and Hardware Privilege Modes` | Why an OS exists, how the CPU separates user and kernel privilege, how a program asks the kernel for help, and how kernels are structured. | `1_1_1 The Role of an Operating System` · `1_1_2 Dual-Mode Operation User Mode vs Kernel Mode` · `1_1_3 System Calls and Software Traps` · `1_1_4 Kernel Architectures Monolithic Microkernel Hybrid` |
| `1_2 Process Management and Anatomy` | What a running program looks like in memory, the states it moves through, what the kernel stores about it, and how processes are born and die. | `1_2_1 Process Concept and Memory Anatomy` · `1_2_2 Process States and Transitions` · `1_2_3 Process Control Block` · `1_2_4 Process Creation and Lifecycle fork exec wait exit` · `1_2_5 Zombie vs Orphan Processes` · `1_2_6 Context Switching` |
| `1_3 Thread Management and Multithreading` | What threads share and keep private, concurrency vs parallelism, and how user threads map onto kernel threads. | `1_3_1 Process vs Thread` · `1_3_2 Concurrency vs Parallelism` · `1_3_3 Multithreading Models` |
| `1_4 Process Synchronization and Concurrency` | Why shared data breaks under concurrency, and the hardware and software tools that make it safe. | `1_4_1 Race Conditions and Critical Sections` · `1_4_2 The Three Critical Section Requirements` · `1_4_3 Hardware Synchronization Primitives` · `1_4_4 Mutex Locks` · `1_4_5 Spinlocks vs Sleep Locks` · `1_4_6 Semaphores` · `1_4_7 Condition Variables` · `1_4_8 Classic Synchronization Problems` |
| `1_5 Deadlock Deep Dive` | When processes block each other forever, the four conditions behind it, and the ways to prevent, avoid, detect, or ignore it. | `1_5_1 What is Deadlock` · `1_5_2 The Four Coffman Conditions` · `1_5_3 Resource Allocation Graph` · `1_5_4 Deadlock Prevention` · `1_5_5 Deadlock Avoidance and Bankers Algorithm` · `1_5_6 Deadlock Detection and Recovery` · `1_5_7 Deadlock vs Livelock vs Starvation` |
| `1_6 CPU Scheduling` | How the kernel decides who runs next, and the trade-offs of the classic algorithms. | `1_6_1 CPU Burst vs IO Burst Cycle` · `1_6_2 Preemptive vs Non-Preemptive Scheduling` · `1_6_3 First-Come First-Served Scheduling` · `1_6_4 Shortest Job First and SRTF` · `1_6_5 Priority Scheduling and Aging` · `1_6_6 Round Robin Scheduling` · `1_6_7 Multilevel Feedback Queue` |
| `1_7 Memory Management and Virtual Memory` | How virtual addresses become physical ones, paging and the TLB, page faults, page replacement, and thrashing. | `1_7_1 Logical vs Physical Address Space and the MMU` · `1_7_2 Contiguous Allocation and Fragmentation` · `1_7_3 Paging Architecture` · `1_7_4 Translation Lookaside Buffer` · `1_7_5 Virtual Memory and Demand Paging` · `1_7_6 Page Replacement Algorithms` · `1_7_7 Thrashing and the Working Set Model` |
| `1_8 Storage and File Systems` | How files are described (inodes), laid out on disk, and how disk requests are ordered. | `1_8_1 File Systems and Inode Architecture` · `1_8_2 File Allocation Methods` · `1_8_3 Disk Scheduling Algorithms` |

### 4.2 Course `network/` — `2 Domain 2 - Computer Networking Core Fundamentals` (43) and `5 Domain 5 - Wire-Level Network Inspection and Diagnostics` (12)

| Module folder | What the module teaches | Lesson files (`.md`) |
| :--- | :--- | :--- |
| `2_1 Network Fundamentals and Models` | How data crosses a network, where collisions and broadcasts stop, and the OSI and TCP/IP layer models. | `2_1_1 How Networks Transfer Data` · `2_1_2 Collision Domains vs Broadcast Domains` · `2_1_3 The OSI 7-Layer Model` · `2_1_4 The TCP-IP Layer Model` · `2_1_5 PDUs Encapsulation and Decapsulation` |
| `2_2 Data Link Layer and Physical Addressing` | MAC addresses, the Ethernet frame, how switches learn where hosts are, and VLANs. | `2_2_1 MAC Address Structure` · `2_2_2 Ethernet Frame Structure` · `2_2_3 Switches vs Hubs and MAC Learning` · `2_2_4 VLANs and IEEE 802.1Q Tagging` |
| `2_3 Address Resolution Protocol` | How an IP address is turned into a MAC address on a LAN, and why that is attackable. | `2_3_1 The Need for ARP` · `2_3_2 ARP Message Flow` · `2_3_3 ARP Cache` · `2_3_4 Gratuitous ARP and ARP Spoofing` |
| `2_4 Network Layer and IP Addressing` | The IPv4 header, subnetting math, private ranges, the gateway decision, ICMP, IPv6, routing tables, NAT, and MTU. | `2_4_1 IPv4 Header Anatomy` · `2_4_2 IPv4 Address Classes vs CIDR` · `2_4_3 Subnet Masking and IP Arithmetic` · `2_4_4 Public vs Private IP Ranges` · `2_4_5 Default Gateway and Routing Basics` · `2_4_6 ICMP` · `2_4_7 IPv6 Architecture` · `2_4_8 Routing Tables and Longest Prefix Match` · `2_4_9 Network Address Translation NAT and PAT` · `2_4_10 MTU Fragmentation and Path MTU Discovery` |
| `2_5 Transport Layer TCP and UDP` | Ports and sockets, UDP vs TCP, the TCP connection lifecycle, and flow and congestion control. | `2_5_1 Ports and Sockets` · `2_5_2 User Datagram Protocol` · `2_5_3 TCP Header` · `2_5_4 TCP Three-Way Handshake` · `2_5_5 TCP Connection Teardown` · `2_5_6 TCP Flow Control` · `2_5_7 TCP Congestion Control` |
| `2_6 Intermediaries and Proxy Architecture` | What an HTTP intermediary is, forward vs reverse proxies, `CONNECT` tunnels, forwarding headers, and L4 vs L7 load balancing. | `2_6_1 What is an Intermediary` · `2_6_2 Forward Proxy` · `2_6_3 Reverse Proxy` · `2_6_4 Forward vs Reverse Proxy Comparison` · `2_6_5 Layer 4 vs Layer 7 Load Balancing` |
| `2_7 Core Application Layer Protocols` | DNS resolution, DHCP address leasing, HTTP/HTTPS basics, TLS certificates, SSH, and client-side name resolution. | `2_7_1 Domain Name System` · `2_7_2 Dynamic Host Configuration Protocol` · `2_7_3 HTTP and HTTPS Basics` · `2_7_4 TLS 1.3 Handshake and Certificate Chain of Trust` · `2_7_5 SSH Protocol and Port Forwarding` · `2_7_6 Host Name Resolution and DNS Caching` |
| `2_8 Network Security Boundaries Firewalls and VPN Tunnels` *(network README Module 9)* | How packet filters decide what passes, and how tunnels and VPNs carry traffic between networks. | `2_8_1 Stateless vs Stateful Packet Filtering` · `2_8_2 VPNs and IP Tunneling` |
| `5_1 Wire-Level Inspection and Diagnostic Toolkit` *(in `5 Domain 5 - ...`; this is network README Module 8)* | The command-line tools for seeing every layer in practice, and how to combine them to troubleshoot. | `5_1_1 Network Interface Inspection` · `5_1_2 Address Resolution Inspection` · `5_1_3 Socket and Connection Inspection` · `5_1_4 Reachability and Latency Testing with ping` · `5_1_5 Route Path Tracing` · `5_1_6 DNS Resolution Inspection` · `5_1_7 Raw Port Probing with Netcat` · `5_1_8 Packet Capture with tcpdump` · `5_1_9 Packet Analysis with Wireshark` · `5_1_10 Wire-Level Troubleshooting Scenarios` · `5_1_11 HTTP and TLS Inspection with curl and openssl` · `5_1_12 Firewall and NAT State Inspection` |

### 4.3 Course `linux/` — `3 Domain 3 - Linux Systems Realization and Diagnostics` (32 lessons, expanded 14-11-2026)

The 15 original items were renumbered when 17 DevOps administration items were added (old ID in brackets, `new` = new item). Modules 1, 2, 7, 8 are new; module order follows the linux README.

| Module folder | What the module teaches | Lesson files (old checklist ID in brackets) |
| :--- | :--- | :--- |
| `3_1 Linux Command-Line Foundations Filesystem Hierarchy and Packages` | Where things live on a Linux system, how the shell connects programs, how to search and transform text, and how software is installed. | `3_1_1 Filesystem Hierarchy Standard and Everything is a File` [new] · `3_1_2 Shell Fundamentals Pipes Redirection and Exit Codes` [new] · `3_1_3 Text Search and Processing with find grep sed awk` [new] · `3_1_4 Software Package Management with apt and dnf` [new] |
| `3_2 Users Permissions and Remote Access` | Who a process runs as, how file permissions decide access, how to grant root safely, and how to run an SSH server securely. | `3_2_1 Users Groups and Linux Identity` [new] · `3_2_2 File Permissions Ownership and umask` [new] · `3_2_3 Special Permission Bits and sudo` [new] · `3_2_4 Remote Access with OpenSSH Server Administration` [new] |
| `3_3 Process and Thread Implementation in the Linux Kernel` | How Linux represents processes and threads, how `clone()` creates them, what `ps` states mean, and how the scheduler picks tasks. | `3_3_1 Linux Process Representation task_struct` [3_1_1] · `3_3_2 Linux Thread Implementation clone and NPTL` [3_1_2] · `3_3_3 Linux Process States in Practice` [3_1_3] · `3_3_4 Linux CPU Scheduler CFS and EEVDF` [3_1_4] |
| `3_4 Linux Signals and Inter-Process Communication` | How the kernel notifies processes, and the ways processes exchange data. | `3_4_1 Linux Signals in Detail` [3_2_1] · `3_4_2 Inter-Process Communication on Linux` [3_2_2] |
| `3_5 Linux Virtual Memory and the proc Subsystem` | Reading memory state from `/proc`, the page cache, swap and swappiness, overcommit, and the OOM killer. | `3_5_1 Virtual Memory in the proc Filesystem` [3_3_1] · `3_5_2 Swap Swappiness and the OOM Killer` [new] |
| `3_6 Virtual Filesystem and Storage Internals` | VFS, the Ext4 on-disk layout, inodes and links, file descriptors and limits, and attaching disks with `mount` and `fstab`. | `3_6_1 Virtual Filesystem and Ext4 Layout` [3_4_1] · `3_6_2 Linux File Descriptors and Limits` [3_4_2] · `3_6_3 Block Devices Mounting and fstab` [new] |
| `3_7 Boot Process systemd and Logging` | How a Linux machine gets from firmware to a running service, how systemd manages services, where logs go, and how jobs are scheduled. | `3_7_1 Linux Boot Process from Firmware to PID 1` [new] · `3_7_2 systemd Units and systemctl` [new] · `3_7_3 Logging with journald and journalctl` [new] · `3_7_4 Scheduled Jobs with cron and systemd Timers` [new] |
| `3_8 Resource Control with cgroups and Namespaces` | How the kernel limits what a group of processes may use (cgroups v2) and what it may see (namespaces): the primitives under containers. | `3_8_1 Control Groups v2` [new] · `3_8_2 Linux Namespaces` [new] |
| `3_9 Practical Linux Diagnostics and Performance Toolkit` | The day-to-day tools for finding CPU, memory, disk, syscall, and kernel problems, and how to combine them in real incidents. | `3_9_1 Core Linux Process Commands` [3_5_1] · `3_9_2 Memory and Swap Inspection CLI` [3_5_2] · `3_9_3 Disk and Storage Inspection CLI` [3_5_3] · `3_9_4 System Call Tracing with strace` [3_5_4] · `3_9_5 Open File and Socket Inspection with lsof` [3_5_5] · `3_9_6 Kernel Ring Buffer with dmesg` [3_5_6] · `3_9_7 Linux Troubleshooting Scenarios` [new] |

Overlap rules: the SSH protocol, port forwarding, firewalls and network commands belong to Domains 2 and 5 (`2_7_5`, `2_8`, `5_1`). `3_2_4` teaches only `sshd` administration and links to `2_7_5`. `3_9_7` may use `ss` but links to `5_1_3` for its details.

### 4.4 Course `windows/` — `4 Domain 4 - Windows Systems Realization and Diagnostics` (22 lessons, expanded 14-11-2026)

The 10 original items were renumbered when 12 DevOps administration items were added (old ID in brackets, `new` = new item). Modules 2, 5, 6 are new.

| Module folder | What the module teaches | Lesson files (old checklist ID in brackets) |
| :--- | :--- | :--- |
| `4_1 Windows NT Kernel Architecture and Execution Modes` | The layers of Windows NT, how a Win32 call reaches the kernel, and how Windows boots up to the logon screen. | `4_1_1 Windows NT Kernel Architecture` [4_1_1] (also covers the README's syscall dispatch path) · `4_1_2 Windows Boot Process` [new] |
| `4_2 PowerShell and Windows Command-Line Fundamentals` | The admin shell for Windows: cmdlets, the object pipeline, providers, scripts, execution policy, and remote sessions. | `4_2_1 PowerShell Fundamentals Cmdlets and the Object Pipeline` [new] · `4_2_2 PowerShell Scripts Execution Policy and Remoting` [new] |
| `4_3 Windows Process and Thread Architecture` | The kernel and user-mode structures behind processes and threads, how they are created, handles, and how threads are scheduled. | `4_3_1 Windows Process and Thread Structures` [4_2_1] · `4_3_2 Windows Process Creation` [4_2_2] · `4_3_3 Windows Handles and the Object Manager` [4_2_3] · `4_3_4 Windows Thread Scheduling and Priorities` [new] |
| `4_4 Windows Memory Management and Storage Internals` | Working set vs commit charge, kernel memory pools, the NTFS MFT and ACLs, and bringing disks and volumes online. | `4_4_1 Windows Memory Management Terminology` [4_3_1] · `4_4_2 NTFS Architecture` [4_3_2] · `4_4_3 Disks Partitions and Volumes` [new] |
| `4_5 Windows Security Identity and Access Control` | How Windows identifies accounts (SIDs) and decides access (tokens, privileges, integrity levels, UAC). | `4_5_1 Users Groups and Security Identifiers` [new] · `4_5_2 Access Tokens Privileges Integrity Levels and UAC` [new] |
| `4_6 Windows Services Registry and Scheduled Tasks` | How background services are managed, where configuration lives, and how jobs are scheduled. | `4_6_1 Windows Services and the Service Control Manager` [new] · `4_6_2 The Windows Registry` [new] · `4_6_3 Task Scheduler` [new] |
| `4_7 Practical Windows Diagnostics and Performance Toolkit` | Event logs, Task Manager, Resource Monitor, PerfMon, and the Sysinternals tools, combined in real troubleshooting scenarios. | `4_7_1 Windows Event Logs and Event Viewer` [new] · `4_7_2 Task Manager and Resource Monitor` [4_4_1] · `4_7_3 Performance Monitor` [4_4_2] · `4_7_4 Sysinternals Process Explorer` [4_4_3] · `4_7_5 Sysinternals Process Monitor` [4_4_4] · `4_7_6 Windows Troubleshooting Scenarios` [new] |

Overlap rules: `ipconfig`, `netstat`, Windows Defender Firewall and other network commands belong to Domain 5 (`5_1`). Active Directory is out of scope.

---

## 5. Claims to Verify (Hand to the Lesson's Researcher, Do Not Teach as Written)

These are statements in the course READMEs (or areas where they are easy to get wrong) that look wrong, overstated, or version-dependent. They are **leads, not findings**. Research each one. Teach only what the sources support.

| Module | README statement | Why it needs checking |
| :--- | :--- | :--- |
| 1_1 | Mode bit "stored in the PSW, 1 = user, 0 = kernel" | This is a textbook abstraction. On x86-64, privilege is tracked as the CPL (ring level), not a single PSW bit. Check the processor manual. |
| 1_6 | MLFQ is "the gold standard for modern operating systems" | Mainline Linux does not use MLFQ. See 3_3. |
| 3_3 | CFS with `vruntime` in red-black trees is the Linux scheduler | The default fair scheduler changed in recent kernels (EEVDF). Check `docs.kernel.org` scheduler pages and state the kernel version. |
| 3_3 | `D` state "cannot be killed by any signal, including SIGKILL" | The absolute wording may be too broad (killable sleep variants exist). Check the kernel docs and man pages. |
| 3_4 | `SIGCHLD` is 17 | Signal numbers vary by architecture. Check `signal(7)`. |
| 3_4 | Unix domain sockets give "2x throughput of loopback TCP" | Unsourced number. Remove unless a Tier-1 source states it. |
| 3_5 | `vm.swappiness` range 0–200, default 60 | Check the kernel `sysctl/vm` docs and the version the range applies to. |
| 2_5 | Slow start `cwnd` "starts at 10 MSS" | The initial-window value depends on the RFC (RFC 5681 vs RFC 6928) and the implementation. State which. |
| 2_5 | `TIME_WAIT` = 2×MSL, "MSL typically 60–120s" | Check RFC 9293 for the MSL value, and the Linux value separately. |
| 2_2 | Preamble and SFD described as part of the frame | Check how IEEE 802.3 and the sources split packet vs frame. Keep the frame size math consistent. |
| 4_1 | `kernel32.dll` calls `NtReadFile` in `ntdll.dll`, described as "undocumented" | Modern Windows routes through `KernelBase.dll`. Some `Nt`/`Zw` routines are documented. Check Microsoft Learn. |
| 4_4 | MFT record is 1024 bytes, resident data "~700 bytes" | The values depend on volume and sector configuration. Check Microsoft Learn. |
| 1_3 | Go as the example of many-to-many threading | A language runtime, not an OS. Use it only as a `[Community Reference]` or the official Go docs. |
| 3_1 | `dnf` commands and output | Fedora 41 and later ship DNF5, whose commands and output differ from DNF4 (RHEL 9). State the distro and `dnf --version` for every example. |
| 3_2 | A single default `umask` value | The default comes from `/etc/login.defs`, `pam_umask`, shell profiles, or systemd `UMask=`, and differs by distro and context. Do not teach one value as universal. |
| 3_6 | Ext4 inode "typically 256 bytes" | Set by `mke2fs` and `/etc/mke2fs.conf` (`inode_size`). Check the kernel ext4 docs and `mke2fs(8)`. |
| 3_6 | `ulimit -n` is a "per-shell limit" | `RLIMIT_NOFILE` is a per-process soft/hard limit inherited by children (`getrlimit(2)`); services get it from systemd `LimitNOFILE=`. |
| 3_7 | cron behaviour (environment, `/etc/cron.d` format) | Implementations differ (cronie, Debian cron). State which one, or teach from `crontab(5)` of the named implementation. |
| 3_8 | cgroups v2 is in use | Hosts can run cgroup v1 or hybrid mode. Show how to check (`stat -fc %T /sys/fs/cgroup`) and state the version. |
| 3_9 | `iostat` `%util` read as "disk saturation percentage" | For devices that serve requests in parallel (SSD, NVMe, RAID), `%util` near 100% does not mean saturation. Check `iostat(1)`. |
| 4_1 | Boot chain after the kernel (`smss.exe` → session processes → `services.exe`, `lsass.exe`, `winlogon.exe`) | Prove each step on Microsoft Learn. *Windows Internals* is cite-only. |
| 4_2 | PowerShell examples without an edition | Some cmdlets exist only in Windows PowerShell 5.1 (for example `Get-EventLog`). State 5.1 or 7.x for every example. |
| 4_3 | Priority boosts and quantum lengths | Check Microsoft Learn "Priority Boosts" and "Scheduling Priorities". Do not state quantum lengths without a source. |
| 4_7 | Process Monitor captures "with nanosecond timestamps" | Check the resolution documented on the Sysinternals Process Monitor page. Remove the claim if it is not stated there. |

---

## 6. File Templates

### 6.1 Lesson file: 7 sections (from `writer.md`, adapted to this course)

```markdown
# <N_M_P> <Lesson Title>

> **Khóa học**: Cloud DevOps Basic — <OS Core | Networking Core | Linux Realization | Windows Realization | Wire-Level Diagnostics>
> **Phân nhóm**: <Domain folder name> › <Module folder name>
> **Chủ đề**: <one line>
> **Trạng thái**: Verified (<WRITE id>, <date>) | Draft
> **Checklist đối chiếu**: [<N_M_P>](<relative path>/CHECKLIST.md#<domain anchor>)

## 1. Khái Niệm Cốt Lõi & Bản Chất Kỹ Thuật (Core Concepts & Technical Deep Dive)
## 2. Ví Dụ Đời Sống Thực Tế Dễ Hiểu (Intuitive Real-World Analogies)
## 3. Kiến Trúc, Luồng Hoạt Động & Hình Ảnh Trực Quan (Architecture, Diagrams & Visual Media)
## 4. Thực Hành (Hands-on)   <- variant per course, see 6.2
## 5. Cạm Bẫy Thực Tế & Thực Tiễn Sản Xuất (Production Gotchas & Best Practices)
## 6. Câu Hỏi Củng Cố Kiến Thức (Active Recall Quiz)
## 7. 📚 Nguồn Tài Liệu Chính Thống (Tier-1 Official References)
```

Note: `AGENTS.md` section 5 describes a 5-section, Azure-CLI-focused lesson without Gotchas or Quiz. The squad's writer template has 7 sections. This plan uses the **7-section** writer template because the course is not Azure.

### 6.2 Section 4 variants

| Course | Section 4 contents |
| :--- | :--- |
| `os` | Observe the concept on Linux (`/proc`, `ps`, `strace`), a minimal C/POSIX program (prefer the man7 `EXAMPLES` code), and for scheduling, deadlock, paging, and disk modules **one worked exercise with full working** (Gantt chart, Banker's matrices, page-reference string, head movement). |
| `network` | Linux commands (`ip`, `ss`, `dig`, `curl -v`, `curl -x`, `openssl s_client`, `ssh`, `nft`, `conntrack`, `tcpdump`), Windows equivalents where the checklist names them, subnet calculations with full working, and an annotated capture or output. |
| `linux` | Commands with annotated real output, `/proc` reads, and C snippets where relevant. State the distro family and version when a command or path differs (Debian/Ubuntu vs RHEL/Fedora). Commands that change system state (users, `sudoers`, `sshd_config`, `fstab`, partitions, cgroup limits) carry a `> ⚠️ Chỉ chạy trên VM thử nghiệm (lab VM only)` note. |
| `windows` | PowerShell (state the Windows version **and** the edition: Windows PowerShell 5.1 or PowerShell 7.x), built-in tools, and Sysinternals step-by-step. Mark commands that need an elevated prompt. Commands that change system state (registry, services, disks, execution policy, accounts) carry a `> ⚠️ Chỉ chạy trên VM thử nghiệm (lab VM only)` note. |

**Code policy**: The squad cannot compile or execute code. Code taken verbatim or minimally adapted from a Tier-1 example must cite that page. Any other code needs a `> ⚠️ Chưa chạy thử (not executed by the squad)` note above it. Command output shown as an example must say it is illustrative.

### 6.3 Module overview `README.md`

```markdown
# <N_M> <Module Title>

> **Khóa học**: ... · **Domain**: ... · **Roadmap gốc**: [<course> README](<relative>/README.md#<module anchor>)

## Module này dạy gì? (What & Why)        <- 3-5 sentences, no new facts beyond the lessons
## Lộ trình bài học (Lesson Path)          <- ordered table: lesson link | one-line goal | checklist ID
## Bản đồ khái niệm (Concept Map)          <- one Mermaid diagram linking the lessons
## Ẩn dụ xuyên suốt (Module Analogy)       <- one analogy tying the lessons together
## Tự kiểm tra cuối module (Module Review) <- 3-5 recall questions with <details> answers
## 📚 Nguồn chính (Key References)         <- union of the lessons' Tier-1 links
```

### 6.4 Link line added to the course README (partial edit, under the module heading)

```markdown
> 📂 **Bài học chi tiết**: [<N_M> <Module Title>](./<Domain folder>/<Module folder>/README.md)
```

Use angle-bracket link syntax `](<path with spaces>)` or `%20` encoding so the checker resolves paths with spaces.

---

## 7. Source Policy for This Course

| Area | Tier-1 sources (open the page) |
| :--- | :--- |
| Networking | `datatracker.ietf.org` / `www.rfc-editor.org` RFCs (791, 792, 826, 768, 9293, 5681, 1918, 4632, 4291/8200, 1034/1035, 2131, 9110, 9112, 8446, 7239, 5227), IEEE Registration Authority pages for OUI, MDN for HTTP and proxies, `nginx.org/en/docs` for reverse proxy configuration, `www.tcpdump.org` man pages, `www.wireshark.org/docs`. Added for the expanded Domain 2 and 5: RFCs 1191, 8201, 3022, 4787, 1812, 2328, 4271, 4861, 4862, 9846, 5280, 4251–4254, 9112, 9113, 9114, 9000, 4301, 2784, 7348; man7 `resolv.conf(5)`, `hosts(5)`, `nsswitch.conf(5)`, `ip-route(8)`, `iptables(8)`; `man.openbsd.org` (OpenSSH `ssh`); `curl.se/docs`; `docs.openssl.org`; `wiki.nftables.org`, `www.netfilter.org`, `conntrack-tools.netfilter.org`; `www.wireguard.com/papers`; `learn.microsoft.com` (Windows Firewall, NetSecurity PowerShell). **TLS 1.3 is RFC 9846 (July 2026), which obsoletes RFC 8446: teach from RFC 9846.** IEEE 802.1Q is not freely openable, so it is cite-only; prove VLAN claims from openable sources (for example `ip-link(8)`, `docs.kernel.org`). |
| Linux | `docs.kernel.org`, `man7.org/linux/man-pages`, `pubs.opengroup.org` (POSIX), kernel source on `git.kernel.org` or `github.com/torvalds/linux` (Tier-2, for `task_struct`). Added for the expanded Domain 3: `www.freedesktop.org/software/systemd/man` (systemd, `systemctl`, `journalctl`, timers), `refspecs.linuxfoundation.org` (FHS 3.0), `www.gnu.org/software` manuals (Bash, grep, sed, gawk, coreutils), `man.openbsd.org` (`sshd_config`, `ssh-keygen`), `www.sudo.ws/docs` (sudoers), `manpages.debian.org` (apt), `dnf5.readthedocs.io` / `dnf.readthedocs.io` (dnf). |
| Windows | `learn.microsoft.com` (windows-hardware/drivers, win32 procthread / memory / sysinfo / secauthz, windows-server storage NTFS, sysinternals, PowerShell). Added for the expanded Domain 4: `learn.microsoft.com/powershell` (about_* topics and module references, including Storage, ScheduledTasks, Microsoft.PowerShell.Diagnostics), `learn.microsoft.com/windows-server/administration/windows-commands` (`sc`, `reg`, `schtasks`, `wevtutil`, `diskpart`, `bcdedit`), `learn.microsoft.com/troubleshoot/windows-client` (boot), `learn.microsoft.com/windows/security` (UAC), win32 `services`, `taskschd`, `wes` (Event Log). |
| CPU hardware | Intel 64 and IA-32 Architectures Software Developer's Manual, AMD64 Architecture Programmer's Manual |
| Classical OS theory | **Proposed, needs learner approval**: *Operating Systems: Three Easy Pieces* (Arpaci-Dusseau, free chapters at `pages.cs.wisc.edu/~remzi/OSTEP/`) as a Tier-1-equivalent openable textbook, plus Dijkstra's EWD archive where it can be opened. Silberschatz, Tanenbaum, and Kurose stay **cite-only**. A claim sourced only from them stays `UNVERIFIED` and must be labelled in the file. |

Wikimedia images in the current READMEs are **not** Tier-1. Use them only if a researcher fetched them, and caption them as illustrations.

---

## 8. Out of Scope for These Runs

- Correcting technical claims in the existing course READMEs. Only add link lines and fix anchors (Phase 0). A README audit is a separate run.
- Labs, Docker, cloud services. The course states "no Cloud, Kubernetes, or Container abstraction layers".
- Git and version control. The learner manages them.

---

## 9. Definition of Done and Metrics

A Definition of Done (DoD) item is a **gate**: every item must hold, or the unit is not done. A metric is a **measurement**: it is reported every run but never blocks on its own. `teacher-orchestrator` checks the DoD by reading the files and reports. A verifier `PASS` is necessary but **not sufficient**.

### 9.1 Phase 0 DoD
- [ ] The checker exits `0` on `cloud_devops_basic`.
- [ ] The domain item counts are 45 / 33 / 15 / 10 / 10, the total is 113, and the tracker, headings, and progress values agree.
- [ ] Domain 3 and Domain 4 IDs match the mapping in sections 4.3 and 4.4 exactly.
- [ ] The learner's decision on the section 7 Classical OS theory source is recorded in the run report.

### 9.2 Lesson DoD (each of the 154 lesson files)
**Structure**
- [ ] The file exists at the exact path and name from sections 1 and 4.
- [ ] The metadata header is complete, and the checklist link resolves.
- [ ] All 7 sections from template 6.1 are present, in order, and none is empty.

**Content minimum**
- [ ] Every sub-point in the checklist item's text is explained in section 1, or listed as out of scope with a reason.
- [ ] At least 1 analogy (section 2) and at least 1 Mermaid diagram (section 3).
- [ ] Section 4 has at least 1 command, code sample, or worked exercise, following the course variant in 6.2. The code-policy labels are applied.
- [ ] Section 6 has 2 to 3 scenario questions, with answers in `<details>`.
- [ ] Section 7 has at least 2 links to specific Tier-1 pages. No `generic homepage citation` warning is reported for this file.

**Evidence and verification**
- [ ] The ledger is saved under `cloud_devops_basic/.evidence/research/`, and the evidence index at `cloud_devops_basic/.evidence/WRITE-CDB-<id>.md`.
- [ ] `evidence.py lesson <file> --ledger <ledger files>` exits `0` (size budget, tags resolve to VERIFIED rows). Lessons written before 16-11-2026 are exempt from tags and size.
- [ ] The checker exits `0`.
- [ ] The verifier returns `PASS` on the **final** version of the file. Any edit after a PASS requires a new verifier run.
- [ ] **0** `FAIL` claims.
- [ ] **0** `UNVERIFIED` claims in the classes "Numbers and limits" and "Commands and flags".
- [ ] `UNVERIFIED` claims make up **≤ 10%** of the file's claims, and each is labelled inline as unverified. (Tunable threshold; the learner may change it.)
- [ ] The verifier's coverage-gap list contains no sub-point of the checklist item.
- [ ] Every section 5 claim that belongs to this lesson is resolved: taught as the source states it, or removed. The resolution is recorded in the run report.

### 9.3 Module DoD (each of the 33 modules)
- [ ] Every lesson in the module meets 9.2.
- [ ] The module `README.md` exists, follows template 6.3, links to every lesson, adds no new technical fact, and has a verifier `PASS`.
- [ ] The module's items are marked `[x]` in `CHECKLIST.md`, and the counters are correct (the checker exits `0`).
- [ ] The link line from template 6.4 is in the course README under the module's heading.
- [ ] The teacher delivered the lesson to the learner and posted the final report with metrics.

### 9.4 Initiative DoD (whole course)
- [ ] All 33 modules meet 9.3: 154 lesson files and 33 module READMEs.
- [ ] `CHECKLIST.md` shows `154 / 154` and `100%`.
- [ ] `check_curriculum.py cloud_devops_basic --online` exits `0`.
- [ ] All 24 claims in section 5 are resolved and listed with their sources in a final summary.

### 9.5 Run Metrics (reported every run, non-blocking)

| Metric | Definition | Starting target |
| :--- | :--- | :--- |
| Lesson progress | Lessons meeting 9.2 / lessons planned (module and course-wide) | Module: 100% at close |
| First-pass PASS rate | Lessons that pass the verifier on the first try / lessons verified | ≥ 70% |
| Verify loops | Average verifier runs per lesson until PASS | ≤ 2 |
| Research re-dispatches | Research tasks sent back at G1 or G2 | Report only |
| Claim counts | Total / PASS / FAIL found / UNVERIFIED per lesson | FAIL found → 0 after fixes |
| UNVERIFIED ratio | UNVERIFIED claims / total claims, per lesson and per module | ≤ 10% |
| Flagged-claim resolution | Section 5 claims resolved / 24 | 24 / 24 by the end |
| Checker result | Exit code, errors, warnings | Exit 0, 0 errors |

If a metric misses its target for 2 modules in a row, the teacher raises it with the learner. For example, a low first-pass rate means research or writing quality needs attention.
