# 1_2 Process Management and Anatomy

> **Khóa học**: Cloud DevOps Basic — OS Core · **Domain**: 1 Domain 1 - Operating System Core Fundamentals · **Roadmap gốc**: [os/README.md](../../README.md#module-2-process-anatomy--process-lifecycle)

---

## Module này dạy gì? (What & Why)

Module này phân tích toàn diện khái niệm tiến trình (Process)—thực thể động đại diện cho một chương trình đang thực thi—và giải phẫu cấu trúc không gian địa chỉ bộ nhớ ảo biệt lập gồm Text (chỉ đọc), Data, BSS (điền số 0), Heap (nở lên trên), Free Space, Guard Page và Stack (nở xuống dưới). Người học sẽ làm chủ mô hình 5 trạng thái vòng đời tiến trình (New, Ready, Running, Blocked, Terminated) cùng các cơ chế chuyển dịch trạng thái được điều phối bởi CPU Scheduler và ngắt phần cứng. Tiếp theo, module làm sáng tỏ khối điều khiển tiến trình (PCB / `struct task_struct`), cấu trúc dữ liệu tối quan trọng trong kernel quản lý định danh, ngữ cảnh thanh ghi, bảng phân trang bộ nhớ và bảng tệp tin mở. Cuối cùng, module đi sâu vào cơ chế sinh tồn qua bộ tứ `fork()`, `execve()`, `wait()`, `exit()` với tối ưu hóa Copy-on-Write (CoW), bản chất phân kỳ giữa tiến trình Zombie và Orphan cùng cơ chế nhận nuôi (Reparenting), và cơ chế chuyển đổi ngữ cảnh (Context Switching) với việc đo lường chi phí trực tiếp và gián tiếp (xả sạch TLB và ô nhiễm bộ nhớ đệm CPU).

---

## Lộ trình bài học (Lesson Path)

| Bài học | Mục tiêu cốt lõi | Checklist ID |
| :--- | :--- | :---: |
| [1_2_1 Process Concept and Memory Anatomy](./1_2_1%20Process%20Concept%20and%20Memory%20Anatomy.md) | Phân biệt Program vs Process, nắm vững cấu trúc không gian địa chỉ bộ nhớ ảo biệt lập (Text, Data, BSS, Heap, Stack, Guard Page) và khảo sát qua lệnh `size`, `/proc/[pid]/maps`. | [1_2_1](../../../CHECKLIST.md#domain-1-operating-system-core-fundamentals-45-items) |
| [1_2_2 Process States and Transitions](./1_2_2%20Process%20States%20and%20Transitions.md) | Làm chủ mô hình 5 trạng thái (New, Ready, Running, Blocked, Terminated), các sự kiện kích hoạt chuyển dịch và giải mã các mã trạng thái thực tế trên Linux (`R`, `S`, `D`, `Z`, `T`). | [1_2_2](../../../CHECKLIST.md#domain-1-operating-system-core-fundamentals-45-items) |
| [1_2_3 Process Control Block](./1_2_3%20Process%20Control%20Block.md) | Phân tích cấu trúc dữ liệu trung tâm PCB (`task_struct`), theo dõi PID, PPID, ngữ cảnh thanh ghi CPU (`RIP`, `RSP`), con trỏ bảng trang `mm_struct`/`CR3` và bảng File Descriptors mở. | [1_2_3](../../../CHECKLIST.md#domain-1-operating-system-core-fundamentals-45-items) |
| [1_2_4 Process Creation and Lifecycle fork exec wait exit](./1_2_4%20Process%20Creation%20and%20Lifecycle%20fork%20exec%20wait%20exit.md) | Nắm vững bộ tứ hệ thống Unix (`fork`, `execve`, `wait`, `exit`), triết lý tách rời fork/exec phục vụ I/O Redirection, và cơ chế tối ưu hóa bộ nhớ Copy-on-Write (CoW). | [1_2_4](../../../CHECKLIST.md#domain-1-operating-system-core-fundamentals-45-items) |
| [1_2_5 Zombie vs Orphan Processes](./1_2_5%20Zombie%20vs%20Orphan%20Processes.md) | Phân biệt Zombie (con chết trước cha chưa `wait`, rò rỉ khe PID) và Orphan (cha chết trước con, được `systemd` hoặc Subreaper nhận nuôi); vai trò của `tini` trong container. | [1_2_5](../../../CHECKLIST.md#domain-1-operating-system-core-fundamentals-45-items) |
| [1_2_6 Context Switching](./1_2_6%20Context%20Switching.md) | Thấu hiểu cơ chế luân chuyển CPU, phân biệt chuyển đổi tự nguyện (`cswch/s` I/O-bound) vs cưỡng bức (`nvcswch/s` CPU-bound), đo lường chi phí trực tiếp và gián tiếp (TLB/Cache Misses). | [1_2_6](../../../CHECKLIST.md#domain-1-operating-system-core-fundamentals-45-items) |

---

## Bản đồ khái niệm (Concept Map)

Sơ đồ dưới đây kết nối mạch lạc toàn bộ 6 bài học trong Module 1.2:

```mermaid
flowchart TD
    subgraph S1 ["1_2_1: Khái Niệm & Bộ Nhớ"]
        Prog["Program: Tệp nhị phân tĩnh trên đĩa"] -->|Kernel nạp vào RAM| Proc["Process: Thực thể động (a program in execution)"]
        Proc --> Space["Không gian địa chỉ ảo biệt lập<br/>Text(r-x) · Data(rw-p) · BSS · Heap(↑) · Stack(↓) · Guard Page"]
    end

    subgraph S3 ["1_2_3: Process Control Block"]
        Space --> PCB["Process Control Block (PCB / task_struct)<br/>• Định danh: PID, PPID, Credentials<br/>• Ngữ cảnh phần cứng: RIP, RSP, RBP<br/>• Con trỏ bộ nhớ: mm_struct / CR3<br/>• Bảng tệp mở: files_struct (FDs)"]
    end

    subgraph S2 ["1_2_2: Vòng Đời & Trạng Thái"]
        PCB --> StateModel["Mô hình 5 Trạng thái Tiến trình"]
        StateModel --> New["New: Khởi tạo PCB"]
        New --> Ready["Ready: Hàng đợi Run Queue"]
        Ready -->|Scheduler Dispatch| Running["Running: Thực thi trên CPU Core"]
        Running -->|Hết time-slice (Timer Interrupt)| Ready
        Running -->|I/O Request / Sleep| Blocked["Blocked: Chờ I/O / Sự kiện (State D, S)"]
        Blocked -->|I/O Done (Hardware Interrupt)| Ready
        Running -->|Hoàn thành / Bị hủy| Terminated["Terminated: Giải phóng RAM"]
    end

    subgraph S4 ["1_2_4: Bộ Tứ Vòng Đời & CoW"]
        Running -->|fork| ChildCreate["fork(): Nhân bản PCB, chia sẻ RAM qua Copy-on-Write (CoW)"]
        ChildCreate -->|execve| MemReplace["execve(): Ghi đè bộ nhớ bằng chương trình mới, giữ FDs"]
        MemReplace -->|exit| ChildExit["exit(): Kết thúc, giữ lại PCB tối thiểu (Exit Code)"]
        ChildExit -->|wait| Reaping["wait(): Cha thu hoạch exit code, giải phóng PID slot"]
    end

    subgraph S5 ["1_2_5: Zombie vs Orphan"]
        ChildExit -->|Cha không gọi wait| Zombie["ZOMBIE: Chiếm 1 slot PID (Lỗi cạn kiệt PID)<br/>Không thể kill bằng 'kill -9'"]
        Running -->|Cha chết trước con| Orphan["ORPHAN: Tiến trình mồ côi<br/>Kernel Reparenting sang systemd (PID 1) hoặc Subreaper<br/>Tự động wait() dọn sạch"]
    end

    subgraph S6 ["1_2_6: Chuyển Đổi Ngữ Cảnh"]
        Ready -.->|Context Switch| CSwitch["Chuyển đổi Ngữ cảnh (Context Switch)<br/>• Lưu thanh ghi tiến trình cũ vào PCB/kstack<br/>• Nạp thanh ghi & đổi bảng trang CR3 tiến trình mới<br/>• Chi phí trực tiếp: Lệnh CPU<br/>• Chi phí gián tiếp: Xả sạch TLB & Ô nhiễm CPU Cache"]
        Running -.->|Nhường CPU (cswch / nvcswch)| CSwitch
    end
```

---

## Ẩn dụ xuyên suốt (Module Analogy)

Các bài học trong module được kết nối sinh động thông qua chuỗi ẩn dụ đời sống thực tế:

1. **Bản thiết kế trên giấy vs Công trường đang thi công (1_2_1)**: Một chương trình trên đĩa chỉ là bản vẽ kiến trúc tĩnh trong ngăn kéo; khi khởi công (chạy thành tiến trình), công trường bừng sáng hoạt động: máy móc chạy theo bản vẽ (Text segment), vật liệu nhập sẵn (Data/BSS), bãi tập kết mở rộng dần (Heap - nở lên), và sổ nhật ký công trường lật trang ghi chép từng bước (Stack - nở xuống).
2. **Bệnh nhân trong phòng khám đa khoa (1_2_2)**: Bệnh nhân đăng ký hồ sơ (New), ngồi chờ gọi tên tại sảnh đợi (Ready), bước vào phòng bác sĩ khám bệnh (Running), tạm dừng để vào phòng chụp X-quang chờ kết quả (Blocked), chụp xong quay lại phòng đợi (Ready) chứ không được nhảy bổ vào phòng bác sĩ, và thanh toán viện phí xuất viện (Terminated).
3. **Hồ sơ bệnh án điện tử & Căn cước công dân (1_2_3)**: Toàn bộ thông tin một bệnh nhân được lưu giữ trong tập hồ sơ bệnh án duy nhất (PCB / `task_struct`): số CCCD (PID), mã số người bảo hộ (PPID), chẩn đoán hiện tại (Process State), ảnh chụp chỉ số sinh tồn dở dang lúc bác sĩ đổi ca (Saved Registers), sơ đồ phòng nội trú (con trỏ bảng trang `CR3`), và chùm chìa khóa tủ gửi đồ (bảng mô tả tệp mở).
4. **Nhân bản vô tính & Chuyển giao linh hồn (1_2_4)**: `fork()` nhân bản một người con giống hệt cha từ ngoại hình đến tư trang nhưng áp dụng phép thuật tiết kiệm (Copy-on-Write: dùng chung tài sản, khi ai cần sơn lại phòng riêng mới chia tách). Sau đó, `exec()` thực hiện nghi lễ chuyển giao linh hồn: xóa bỏ toàn bộ ký ức cũ và nạp một linh hồn mới vào thể xác đó, nhưng vẫn giữ nguyên chiếc áo khoác và chùm chìa khóa cửa (giữ nguyên PID và các file descriptor).
5. **Linh hồn vất vưởng vs Trẻ mồ côi được nhận nuôi (1_2_5)**: Con qua đời trước cha nhưng cha vô trách nhiệm không đến ký giấy báo tử (`wait()`), hồ sơ vẫn phải lưu trên giá sách của ủy ban và linh hồn con biến thành thây ma vất vưởng (Zombie - không thể dùng súng `kill -9` bắn chết kẻ đã chết). Ngược lại, cha mất trước con, đứa trẻ còn sống bơ vơ (Orphan) được Trại trẻ mồ côi quốc gia (`systemd` PID 1) nhận nuôi ngay lập tức (Reparenting), sau này khi đứa trẻ mất đi, trại trẻ tự động làm tang lễ chu đáo (`wait()`).
6. **Bàn làm việc của nhân viên bận rộn (1_2_6)**: Một nhân viên xử lý hồ sơ (CPU Core) đang làm dở hợp đồng A thì chuông điện thoại reo đòi xử lý hợp đồng B gấp. Nhân viên phải dọn dẹp giấy tờ A vào ngăn kéo, rút hồ sơ B ra trải lên bàn (Chi phí trực tiếp: lưu/nạp thanh ghi). Nhưng điều tốn thời gian hơn cả là nhân viên phải lục lọi lại trí nhớ xem mình đang làm dở đến đâu và não bộ phải khởi động lại ngữ cảnh từ đầu (Chi phí gián tiếp: xả sạch TLB và ô nhiễm bộ nhớ đệm CPU).

---

## Tự kiểm tra cuối module (Module Review)

<details>
<summary><b>Câu hỏi 1:</b> Tại sao trong không gian địa chỉ bộ nhớ ảo của tiến trình, phân đoạn Heap lại được thiết kế nở dần lên trên (grows upward) trong khi phân đoạn Stack lại nở dần xuống dưới (grows downward)?</summary>

**Đáp án:**
- Heap và Stack là hai phân đoạn có kích thước co giãn động liên tục trong suốt vòng đời tiến trình: Heap mở rộng theo yêu cầu cấp phát bộ nhớ runtime (`malloc`), còn Stack mở rộng theo độ sâu của các lời gọi hàm lồng nhau.
- Bằng cách đặt Heap ở vùng địa chỉ thấp nở lên trên và Stack ở vùng địa chỉ cao nở xuống dưới, hệ điều hành tận dụng tối đa một **Khoảng trống tự do duy nhất (Unallocated Free Space)** nằm ở giữa. Cả hai vùng có thể tự do mở rộng linh hoạt mà không cần phải định trước một tỷ lệ phân chia cứng nhắc, giúp tối ưu hóa không gian bộ nhớ ảo.
</details>

<details>
<summary><b>Câu hỏi 2:</b> Khi một tiến trình đang ở trạng thái Blocked (chờ đọc I/O từ đĩa cứng) và ổ đĩa đã hoàn tất việc nạp dữ liệu vào RAM, tại sao tiến trình không được chuyển thẳng sang trạng thái Running mà bắt buộc phải chuyển sang Ready?</summary>

**Đáp án:**
- Tại thời điểm ngắt phần cứng I/O hoàn tất phát sinh (Hardware Interrupt), CPU đang bận rộn thực thi một tiến trình khác. Hệ điều hành không thể tùy tiện ngắt ngang tiến trình hiện tại nếu tiến trình đó chưa hết định mức thời gian (time-slice) hoặc có độ ưu tiên cao hơn.
- Do đó, tiến trình vừa hoàn tất I/O chỉ được đưa vào **Hàng đợi sẵn sàng (Ready Queue)**. Nó phải chờ cho đến khi bộ lập lịch (CPU Scheduler) thực hiện việc đánh giá độ ưu tiên và lựa chọn điều phối nó lên CPU ở lượt tiếp theo.
</details>

<details>
<summary><b>Câu hỏi 3:</b> Cơ chế Copy-on-Write (CoW) trong lời gọi <code>fork()</code> của Linux hoạt động như thế nào và đem lại lợi ích đột phá gì khi kết hợp với lời gọi <code>execve()</code>?</summary>

**Đáp án:**
- **Cơ chế CoW**: Khi `fork()`, kernel không sao chép vật lý toàn bộ các trang RAM từ cha sang con mà chỉ sao chép bảng phân trang (page table). Cả cha và con cùng trỏ chung vào các trang RAM vật lý ở chế độ chỉ đọc (**read-only**). Chỉ khi một trong hai tiến trình thực hiện thao tác ghi dữ liệu vào một trang, MMU mới kích hoạt ngắt **Page Fault**, lúc đó kernel mới thực sự sao chép trang đó sang một khung RAM vật lý mới riêng biệt.
- **Lợi ích khi kết hợp với `execve()`**: Trong phần lớn trường hợp (đặc biệt là trong Unix Shell), tiến trình con sau khi `fork()` sẽ ngay lập tức gọi `execve()` để nạp chương trình mới và xóa sạch toàn bộ không gian bộ nhớ cũ. Nhờ CoW, hệ thống loại bỏ hoàn toàn chi phí sao chép hàng gigabyte dữ liệu vô ích từ tiến trình cha, giúp lệnh `fork()` thực thi trong vài phần triệu giây.
</details>

<details>
<summary><b>Câu hỏi 4:</b> Tại sao một tiến trình Zombie không còn chiếm giữ RAM hay CPU nhưng lại có thể làm sập hệ thống máy chủ, và tại sao lệnh <code>kill -9 &lt;PID&gt;</code> hoàn toàn vô tác dụng đối với Zombie?</summary>

**Đáp án:**
- **Hiểm họa**: Mặc dù tài nguyên RAM và CPU đã được thu hồi, Zombie vẫn giữ một bản ghi tối thiểu trong bảng quản lý tiến trình của Kernel để lưu mã thoát cho cha đọc. Bản ghi này chiếm giữ một mã định danh **`PID`**. Nếu tiến trình cha không gọi `wait()`, các Zombie sẽ tích tụ cho đến khi cạn kiệt toàn bộ kho PID khả dụng của hệ thống (`/proc/sys/kernel/pid_max`), khiến máy chủ không thể `fork()` thêm bất kỳ tiến trình nào mới và bị tê liệt.
- **Vô tác dụng của `kill -9`**: Lệnh `kill -9` gửi tín hiệu `SIGKILL` yêu cầu kết thúc tiến trình. Một Zombie vốn dĩ đã là một tiến trình đã chết (đã gọi `exit()`), không còn không gian bộ nhớ hay luồng lệnh để tiếp nhận tín hiệu. Cách duy nhất để dọn dẹp Zombie là buộc tiến trình cha gọi `wait()` (qua tín hiệu `SIGCHLD`) hoặc tiêu diệt chính tiến trình cha để con trở thành mồ côi và được `systemd` (PID 1) nhận nuôi rồi tự động dọn sạch.
</details>

<details>
<summary><b>Câu hỏi 5:</b> Trong quá trình chuyển đổi ngữ cảnh (Context Switching), tại sao chi phí gián tiếp (Indirect Cost) lại đắt đỏ và ảnh hưởng nghiêm trọng đến hiệu năng hơn nhiều so với chi phí trực tiếp (Direct Cost)?</summary>

**Đáp án:**
- **Chi phí trực tiếp (Direct Cost)**: Chỉ tiêu tốn vài trăm nano-giây để CPU thực thi vài chục câu lệnh hợp ngữ nhằm lưu thanh ghi của tiến trình cũ vào PCB/ngăn xếp kernel và nạp thanh ghi của tiến trình mới.
- **Chi phí gián tiếp (Indirect Cost)**:
  1. Khi đổi bảng phân trang bộ nhớ (nạp lại thanh ghi `CR3`), CPU buộc phải **xả sạch bộ nhớ đệm dịch địa chỉ (TLB Invalidation)**, dẫn đến bão TLB Misses trong các câu lệnh tiếp theo.
  2. Dữ liệu của tiến trình cũ trong các tầng bộ nhớ đệm vi xử lý (CPU Cache L1/L2/L3) bị mất hiệu lực và thay thế bởi dữ liệu tiến trình mới (**Cold Cache / Cache Pollution**).
  - Chi phí này buộc CPU phải liên tục dừng chờ (CPU Stall) để kéo dữ liệu từ bộ nhớ chính RAM (chậm hơn cache từ 100 đến 200 lần) trong hàng nghìn chu kỳ xung nhịp tiếp theo cho đến khi tập dữ liệu làm việc của tiến trình mới được nạp ấm trở lại vào cache.
</details>

---

## 📚 Nguồn chính (Key References)

- [OSTEP Chapter 4: Processes](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf) - Giáo trình chuẩn mực *Operating Systems: Three Easy Pieces* (Remzi H. Arpaci-Dusseau & Andrea C. Arpaci-Dusseau), phân tích định nghĩa bản chất tiến trình, mô hình 3 trạng thái Running - Ready - Blocked, và cấu trúc PCB.
- [OSTEP Chapter 5: Process API](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-api.pdf) - Giáo trình OSTEP phân tích chuyên sâu về bộ tứ API tiến trình Unix (`fork`, `exec`, `wait`, `exit`), cơ chế I/O redirection và triết lý phân tách fork/exec.
- [OSTEP Chapter 6: Mechanism: Limited Direct Execution](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf) - Giáo trình OSTEP giải thích cơ chế chuyển đổi ngữ cảnh tầng thấp (`switch`), bẫy ngắt bộ định thời (Timer Interrupt) và chuyển đổi ngăn xếp hạt nhân.
- [OSTEP Chapter 13: Address Spaces](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-intro.pdf) - Giáo trình OSTEP phân tích chi tiết cấu trúc không gian địa chỉ bộ nhớ ảo của tiến trình, cơ chế phát triển của Heap (grows up) và Stack (grows down).
- [OSTEP Chapter 19: Paging: Faster Translations (TLBs)](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf) - Giáo trình OSTEP trình bày chi tiết về chi phí xả sạch TLB khi chuyển đổi không gian địa chỉ và cơ chế gắn nhãn phần cứng ASID/PCID.
- [Linux Manual Pages: size(1)](https://man7.org/linux/man-pages/man1/size.1.html) - Hướng dẫn chính thức về tiện ích `size` phân tích kích thước các phân đoạn `text`, `data`, `bss` của tệp nhị phân ELF.
- [Linux Manual Pages: ps(1)](https://man7.org/linux/man-pages/man1/ps.1.html) - Hướng dẫn chính thức về tiện ích dòng lệnh `ps`, bảng mã hóa các trạng thái tiến trình tiêu chuẩn (`R`, `S`, `D`, `Z`, `T`).
- [Linux Manual Pages: pidstat(1)](https://man7.org/linux/man-pages/man1/pidstat.1.html) - Hướng dẫn chính thức về tiện ích `pidstat`, định nghĩa chi tiết hai cơ chế chuyển đổi ngữ cảnh tự nguyện (`cswch/s`) và cưỡng bức (`nvcswch/s`).
- [Linux Manual Pages: fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html) - Hướng dẫn chính thức về lời gọi hệ thống `fork`, đặc tả kỹ thuật cơ chế Copy-on-Write (CoW).
- [Linux Manual Pages: execve(2)](https://man7.org/linux/man-pages/man2/execve.2.html) - Tài liệu kỹ thuật chính thức về giao diện nạp chương trình thực thi và ghi đè không gian bộ nhớ tiến trình.
- [Linux Manual Pages: wait(2)](https://man7.org/linux/man-pages/man2/wait.2.html) - Hướng dẫn chuẩn POSIX về các lời gọi hệ thống `wait`, `waitpid`, định nghĩa trạng thái Zombie và cơ chế nhận nuôi con mồ côi (reparenting).
- [Linux Manual Pages: PR_SET_CHILD_SUBREAPER(2const)](https://man7.org/linux/man-pages/man2/PR_SET_CHILD_SUBREAPER.2const.html) - Đặc tả kỹ thuật về thao tác `PR_SET_CHILD_SUBREAPER` trong lời gọi hệ thống `prctl`.
- [Linux Manual Pages: proc_pid_maps(5)](https://man7.org/linux/man-pages/man5/proc_pid_maps.5.html) - Đặc tả kỹ thuật tệp ảo `/proc/[pid]/maps`, mô tả các vùng bộ nhớ ảo (VMAs) và cờ quyền hạn truy cập của tiến trình.
- [Linux Manual Pages: proc_pid_status(5)](https://man7.org/linux/man-pages/man5/proc_pid_status.5.html) - Đặc tả kỹ thuật tệp ảo `/proc/[pid]/status`, mô tả các trường trạng thái PCB (`Pid`, `PPid`, `State`, `FDSize`, `VmSize`, `VmRSS`, `Threads`).
- [Linux Manual Pages: proc_pid_fd(5)](https://man7.org/linux/man-pages/man5/proc_pid_fd.5.html) - Hướng dẫn chính thức về thư mục ảo `/proc/[pid]/fd/` biểu diễn bảng mô tả tệp mở (File Descriptors) của tiến trình.
- [Linux Manual Pages: vmstat(8)](https://man7.org/linux/man-pages/man8/vmstat.8.html) - Hướng dẫn chính thức về tiện ích `vmstat`, đặc tả trường `cs` theo dõi tần suất chuyển đổi ngữ cảnh toàn hệ thống mỗi giây.
- [Linux Kernel Documentation: active_mm](https://docs.kernel.org/mm/active_mm.html) - Tài liệu kỹ thuật chính thức của Linux Kernel giải thích vai trò của các trường quản lý bộ nhớ `task_struct->mm` và `active_mm`.
