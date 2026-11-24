# Review: 1_5_1 What is Deadlock

### Câu Hỏi 1: Deadlock là gì theo định nghĩa chuẩn tắc (OSTEP) và tại sao Edsger W. Dijkstra lại gọi hiện tượng này là "The Deadly Embrace"?

<details>
<summary>Đáp án</summary>

- **Nguồn gốc "The Deadly Embrace" (Cái ôm chết chóc)**: Năm 1965, trong bài khảo luận **EWD 123** (*Cooperating Sequential Processes*, Mục 6), Edsger W. Dijkstra dùng cụm từ này để mô tả tình huống hai hoặc nhiều tiến trình ôm giữ tài nguyên của nhau và không chịu buông tha, khiến một tiến trình chỉ có thể tiếp tục nếu tiến trình kia bị kết thúc trước, tạo ra thế bế tắc vĩnh cửu.
- **Định nghĩa chuẩn tắc theo OSTEP (Chapter 32)**: **Deadlock** là trạng thái mà một tập hợp các tiến trình hoặc luồng thực thi đồng thời (concurrent processes/threads) bị phong tỏa vĩnh viễn (**permanently blocked**), bởi vì mỗi tiến trình trong tập hợp đều đang nắm giữ ít nhất một tài nguyên (resource/lock) và đồng thời đang ngủ để chờ xin cấp phát thêm một tài nguyên khác đang bị chính một tiến trình khác trong cùng tập hợp đó nắm giữ.

</details>

### Câu Hỏi 2: Dưới góc nhìn hệ điều hành (low-level OS internals), điều gì xảy ra với trạng thái luồng (Thread State) và mức sử dụng CPU (CPU Usage) khi một luồng cố chiếm Mutex đang bị giữ và rơi vào Deadlock?

<details>
<summary>Đáp án</summary>

- **Trạng thái luồng (Thread State)**: Khi một luồng cố gắng chiếm đoạt khóa loại trừ tương hỗ (Mutex) đang bị luồng khác nắm giữ, nó bị thu hồi quyền thực thi trên CPU và chuyển từ `TASK_RUNNING` sang trạng thái ngủ (Sleep State — trên Linux là `TASK_INTERRUPTIBLE` hoặc `TASK_UNINTERRUPTIBLE`, hiển thị mã `Sl` hoặc `Sl+`).
- **Mức sử dụng CPU (CPU Usage)**: Vì các luồng bị kẹt đều ở trạng thái ngủ chờ đợi nên chúng không tiêu tốn thêm bất kỳ chu kỳ xung nhịp CPU nào; chỉ số **CPU Usage tụt về đúng 0%** cho các luồng bị Deadlock.

</details>

### Câu Hỏi 3: Theo cơ chế đánh thức (Wake-up Mechanism) của Kernel Scheduler, tại sao các luồng trong trạng thái Deadlock không thể tự giải thoát?

<details>
<summary>Đáp án</summary>

- Kernel Scheduler chỉ đánh thức (wake up) một luồng đang ngủ khi có một tiến trình khác kích hoạt sự kiện mở khóa hoặc giải phóng tài nguyên (ví dụ gọi `pthread_mutex_unlock` hay system call tương ứng).
- Trong kịch bản Deadlock, tiến trình chịu trách nhiệm phát ra sự kiện giải phóng tài nguyên lại chính là tiến trình cũng đang bị đưa vào trạng thái ngủ vì đang chờ một tài nguyên khác. Vì không luồng nào trong tập hợp có thể tiếp tục chạy để phát tín hiệu đánh thức, hành vi giải phóng không bao giờ diễn ra tự nhiên, dẫn đến bế tắc vĩnh viễn (trừ khi có tác nhân bên ngoài can thiệp).

</details>

### Câu Hỏi 4: Ví dụ thực tế "Nút giao thông chữ thập bị kẹt cứng" (Traffic Gridlock) minh họa bản chất nào của Deadlock?

<details>
<summary>Đáp án</summary>

- Trong ví dụ 4 chiếc xe (A, B, C, D) cùng lao vào một ngã tư không đèn tín hiệu từ 4 hướng:
  - Mỗi xe đều đã chiếm giữ một khoảng không gian trong giao lộ và muốn đi tiếp, nhưng đầu xe lại bị xe vuông góc bên cạnh chắn ngang (**không thể tiến lên**).
  - Phía sau đuôi mỗi xe đều đã bị dòng phương tiện đông đúc khóa chặt (**không thể lùi lại**).
- Tình huống này minh họa cho một **vòng tròn bế tắc khép kín**: sự tiến triển của mỗi bên phụ thuộc vào việc bên kế tiếp giải phóng không gian trước. Nếu không có "ngoại lực" can thiệp (như cảnh sát giao thông hoặc xe cứu hộ đến cẩu một xe đi), toàn bộ ngã tư sẽ tê liệt vĩnh viễn.

</details>

### Câu Hỏi 5: Kịch bản "Reverse Lock Acquisition" (chiếm khóa ngược thứ tự) giữa hai luồng diễn ra như thế nào để tạo ra Deadlock?

<details>
<summary>Đáp án</summary>

Kịch bản xảy ra khi hai luồng tranh chấp hai khóa (`Lock 1` và `Lock 2`) theo **thứ tự ngược chiều nhau**:
1. **Thread 1** gọi `pthread_mutex_lock(Lock 1)` thành công và nắm giữ `Lock 1`.
2. CPU chuyển ngữ cảnh (Context Switch) sang **Thread 2**; **Thread 2** gọi `pthread_mutex_lock(Lock 2)` thành công và nắm giữ `Lock 2`.
3. **Thread 1** chạy tiếp và yêu cầu `Lock 2` — thất bại vì `Lock 2` đang bị Thread 2 giữ, nên Thread 1 bị Kernel đưa vào trạng thái ngủ (Sleep).
4. **Thread 2** chạy tiếp và yêu cầu `Lock 1` — thất bại vì `Lock 1` đang bị Thread 1 giữ, nên Thread 2 cũng bị Kernel đưa vào trạng thái ngủ (Sleep).
5. Cả hai luồng ngủ vĩnh viễn và không luồng nào có cơ hội gọi `unlock()`.

</details>

### Câu Hỏi 6: Trong Đồ Thị Phân Bổ Tài Nguyên (Resource Allocation Graph - RAG), các cạnh biểu diễn điều gì và dấu hiệu nào khẳng định Deadlock đã hình thành?

<details>
<summary>Đáp án</summary>

Trong RAG có hai loại cạnh có hướng:
- **Cạnh sở hữu (Assignment Edge)**: Hướng từ **Tài nguyên $\to$ Luồng** (cho biết tài nguyên đang thuộc quyền sở hữu của luồng đó, ví dụ `Lock 1 -> Thread 1` và `Lock 2 -> Thread 2`).
- **Cạnh yêu cầu (Request Edge)**: Hướng từ **Luồng $\to$ Tài nguyên** (cho biết luồng đang chờ xin cấp phát tài nguyên đó, ví dụ `Thread 1 -> Lock 2` và `Thread 2 -> Lock 1`).

**Dấu hiệu Deadlock**: Các cạnh này kết nối thành một **chu trình khép kín có hướng (Directed Cycle)**:
$$\text{Thread 1} \longrightarrow \text{Lock 2} \longrightarrow \text{Thread 2} \longrightarrow \text{Lock 1} \longrightarrow \text{Thread 1}$$

</details>

### Câu Hỏi 7: Khi điều tra Deadlock trên Linux bằng lệnh `ps -o pid,tid,stat,wchan,cmd -T -p $PID`, các giá trị `Sl+` ở cột `STAT` và `futex_` / `do_wait` ở cột `WCHAN` có ý nghĩa gì? Ngoài `ps`, còn cách nào để đọc `wchan` của một luồng?

<details>
<summary>Đáp án</summary>

- **Cột `STAT` hiển thị `Sl+`**:
  - `S`: Trạng thái ngủ có thể ngắt (Interruptible Sleep), chứng minh luồng không tốn CPU.
  - `l`: Tiến trình đa luồng (Multi-threaded process).
  - `+`: Thuộc nhóm tiến trình tiền cảnh (Foreground process group).
- **Cột `WCHAN` (Kernel Wait Channel)** hiển thị tên hàm nhân Linux nơi luồng đang bị chặn:
  - `futex_` (như `futex_wait` / `futex_wait_queue`) ở các luồng con: Thư viện `glibc pthreads` sử dụng cơ chế **futex** (Fast Userspace Mutex) ở tầng dưới; giá trị này khẳng định các luồng đang bị chặn chờ nhau mở khóa mutex.
  - `do_wait` ở luồng chính (`main`): Cho biết luồng chính đang chờ `pthread_join` để đón các luồng con hoàn tất.
- **Cách kiểm tra khác**: Đọc trực tiếp từ hệ thống tệp ảo `/proc` bằng lệnh `cat /proc/$PID/task/<tid>/wchan`.

</details>

### Câu Hỏi 8: Trong thực tế sản xuất, cạm bẫy "Lock Ordering Inconsistency" là gì và biện pháp "Total Lock Ordering" giải quyết nó như thế nào?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy Lock Ordering Inconsistency**: Là tình trạng các luồng khóa cùng một tập tài nguyên theo thứ tự trái ngược nhau (nguyên nhân của hơn 80% sự cố Deadlock thực tế). Ví dụ: khi chuyển tiền từ A sang B thì khóa A trước rồi B, nhưng luồng chạy đồng thời chuyển từ B sang A lại khóa B trước rồi A, dẫn đến khóa chéo và treo cụm worker khi tải cao.
- **Giải pháp Total Lock Ordering (Quy tắc thứ tự khóa toàn cục)**: Bất kể chiều giao dịch là gì, luôn sắp xếp các ID tài nguyên theo một thứ tự cố định (ví dụ tăng dần: `from->id < to->id`) trước khi khóa. Khi mọi luồng đều tuân thủ cùng một thứ tự khóa ($A \to B$), luồng nào lấy được khóa đầu tiên sẽ tiếp tục lấy được khóa thứ hai (vì luồng còn lại chưa có khóa đầu để chạm tới khóa sau), triệt tiêu hoàn toàn chu trình chờ đợi chéo (Circular Wait).

</details>

### Câu Hỏi 9: Việc sử dụng khóa chờ vô hạn (Unbounded Wait) có thể gây ra hậu quả dây chuyền gì cho hệ thống backend?

<details>
<summary>Đáp án</summary>

- Khi dùng các cơ chế xin khóa không có thời gian chờ giới hạn (như `pthread_mutex_lock()` trong C, `synchronized` trong Java, hoặc câu lệnh SQL `SELECT ... FOR UPDATE` không đặt cờ `NOWAIT` hay `WAIT <n>`), một luồng bị kẹt Deadlock sẽ giữ nguyên trạng thái treo vô hạn.
- Hệ quả là các luồng tiếp theo đến phục vụ yêu cầu người dùng cũng bị kẹt theo, gây ra hiện tượng **Connection Pool Starvation** (cạn kiệt luồng hoặc kết nối trong hồ chứa) và khiến toàn bộ hệ thống backend rơi vào **sụp đổ dây chuyền (Cascading Failure)**.

</details>

### Câu Hỏi 10: Cần áp dụng những biện pháp chuẩn mực (Best Practices) nào để phòng tránh thảm họa do Unbounded Wait gây ra?

<details>
<summary>Đáp án</summary>

1. **Sử dụng Timeout Lock (khóa có giới hạn thời gian)**: Ví dụ dùng `pthread_mutex_timedlock()` trong POSIX, `tryLock(timeout, timeUnit)` trong Java, hoặc `SET lock_timeout = '5s'` trong PostgreSQL.
2. **Hủy bỏ và nhả tài nguyên khi quá hạn**: Nếu hết thời gian chờ mà vẫn chưa lấy được khóa, tiến trình phải chủ động hủy bỏ giao dịch và giải phóng toàn bộ các tài nguyên đang nắm giữ.
3. **Thử lại có chiến lược**: Áp dụng kỹ thuật **Exponential Backoff with Jitter** trước khi thực hiện thử lại giao dịch.

</details>
