# Review: 1_3_1 Process vs Thread

### Câu Hỏi 1: Theo bản chất kỹ thuật trong hệ điều hành, sự khác biệt cốt lõi giữa Process và Thread là gì, và tại sao Thread thường được gọi là Lightweight Process (LWP)?

<details>
<summary>Đáp án</summary>

- **Tiến trình (Process)** là đơn vị cơ bản của việc **cấp phát tài nguyên và cô lập không gian địa chỉ bộ nhớ** (*unit of resource allocation and address space protection*). Mỗi Process sở hữu không gian bộ nhớ ảo (`mm_struct`), bảng mô tả tệp mở (`files_struct`) và danh tính bảo mật (UID/GID) độc lập; không thể tự ý đọc/ghi bộ nhớ của Process khác nếu không qua giao thức IPC.
- **Luồng (Thread)** là đơn vị cơ bản của việc **lập lịch và thực thi trên CPU** (*unit of CPU execution and scheduling*), đại diện cho một điểm thực thi độc lập (một Program Counter) bên trong Process.
- Thread được gọi là **Lightweight Process (LWP)** vì các Thread trong cùng một Process chia sẻ chung không gian địa chỉ bộ nhớ và tài nguyên hệ thống, giúp chi phí tạo mới, hủy bỏ và chuyển ngữ cảnh (*context switch*) rẻ hơn đáng kể so với Process.
</details>

---

### Câu Hỏi 2: Các Thread trong cùng một Process chia sẻ chung những tài nguyên hệ thống nào?

<details>
<summary>Đáp án</summary>

Theo chuẩn POSIX.1, các Thread thuộc cùng một Process chia sẻ chung các tài nguyên sau:
1. **Không gian địa chỉ bộ nhớ ảo (Virtual Address Space)**: bao gồm **Text Segment** (mã máy), **Data Segment** (biến toàn cục/tĩnh đã khởi tạo), **BSS Segment** (biến toàn cục/tĩnh chưa khởi tạo) và **Heap Segment** (vùng nhớ cấp phát động qua `malloc()`, `calloc()`, `new`).
2. **Bảng mô tả tệp mở (Open File Descriptors Table - `struct files_struct`)**: file hoặc network socket do một Thread mở có thể được Thread khác trực tiếp `read()`/`write()` thông qua cùng số `fd`.
3. **Thông tin hệ thống tệp (`fs_struct`)**: thư mục làm việc hiện tại (CWD), thư mục gốc (Root Directory) và mặt nạ quyền tạo tệp (Umask).
4. **Hành vi xử lý tín hiệu (Signal Dispositions / Handlers - `struct sighand_struct`)**: hàm xử lý thiết lập qua `sigaction()` áp dụng chung cho toàn bộ Process.
5. **Danh tính tiến trình & quyền hạn (Process Credentials)**: PID/TGID, PPID, PGID, SID, Real/Effective UID, GID, Supplementary Group IDs.
6. **Giới hạn tài nguyên hệ thống (`rlimit`)**: các ngưỡng giới hạn cấu hình qua `setrlimit()` như `RLIMIT_NOFILE`, `RLIMIT_CPU`.
</details>

---

### Câu Hỏi 3: Những thành phần trạng thái nào là riêng tư tuyệt đối của từng Thread, và tại sao chúng phải tách riêng?

<details>
<summary>Đáp án</summary>

Mỗi Thread bắt buộc phải có tập trạng thái thực thi riêng biệt (*Thread-Private State*) để CPU có thể tạm dừng và khôi phục luồng đó độc lập:
1. **Thread ID độc nhất (TID / LWP)**: định danh cấp kernel (truy xuất qua `gettid(2)`).
2. **Con trỏ lệnh (Program Counter - PC / RIP)**: xác định chỉ lệnh mã máy tiếp theo mà luồng đó sẽ thực thi.
3. **Tập thanh ghi CPU (CPU Registers)**: thanh ghi số nguyên, thanh ghi cờ trạng thái (`RFLAGS`), thanh ghi dấu phẩy động (`AVX/SSE`).
4. **Ngăn xếp thực thi riêng (Private User Call Stack)**: lưu khung hàm (*Stack Frames*), biến cục bộ (*Local Variables*) và địa chỉ trả về (*Return Addresses*). Trên Linux x86_64, kích thước mặc định thường là **8 MB (8192 KB)** theo `RLIMIT_STACK`.
5. **Ngăn xếp Kernel riêng (Private Kernel Stack - `kstack`)**: thường 8 KB hoặc 16 KB, dùng khi luồng bẫy vào Kernel Mode qua System Call hoặc ngắt phần cứng.
6. **Vùng nhớ cục bộ luồng (Thread-Local Storage - TLS)**: các biến khai báo với `__thread` (C) hoặc `thread_local` (C++11).
7. **Mặt nạ tín hiệu riêng (Signal Mask)** (`pthread_sigmask(3)`) và **Hàng đợi tín hiệu chờ xử lý riêng (Pending Signals)** (`pthread_kill(3)` / `tgkill(2)`).
8. **Mã lỗi riêng biệt (`errno`)**: được triển khai dưới dạng macro thread-local (ví dụ `*__errno_location()`) để lỗi syscall của Thread này không ghi đè lên mã lỗi của Thread khác.
</details>

---

### Câu Hỏi 4: Trong thực hành lập trình POSIX Threads trên Linux, `gettid()` và `pthread_self()` khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- **`gettid(2)`** trả về mã định danh **TID (Kernel Thread ID / LWP)** do Linux Kernel gán cho luồng đó để bộ lập lịch điều phối.
- **`pthread_self(3)`** trả về giá trị kiểu `pthread_t`, đây là một *opaque handle* do thư viện không gian người dùng (**glibc NPTL**) quản lý (thường là địa chỉ con trỏ trỏ tới cấu trúc `struct pthread` trên Heap), **không phải** là TID cấp kernel.
</details>

---

### Câu Hỏi 5: Linux Kernel biểu diễn Process và Thread bằng cấu trúc dữ liệu nào, và cơ chế `clone(2)` tạo ra Thread như thế nào?

<details>
<summary>Đáp án</summary>

- Linux Kernel **không có cấu trúc `struct thread` riêng biệt**. Cả Process độc lập và Thread đều được biểu diễn đồng nhất bằng **`struct task_struct`** (định nghĩa trong `include/linux/sched.h`).
- Sự khác biệt giữa tạo Process mới (`fork`) và tạo Thread mới (`pthread_create`) nằm ở các cờ (*flags*) truyền vào System Call **`clone(2)`**. Khi NPTL gọi `pthread_create(3)`, nó gọi `clone(2)` với tổ hợp cờ chia sẻ tài nguyên gồm:
  - **`CLONE_VM`**: dùng chung không gian bộ nhớ ảo (`struct mm_struct`).
  - **`CLONE_FS`**: dùng chung thông tin hệ thống tệp (`fs_struct`).
  - **`CLONE_FILES`**: dùng chung bảng File Descriptors (`struct files_struct`).
  - **`CLONE_SIGHAND`**: dùng chung bảng bộ xử lý tín hiệu (`struct sighand_struct`).
  - **`CLONE_THREAD`**: đưa `task_struct` mới vào cùng một **Thread Group** (cùng giá trị TGID).
  - **`CLONE_SYSVSEM`**: dùng chung danh sách hoàn tác Semaphore System V (*semundo*).
</details>

---

### Câu Hỏi 6: Tại sao các Thread trong cùng một Process khi gọi `getpid()` luôn nhận về cùng một giá trị, còn `gettid()` lại trả về các giá trị khác nhau?

<details>
<summary>Đáp án</summary>

- Khi tạo luồng qua `clone(2)` với cờ `CLONE_THREAD`, tất cả các luồng được xếp vào cùng một **Thread Group** của luồng chính (Thread Group Leader) và có chung một giá trị **TGID (Thread Group ID)**.
- Trên Linux, hàm **`getpid(2)`** đọc và trả về trường **`task->tgid`**, nên mọi luồng trong cùng tiến trình đều nhận được cùng một số PID.
- Ngược lại, syscall **`gettid(2)`** đọc trường **`task->pid`** thực tế ở tầng kernel, đây là mã định danh duy nhất của từng `task_struct` để bộ lập lịch CPU (như Linux CFS / EEVDF Scheduler) phân biệt và điều phối riêng lẻ từng luồng.
</details>

---

### Câu Hỏi 7: Vì sao chi phí Context Switch (chuyển ngữ cảnh) giữa các Thread trong cùng Process lại thấp hơn nhiều so với giữa các Process khác nhau?

<details>
<summary>Đáp án</summary>

- Khi chuyển ngữ cảnh giữa **hai Process khác nhau**, CPU phải thay đổi không gian địa chỉ bộ nhớ ảo: nạp lại thanh ghi **`CR3`** trỏ tới bảng phân trang mới, phải **xả bộ nhớ đệm TLB** và làm **hỏng CPU Cache**. Chi phí khởi tạo Process cũng tốn kém hơn vì cần cấp phát PCB và nhân bản page table (qua Copy-on-Write).
- Khi chuyển ngữ cảnh giữa **hai Thread trong cùng Process**, cả hai dùng chung một không gian địa chỉ ảo (`mm_struct`), nên hệ điều hành **giữ nguyên bảng phân trang (`CR3`) và không cần xả TLB**, chỉ cần lưu và hoán đổi tập **thanh ghi CPU** (bao gồm Program Counter và con trỏ Stack).
</details>

---

### Câu Hỏi 8: So sánh cơ chế giao tiếp (Communication) và khả năng cô lập sự cố (Fault Isolation) giữa mô hình đa Process và đa Thread?

<details>
<summary>Đáp án</summary>

- **Cơ chế giao tiếp**:
  - **Giữa các Process**: Do bộ nhớ bị cô lập bởi MMU, các Process phải giao tiếp gián tiếp qua **IPC** (Pipes, Sockets, Shared Memory, Message Queues).
  - **Giữa các Thread**: Có thể đọc/ghi trực tiếp vào biến toàn cục hoặc con trỏ vùng nhớ Heap dùng chung mà không cần IPC.
- **Khả năng cô lập sự cố (Fault Isolation / Crash Domain)**:
  - **Process (Độ an toàn cao)**: Nếu Process A gặp lỗi truy cập bộ nhớ bất hợp pháp (như con trỏ NULL, `double free`) dẫn tới tín hiệu `SIGSEGV`, chỉ Process A bị Kernel tiêu diệt; các Process B, C khác không bị ảnh hưởng.
  - **Thread (Vùng phá hủy chung - Shared Crash Domain)**: Vì mọi Thread dùng chung một không gian địa chỉ ảo (`mm_struct`) và hành vi tín hiệu (`sighand_struct`), **chỉ cần một Thread gặp lỗi `SIGSEGV`, toàn bộ Process và tất cả các Thread còn lại sẽ bị hệ điều hành tiêu diệt ngay lập tức**. Do đó, các tác vụ rủi ro cao (parse tệp người dùng, chạy plugin bên thứ ba) nên được cô lập ra Process hoặc Worker Container riêng.
</details>

---

### Câu Hỏi 9: Trên Linux, những lệnh CLI và đường dẫn hệ thống tệp `/proc` nào được dùng để kiểm tra kích thước Stack mặc định, liệt kê các Thread (LWP) và theo dõi CPU của từng Thread?

<details>
<summary>Đáp án</summary>

- **Kiểm tra kích thước Stack mặc định**: dùng `ulimit -s` (trả về đơn vị kilobytes, thường là `8192`, tương đương 8 MB).
- **Liệt kê các Thread của tiến trình**: dùng `ps -eLf` (cờ `-L` hiển thị các cột `LWP` là Kernel TID và `NLWP` là tổng số luồng trong tiến trình; luồng chính có `LWP` trùng với `PID`).
- **Kiểm tra trong `/proc` filesystem**: kiểm tra thư mục `/proc/<PID>/task/`, trong đó mỗi Thread có một thư mục con mang tên Kernel TID của nó chứa các tệp trạng thái riêng như `status`, `sched`, `stack`.
- **Giám sát CPU từng Thread theo thời gian thực**: dùng `top -H -p <PID>` (cờ `-H` bật chế độ *Thread Mode*).
</details>

---

### Câu Hỏi 10: Hiện tượng "Thread Stack Space Explosion" (Bùng nổ bộ nhớ ảo do kích thước Stack) xảy ra như thế nào khi cấu hình Thread Pool lớn, và các cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Trên Linux mặc định, mỗi Thread mới được cấp phát một vùng ngăn xếp ảo kích thước **8 MB** (`RLIMIT_STACK = 8192 KB`). Nếu khởi tạo 1.000 Thread, tiến trình sẽ phải dự trù tới $1.000 \times 8\text{ MB} = 8\text{ GB}$ không gian bộ nhớ ảo (ngay cả khi Heap còn nhiều trống), dễ gây cạn kiệt bảng trang ảo trên container giới hạn tài nguyên hoặc hệ thống 32-bit, dẫn đến lỗi như `java.lang.OutOfMemoryError: unable to create new native thread`.
- **Cách khắc phục**:
  - Trong **C/POSIX**: dùng `pthread_attr_setstacksize()` để giảm kích thước Stack xuống mức phù hợp (ví dụ 512 KB hoặc 1 MB) nếu luồng không đệ quy sâu.
  - Trong **Java**: điều chỉnh tham số JVM `-Xss` (ví dụ `-Xss512k`, `-Xss1m`).
  - Ở tầng **kiến trúc hệ thống**: chuyển sang mô hình bất đồng bộ hướng sự kiện (Non-blocking I/O / Event-driven như Node.js, Netty) hoặc dùng luồng ảo (Java Virtual Threads, Go Goroutines).
</details>

---

### Câu Hỏi 11: Tại sao một phép toán tưởng chừng đơn giản như `counter++` trên biến chia sẻ lại có thể gây ra Race Condition / Data Race giữa các Thread, và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Bản chất kỹ thuật**: Vì các Thread chia sẻ chung Heap và Data Segment, phép toán `counter++` không phải là một thao tác đơn nguyên (*atomic*) mà gồm 3 chỉ lệnh mã máy tách biệt:
  1. `MOV EAX, [counter]` (nạp giá trị từ RAM vào thanh ghi CPU)
  2. `ADD EAX, 1` (cộng 1 trên ALU)
  3. `MOV [counter], EAX` (ghi kết quả từ thanh ghi về lại RAM)
- Nếu hai Thread bị bộ lập lịch ngắt và chạy xen kẽ giữa 3 bước này, kết quả ghi sau sẽ ghi đè và làm mất cập nhật của Thread kia (*Lost Update*), dẫn đến sai lệch dữ liệu.
- **Cách khắc phục**: Bảo vệ vùng truy cập dữ liệu chia sẻ (*Critical Sections*) bằng khóa loại trừ tương hỗ (`pthread_mutex_t`), thao tác nguyên tử (*Atomic Operations* như `std::atomic` / `AtomicInteger`), hoặc cấu trúc dữ liệu Lock-Free.
</details>

---

### Câu Hỏi 12: Cạm bẫy khi xử lý tín hiệu (Signal Handling) trong ứng dụng đa luồng là gì, và Best Practice để xử lý tín hiệu an toàn trong POSIX là gì?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy**: Hành vi xử lý tín hiệu (*Signal Disposition*) cài đặt bằng `sigaction()` áp dụng cho **toàn bộ tiến trình**, trong khi mặt nạ chặn tín hiệu (*Signal Mask*) lại là thuộc tính **riêng của từng luồng**. Khi hệ thống gửi tín hiệu tới tiến trình (như `SIGINT`, `SIGTERM`), Linux Kernel chọn ngẫu nhiên một Thread không chặn tín hiệu đó để chạy Signal Handler; nếu handler truy cập tài nguyên đang bị khóa bởi Thread khác thì sẽ gây **Deadlock**.
- **Best Practice**: Luồng chính (Main Thread) nên chặn toàn bộ tín hiệu trước khi gọi `pthread_create()` để các Worker Threads thừa kế mặt nạ chặn đó; sau đó tạo một Thread chuyên dụng gọi `sigwait()` hoặc `sigwaitinfo()` để tiếp nhận và xử lý tín hiệu hệ thống một cách đồng bộ, an toàn.
</details>
