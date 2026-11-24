# Review: 1_6_6 Round Robin Scheduling

### Câu Hỏi 1: Giải thuật Round Robin (RR) giải quyết bài toán gì và hoạt động theo cơ chế nào?

<details>
<summary>Đáp án</summary>

- **Bài toán giải quyết**: Round Robin được thiết kế cho các hệ thống chia sẻ thời gian (Time-Sharing Systems) và máy trạm tương tác hiện đại, nơi người dùng cần thời gian phản hồi nhanh (**Low Response Time**), tránh tình trạng một tiến trình chạy lâu chiếm giữ CPU quá lâu.
- **Cơ chế hoạt động**:
  1. Toàn bộ các tiến trình sẵn sàng được xếp vào một hàng đợi theo thứ tự trước sau (**FIFO Queue**).
  2. Mỗi tiến trình được cấp phát CPU tối đa trong một lát cắt thời gian xác định trước (**Time Quantum / Time Slice**, ký hiệu $q$, thường từ $10\text{ ms}$ đến $100\text{ ms}$).
  3. Bộ điều phối lấy tiến trình ở đầu hàng đợi lên chạy và bật bộ đếm thời gian phần cứng (**Hardware Timer**):
     - Nếu tiến trình hoàn tất hoặc phát sinh I/O trước khi hết $q$: tiến trình tự nguyện nhả CPU.
     - Nếu tiến trình vẫn đang chạy khi hết $q$: bộ đếm phát ngắt **Timer Interrupt**, hệ điều hành cưỡng chế thu hồi CPU, đưa tiến trình đó về **cuối hàng đợi `Ready`** và nạp tiến trình tiếp theo lên chạy.

</details>

### Câu Hỏi 2: Việc chọn Time Quantum ($q$) quá lớn hoặc quá nhỏ gây ra hệ quả gì, và quy tắc ngón tay cái (Rule of Thumb) để chọn $q$ là gì?

<details>
<summary>Đáp án</summary>

- **Nếu $q$ quá lớn ($q \to \infty$)**: Ngắt đồng hồ hầu như không bao giờ kích hoạt vì các tiến trình chạy xong trước khi hết $q$. Round Robin suy biến hoàn toàn thành **First-Come, First-Served (FCFS)** và hiệu ứng đoàn tàu (**Convoy Effect**) quay trở lại.
- **Nếu $q$ quá nhỏ ($q \to 0$)**: Chi phí chuyển ngữ cảnh (**Context Switch Overhead**) tăng vọt (mỗi lần chuyển ngữ cảnh tốn khoảng $1\ \mu\text{s}$ đến $10\ \mu\text{s}$ để lưu thanh ghi, gây mất mát CPU L1/L2 Cache và xóa TLB). Nếu đặt $q$ quá nhỏ như $10\ \mu\text{s}$, CPU có thể tốn tới $50\%$ công suất chỉ để đổi chỗ tiến trình mà không làm được việc hữu ích.
- **Quy tắc ngón tay cái (Rule of Thumb)**: Cấu hình $q$ sao cho **khoảng 80% các CPU Burst của tiến trình ngắn hơn $q$**. Nhờ đó, phần lớn tác vụ ngắn hoàn thành ngay trong lượt đầu tiên mà không bị ngắt, còn các tác vụ dài vẫn bị chia nhỏ để nhường CPU cho tiến trình khác.

</details>

### Câu Hỏi 3: Tại sao Round Robin có Response Time rất tốt nhưng Turnaround Time lại thường kém nhất?

<details>
<summary>Đáp án</summary>

- **Response Time vượt trội**: Với $Response\ Time = \text{Thời điểm chạy lần đầu} - AT$, nếu có $N$ tiến trình trong hàng đợi và lát cắt thời gian là $q$, không một tiến trình nào phải đợi quá $(N - 1) \times q$ đơn vị thời gian để được tương tác với CPU.
- **Turnaround Time ($TAT = CT - AT$) kém nhất**: Thay vì để một tiến trình chạy xong dứt điểm rồi rời hệ thống, Round Robin chia đều thời gian CPU cho tất cả tiến trình cùng chạy xen kẽ. Điều này kéo dài thời gian hoàn thành của mọi tiến trình, khiến hầu hết các tiến trình đều kết thúc muộn vào giai đoạn cuối và làm $TAT$ (cũng như $WT$) trung bình tăng cao.

</details>

### Câu Hỏi 4: Trong bài tập so sánh các giải thuật điều phối, công thức tính $TAT$ và $WT$ là gì, và 4 giải thuật (SRTF, SJF, FCFS, Round Robin) khác nhau như thế nào về ưu khuyết điểm?

<details>
<summary>Đáp án</summary>

- **Công thức tính**:
  - Thời gian lưu lại: $TAT = CT - AT$ (Completion Time $-$ Arrival Time).
  - Thời gian chờ: $WT = TAT - BT$ (Turnaround Time $-$ Burst Time).
- **So sánh đánh đổi giữa 4 giải thuật (theo kết quả bài tập ở Mục 4.5)**:
  - **Preemptive SRTF** ($Avg\ WT = 6.50$, $Avg\ TAT = 13.00$): Tối ưu tuyệt đối về toán học cho $WT$ và $TAT$, nhưng thực tế không biết trước Burst Time tương lai và chi phí ngắt cao.
  - **Non-Preemptive SJF** ($Avg\ WT = 7.75$, $Avg\ TAT = 14.25$): Rất tốt cho hệ thống xử lý theo lô (Batch), không tốn chi phí chuyển ngữ cảnh do ngắt ngang.
  - **FCFS** ($Avg\ WT = 8.75$, $Avg\ TAT = 15.25$): Cực kỳ đơn giản, không bao giờ gây đói tài nguyên (Starvation), nhưng mắc lỗi **Convoy Effect** khi tác vụ dài đến trước.
  - **Round Robin ($q = 2$)** ($Avg\ WT = 12.75$, $Avg\ TAT = 19.25$): Kém nhất về $WT$ và $TAT$ vì kéo dài tất cả tiến trình, nhưng có **Response Time tốt nhất** và chống độc quyền CPU.

</details>

### Câu Hỏi 5: Khi chạy Round Robin với $q = 2$, điều gì xảy ra nếu một tiến trình có thời gian Burst còn lại nhỏ hơn $q$ (như $P_4$ tại $t = 22 \to 23$ trong bài tập)?

<details>
<summary>Đáp án</summary>

- Nếu tiến trình chạy hết trọn vẹn $q = 2$ mà vẫn chưa xong, nó bị ngắt và đưa về cuối hàng đợi `Ready`.
- Ngược lại, khi thời gian còn lại của tiến trình nhỏ hơn $q$ (như $P_4$ tại $t = 22$ chỉ còn $1$ đơn vị, nhỏ hơn $q = 2$), tiến trình chỉ chạy đúng phần thời gian còn lại đó ($22 \to 23$), **hoàn thành ngay lập tức** ($CT = 23$) và tự nguyện nhả CPU cho tiến trình tiếp theo trong hàng đợi mà không cần chờ hết đủ $2$ đơn vị thời gian.

</details>

### Câu Hỏi 6: Trong ngôn ngữ C trên Linux, những hàm hệ thống nào dùng để đọc, kiểm tra Time Quantum và chuyển chính sách lập lịch sang `SCHED_RR`, kèm theo điều kiện gì?

<details>
<summary>Đáp án</summary>

- **Các hàm hệ thống chuẩn (trong `<sched.h>`)**:
  - `sched_getscheduler(pid)`: Đọc chính sách lập lịch hiện tại của tiến trình (ví dụ `SCHED_OTHER`, `SCHED_RR`, `SCHED_FIFO`).
  - `sched_rr_get_interval(pid, &tp)`: Kiểm tra khoảng thời gian Time Quantum của `SCHED_RR` trên hệ thống (kết quả lưu vào `struct timespec`).
  - `sched_setscheduler(pid, SCHED_RR, &param)`: Thiết lập chính sách lập lịch mới cho tiến trình.
- **Điều kiện cần thiết**:
  - Cần truyền độ ưu tiên Real-Time (`param.sched_priority`) nằm trong dải từ **1 đến 99**.
  - Tiến trình phải có quyền **`root` / `sudo`** (hoặc capability **`CAP_SYS_NICE`**), nếu không lời gọi `sched_setscheduler` sang `SCHED_RR` sẽ thất bại.

</details>

### Câu Hỏi 7: Trên Linux, ta dùng các lệnh CLI (`chrt` và `/proc`) nào để kiểm tra, khởi chạy tiến trình với `SCHED_RR` và xem Time Quantum mặc định?

<details>
<summary>Đáp án</summary>

- **Công cụ `chrt`**:
  - `chrt -m`: Xem dải mức độ ưu tiên được hỗ trợ cho các chính sách lập lịch của Linux Kernel.
  - `chrt -p <PID>`: Xem chính sách lập lịch hiện tại của một tiến trình (ví dụ `chrt -p 1`).
  - `sudo chrt -r <priority> <command>`: Khởi chạy một ứng dụng với chính sách Real-Time Round Robin (`SCHED_RR`), ví dụ `sudo chrt -r 20 ./my_app &`.
- **Hệ thống tệp ảo `/proc`**:
  - `cat /proc/sys/kernel/sched_rr_timeslice_ms`: Xem Time Quantum mặc định của `SCHED_RR` (trên Linux thường mặc định là **`100 ms`**).
  - `/proc/<PID>/sched`: Xem chi tiết thống kê chuyển ngữ cảnh và thời gian chạy của tiến trình.

</details>

### Câu Hỏi 8: Dưới tải cao trên môi trường Production, việc giảm `sched_rr_timeslice_ms` xuống quá thấp (ví dụ `1 ms`) gây ra cạm bẫy gì?

<details>
<summary>Đáp án</summary>

- Trong các hệ thống Web/Microservices tải cao (High Throughput), giảm `sched_rr_timeslice_ms` xuống quá thấp (như `1 ms`) sẽ làm:
  - Tần suất ngắt đồng hồ phần cứng và chuyển ngữ cảnh tăng vọt lên hàng chục ngàn lần mỗi giây trên mỗi lõi CPU.
  - Bộ đệm **CPU Cache L1/L2** liên tục bị "ô nhiễm" (**Cache Pollution / Thrashing**) do mã nguồn và dữ liệu của các tiến trình khác nhau liên tục ghi đè lên nhau.
  - Hệ quả là hiệu năng tính toán tổng thể của máy chủ có thể **sụt giảm từ 20% đến 40%**.

</details>

### Câu Hỏi 9: Linux Kernel hiện đại có còn dùng Round Robin cổ điển cho các tiến trình thông thường (`SCHED_OTHER`) không? Điểm khác biệt cốt lõi là gì?

<details>
<summary>Đáp án</summary>

- **Không**. Kể từ phiên bản **Linux 2.6.23**, hạt nhân Linux sử dụng **Completely Fair Scheduler (CFS)** cho các tiến trình thông thường (`SCHED_OTHER`) thay vì Round Robin cổ điển.
- **Điểm khác biệt**:
  - CFS sử dụng cấu trúc **cây đỏ-đen (Red-Black Tree)** và biến thời gian ảo **`vruntime`** (Virtual Runtime).
  - Thay vì chia một Time Quantum cố định cho từng tiến trình như Round Robin cổ điển, CFS cấp phát tỷ lệ phần trăm CPU dựa trên trọng số **`nice`**.
  - Tuy nhiên, chính sách **`SCHED_RR`** chuẩn POSIX vẫn được nhân Linux duy trì nguyên vẹn để dành riêng cho các ứng dụng thời gian thực (Real-Time Applications).

</details>
