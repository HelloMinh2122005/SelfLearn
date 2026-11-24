# Review: 1_3_3 Multithreading Models

### Câu Hỏi 1: Sự khác biệt cốt lõi giữa User-Level Threads (ULT) và Kernel-Level Threads (KLT) là gì?

<details>
<summary>Đáp án</summary>

- **User-Level Threads (ULT - Luồng cấp người dùng)**: Được tạo, quản lý và điều phối hoàn toàn trong **User Space (Ring 3)** bởi một thư viện luồng hoặc runtime của ngôn ngữ lập trình. Nhân hệ điều hành (Kernel) hoàn toàn không nhận biết sự tồn tại của từng ULT riêng lẻ.
- **Kernel-Level Threads (KLT - Luồng cấp hạt nhân)**: Được hỗ trợ, quản lý và lập lịch trực tiếp bởi nhân hệ điều hành trong **Kernel Space (Ring 0)**. Mỗi KLT là một thực thể độc lập được bộ lập lịch CPU của hệ điều hành (*OS Scheduler*) phân bổ thời gian thực thi trên các lõi phần cứng.
</details>

### Câu Hỏi 2: Mô hình Many-to-One (M:1 - Green Threads) hoạt động như thế nào và tại sao chi phí chuyển ngữ cảnh lại rất nhẹ?

<details>
<summary>Đáp án</summary>

- **Cơ chế ánh xạ**: Nhiều luồng cấp người dùng ($M$ User Threads) được ánh xạ lên **duy nhất một luồng cấp hạt nhân** ($1$ Kernel Thread). Toàn bộ việc tạo, hủy, lưu con trỏ lệnh PC, thanh ghi và hoán đổi ngữ cảnh do một thư viện ở không gian người dùng (*User-Space Thread Library*, ví dụ GNU Portable Threads hay Green Threads trong Java 1.1) thực hiện.
- **Tại sao chuyển ngữ cảnh siêu nhẹ**: Khi hoán đổi giữa hai User Threads, thư viện chỉ cần lưu và nạp lại thanh ghi ngay trong bộ nhớ người dùng (thông qua các cơ chế như `setjmp`/`longjmp` hoặc tráo đổi con trỏ ngăn xếp fiber), **hoàn toàn không cần thực hiện System Call bẫy vào Kernel (Ring 0)**.
</details>

### Câu Hỏi 3: Hai hạn chế chí mạng của mô hình Many-to-One là gì?

<details>
<summary>Đáp án</summary>

1. **Hiệu ứng nghẽn toàn bộ tiến trình do lời gọi chặn (Blocking System Call Problem)**: Vì Kernel chỉ nhìn thấy 1 KLT duy nhất, nếu bất kỳ ULT nào thực hiện một System Call chờ đợi (blocking I/O như `read()` từ tệp/mạng) hoặc gặp lỗi thiếu trang bộ nhớ (*Page Fault*), Kernel sẽ chuyển toàn bộ KLT đó sang trạng thái Chờ (*Waiting/Blocked*). Kết quả là **tất cả các ULT còn lại trong tiến trình đều bị đóng băng theo**.
2. **Không tận dụng được phần cứng đa lõi (No Multicore Parallelism)**: Vì Kernel chỉ phân bổ thời gian CPU cho 1 KLT duy nhất, toàn bộ tiến trình chỉ chạy được trên **đúng 1 lõi CPU vật lý tại một thời điểm**, bất kể máy chủ có nhiều lõi CPU.
</details>

### Câu Hỏi 4: Mô hình One-to-One (1:1) hoạt động ra sao và có những ưu điểm vượt trội nào?

<details>
<summary>Đáp án</summary>

- **Cơ chế hoạt động**: Mỗi ULT được ánh xạ trực tiếp và gắn liền với **đúng một KLT độc lập**. Đây là mô hình chuẩn mực trên các hệ điều hành hiện đại như Linux (NPTL), Microsoft Windows (Win32 Threads) và macOS/iOS. Khi ứng dụng gọi `pthread_create(3)` (Linux) hoặc `CreateThread()` (Windows), Kernel sẽ tạo một thực thể điều phối độc lập (`struct task_struct` với cờ `CLONE_THREAD` trên Linux, hoặc `ETHREAD` trên Windows) để OS Kernel Scheduler trực tiếp lập lịch.
- **Ưu điểm vượt trội**:
  1. **Khả năng song song đa lõi thực thụ (True Multicore Parallelism)**: Các luồng trong cùng một ứng dụng có thể chạy đồng thời trên nhiều lõi CPU vật lý khác nhau.
  2. **Cách ly hoàn toàn lời gọi chặn (Blocking Call Isolation)**: Nếu một luồng thực hiện System Call blocking, Kernel chỉ đưa riêng KLT đó sang trạng thái Blocked; các luồng khác trong tiến trình vẫn tiếp tục chạy bình thường trên các lõi CPU khác.
</details>

### Câu Hỏi 5: Những chi phí đánh đổi (overhead và giới hạn) của mô hình One-to-One là gì?

<details>
<summary>Đáp án</summary>

1. **Chi phí chuyển ngữ cảnh (Context Switch Overhead) cao**: Mỗi lần hoán đổi luồng đòi hỏi CPU chuyển đặc quyền từ User Mode (Ring 3) sang Kernel Mode (Ring 0) và ngược lại, tiêu tốn hàng nghìn chu kỳ CPU và làm gián đoạn/phá vỡ bộ nhớ đệm lệnh và dữ liệu của CPU.
2. **Tiêu tốn bộ nhớ Kernel và User Stack**: Mỗi luồng 1:1 cần một vùng `kstack` riêng trong Kernel (8–16 KB) và một vùng Stack ảo mặc định trong User Space (thường là **8 MB** trên Linux theo `ulimit -s`). Do đó, một máy chủ thông thường khó duy trì quá vài nghìn native OS threads đồng thời mà không cạn kiệt bộ nhớ hoặc quá tải bộ lập lịch.
</details>

### Câu Hỏi 6: Trên Linux, thư viện NPTL (Native POSIX Thread Library) đã cải tiến những gì so với LinuxThreads trước đây?

<details>
<summary>Đáp án</summary>

- **Hạn chế của `LinuxThreads` (Linux nhân 2.4 trở về trước)**: Sử dụng một luồng quản lý trung gian (*manager thread*) để tạo/hủy luồng và gặp nhiều sai lệch so với chuẩn POSIX (ví dụ mỗi luồng có một PID riêng biệt, gây sai sót khi nhận tín hiệu).
- **Cải tiến của `NPTL` (từ Linux 2.6)**:
  1. Tận dụng các cờ mở rộng của System Call `clone(2)` như `CLONE_THREAD` để đưa các luồng vào chung một Thread Group (dùng chung TGID/PID).
  2. Tích hợp cơ chế khóa nhanh ở không gian người dùng **`futex(2)` (Fast Userspace Mutex)**, cho phép các thao tác khóa/mở khóa khi không có tranh chấp (*uncontended*) thực hiện hoàn toàn ở User Space mà không cần bẫy vào Kernel.
</details>

### Câu Hỏi 7: Mô hình Many-to-Many (M:N / Two-Level Model) hoạt động theo nguyên lý nào?

<details>
<summary>Đáp án</summary>

- **Nguyên lý ghép kênh (Multiplexing)**: Ghép kênh một số lượng lớn $M$ luồng cấp người dùng lên một số lượng nhỏ hơn hoặc bằng $N$ luồng cấp hạt nhân ($M \ge N$), trong đó $N$ thường xấp xỉ bằng số lõi CPU vật lý.
- **Vai trò của Runtime Scheduler**: Một bộ lập lịch trung gian ở không gian người dùng (*Runtime Scheduler*) điều phối hàng chục nghìn đến hàng triệu luồng nhẹ ($M$) luân phiên thực thi trên $N$ luồng hạt nhân. Khi một luồng người dùng hoàn tất hoặc chuyển sang chờ I/O bất đồng bộ, Runtime Scheduler gỡ nó khỏi KLT và nạp ngay một luồng người dùng khác vào thực thi, giúp chi phí chuyển ngữ cảnh rất nhẹ và tận dụng tối đa CPU đa lõi.
</details>

### Câu Hỏi 8: Cơ chế Scheduler Activations và Upcalls giải quyết vấn đề gì trong mô hình M:N cấp hệ điều hành, và tại sao triển khai M:N cấp OS dần bị loại bỏ?

<details>
<summary>Đáp án</summary>

- **Vấn đề cần giải quyết**: Trong mô hình M:N thuần túy ở cấp hệ điều hành, User-Space Scheduler cần biết khi nào một KLT bị block bởi I/O hoặc Page Fault để không bị mất năng lực thực thi song song.
- **Cơ chế Scheduler Activations & Upcalls**: Theo nghiên cứu của Anderson et al., Kernel sẽ gửi một tín hiệu thông báo ngược (**Upcall**) từ Kernel Space lên User Space mỗi khi một KLT bị chặn, giúp thư viện người dùng kịp thời khởi tạo một KLT thay thế để duy trì số lượng luồng tính toán song song.
- **Lý do dần bị loại bỏ ở cấp OS**: Độ phức tạp quá lớn trong việc đồng bộ trạng thái giữa Kernel Space và User Space khiến các triển khai M:N cấp hệ điều hành (như trên Solaris hay NetBSD) dần bị loại bỏ trong thực tế, nhường chỗ cho mô hình 1:1 đơn giản và ổn định hơn.
</details>

### Câu Hỏi 9: Trong mô hình $G, M, P$ của Go Runtime, các thành phần `G`, `M`, `P` đại diện cho gì và Linux Kernel có nhận biết Goroutines không?

<details>
<summary>Đáp án</summary>

- **Linux Kernel hoàn toàn không biết Goroutine**: Ở tầng nhân hệ điều hành, Linux Kernel chỉ tuân thủ nghiêm ngặt mô hình **1:1** thông qua `struct task_struct` và `clone(2)`. Toàn bộ bộ lập lịch Go Runtime vận hành ở **User Space (Ring 3)**.
- **Ý nghĩa các thành phần trong mô hình $G, M, P$**:
  - **`G` (Goroutine)**: Luồng thực thi cấp người dùng, có ngăn xếp riêng khởi đầu khoảng **2 KB** (co giãn tự động) và con trỏ lệnh PC.
  - **`M` (Machine / Worker Thread)**: Một OS Kernel Thread thực thụ, được tạo qua `clone(2)` và liên kết 1:1 với một `task_struct` của Linux.
  - **`P` (Processor)**: Ngữ cảnh tài nguyên logic cần thiết để thực thi mã Go; số lượng `P` mặc định bằng `GOMAXPROCS` (số lõi CPU logic).
- **Cách xử lý I/O và lời gọi chặn**: Khi `G` thực hiện I/O mạng hoặc channel, Go Runtime đưa `G` vào **Network Poller** (dựa trên `epoll(7)` trên Linux) nên không làm block `M`. Khi gặp lời gọi CGo bị chặn, Go Runtime nhả `M` đó ra cho Kernel và tạo một `M` mới để tiếp tục chạy các Goroutine khác.
</details>

### Câu Hỏi 10: Khi quan sát bằng lệnh `ps -eLf`, kết quả giữa chương trình C POSIX Threads (1:1) tạo 5 worker threads và chương trình Go (M:N) tạo 10.000 Goroutines khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- **Chương trình C (POSIX 1:1, tạo 5 worker threads)**: Hệ điều hành tạo ra đúng **6 LWPs** (`NLWP = 6`, gồm 1 Main Thread + 5 Worker Threads). Mỗi thread tương ứng với một `task_struct` độc lập trong Kernel và vùng stack ảo mặc định 8 MB.
- **Chương trình Go (M:N, tạo 10.000 Goroutines)**: Linux Kernel chỉ ghi nhận **khoảng 8 đến 12 LWPs (OS threads)** tương ứng với số lõi CPU logic làm worker threads cùng một vài thread quản lý bộ dọn rác (GC) và `sysmon`. Hệ điều hành không tạo 10.000 kernel threads; 10.000 Goroutines tồn tại dưới dạng các cấu trúc dữ liệu siêu nhỏ trên vùng nhớ Heap ở User Space.
</details>

### Câu Hỏi 11: Nêu hai cạm bẫy thực tế phổ biến liên quan đến các mô hình đa luồng (Thread Pool Exhaustion ở mô hình 1:1 và Blocking Syscalls ở Event Loop / M:1) cùng hướng khắc phục?

<details>
<summary>Đáp án</summary>

1. **Cạn kiệt luồng ở mô hình 1:1 (Thread Pool Exhaustion & C10K Problem)**:
   - *Hiện tượng & Nguyên nhân*: Các máy chủ dùng mô hình *Thread-per-connection* (như Tomcat truyền thống) khi vượt quá 2.000–3.000 kết nối đồng thời sẽ rơi vào **Context Switch Thrashing** (CPU đạt 100% chỉ để hoán đổi hàng nghìn luồng) và sập với lỗi `OutOfMemoryError: unable to create new native thread`.
   - *Khắc phục*: Chuyển sang lập trình bất đồng bộ không chặn (*Non-blocking I/O / Event-Driven*) dựa trên `epoll` (Netty, Node.js), hoặc nâng cấp lên Java 21+ sử dụng **Project Loom (Virtual Threads)** theo mô hình M:N trên JVM.
2. **Lời gọi chặn ở mô hình Many-to-One / Runtime đơn luồng (Blocking Syscalls)**:
   - *Hiện tượng & Nguyên nhân*: Trong runtime đơn luồng/coroutine như Python Gevent/Asyncio hay Node.js Event Loop, việc gọi hàm C đồng bộ (như mã hóa RSA nặng hoặc đọc tệp bằng `fread()`) khiến Kernel chặn luồng hạt nhân duy nhất, làm **toàn bộ Event Loop ở User Space bị treo đứng (*Freeze*)**.
   - *Khắc phục*: Đẩy các tác vụ tính toán nặng hoặc gọi thư viện/tệp đồng bộ sang một **Worker Thread Pool riêng biệt** (như `uv_work_queue` trong libuv của Node.js hoặc Goroutine riêng trong Go) để không làm phong tỏa luồng điều phối chính.
</details>
