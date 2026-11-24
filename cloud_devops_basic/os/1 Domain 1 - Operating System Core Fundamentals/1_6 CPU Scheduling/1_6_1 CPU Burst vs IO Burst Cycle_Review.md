# Review: 1_6_1 CPU Burst vs IO Burst Cycle

### Câu Hỏi 1: Trong vòng đời thực thi của một tiến trình, CPU Burst và I/O Burst là gì và trạng thái của tiến trình thay đổi như thế nào giữa hai pha này?

<details>
<summary>Đáp án</summary>

Vòng đời của một tiến trình không sử dụng CPU liên tục từ đầu đến cuối mà là chuỗi luân phiên giữa hai trạng thái:
- **CPU Burst**: Khoảng thời gian liên tục tiến trình chiếm dụng vi xử lý (ở trạng thái `Running`) để thực thi các chỉ lệnh máy tính như tính toán số học ALU, xử lý logic, biến đổi dữ liệu trong thanh ghi và bộ nhớ cache.
- **I/O Burst**: Khoảng thời gian tiến trình chuyển từ trạng thái `Running` sang trạng thái `Blocked`/`Waiting` để chờ thiết bị ngoại vi hoàn tất tác vụ nhập/xuất (đọc dữ liệu từ ổ cứng SSD, chờ gói tin TCP từ card mạng NIC, hoặc chờ tương tác bàn phím/chuột).
</details>

### Câu Hỏi 2: Vòng đời của hầu hết mọi tiến trình luôn bắt đầu và kết thúc bằng pha nào? Tại sao?

<details>
<summary>Đáp án</summary>

Mọi tiến trình **luôn bắt đầu bằng một CPU Burst** và **luôn kết thúc bằng một CPU Burst cuối cùng (Final CPU Burst)**:
- **Khi bắt đầu**: Tiến trình cần CPU để nạp mã lệnh, thiết lập con trỏ ngăn xếp (Stack Pointer), và khởi tạo các cấu trúc dữ liệu hay biến toàn cục trước khi có thể đưa ra bất kỳ yêu cầu nhập/xuất nào.
- **Khi kết thúc**: Tiến trình cần CPU để dọn dẹp tài nguyên và thực thi lời gọi hệ thống kết thúc (như `exit()`), qua đó ghi nhận mã trạng thái kết thúc (exit code) để tiến trình cha thu thập qua `wait()`.
</details>

### Câu Hỏi 3: Độ dài các CPU Burst trong thực tế tuân theo phân phối nào và điều này có ý nghĩa gì đối với việc thiết kế bộ lập lịch (CPU Scheduler)?

<details>
<summary>Đáp án</summary>

- **Hình dạng phân phối**: Thời lượng các CPU Burst trong thực tế tuân theo quy luật **hàm mũ phân rã (Exponential Decay Distribution)**. Trong đó, đại đa số các CPU Burst có thời lượng cực ngắn (thường **dưới 8 mili-giây**), và chỉ có một tỷ lệ rất nhỏ các burst kéo dài hàng trăm mili-giây đến vài giây (phần đuôi dài - Long Tail).
- **Ý nghĩa lập lịch**: Bộ lập lịch không cần đợi một tiến trình chạy hết toàn bộ vòng đời mà coi **mỗi CPU Burst là một tác vụ con độc lập (independent sub-job)**. Vì đa số tiến trình sẽ nhanh chóng tự nhả CPU để chờ I/O sau vài mili-giây, hệ điều hành có thể ưu tiên các burst ngắn (như trong SJF, Round Robin, MLFQ) để tối ưu hóa thời gian phản hồi (**Response Time**).
</details>

### Câu Hỏi 4: Hãy phân biệt tiến trình CPU-Bound và tiến trình I/O-Bound về đặc điểm burst, ví dụ điển hình và mục tiêu lập lịch?

<details>
<summary>Đáp án</summary>

| Tiêu chí | Tiến trình Hướng CPU (CPU-Bound) | Tiến trình Hướng I/O (I/O-Bound) |
| :--- | :--- | :--- |
| **Đặc điểm CPU Burst** | Ít CPU burst nhưng mỗi burst kéo dài liên tục (hàng trăm mili-giây hoặc hàng giây). | Rất nhiều CPU burst nhưng mỗi burst siêu ngắn (vài micro-giây đến vài mili-giây). |
| **Tần suất I/O** | Rất hiếm khi thực hiện I/O; CPU bận rộn gần như 100%. | Thực hiện I/O liên tục; phần lớn thời gian nằm trong hàng đợi chờ I/O. |
| **Ví dụ điển hình** | Trình nén video `ffmpeg`, trình biên dịch `gcc`, thuật toán băm mật mã, mô phỏng vật lý. | Web server xử lý request, trình soạn thảo (Vim, VSCode), MySQL, giao diện đồ họa GUI. |
| **Mục tiêu lập lịch** | Tối đa hóa thông lượng tính toán (**Throughput**) và giảm chi phí chuyển ngữ cảnh (Context Switch Overhead). | Tối thiểu hóa thời gian phản hồi (**Response Time**) để người dùng không cảm nhận độ trễ. |
</details>

### Câu Hỏi 5: Cơ chế chồng lấn tài nguyên (Overlapping CPU Execution & I/O Wait) giúp hệ điều hành tránh lãng phí CPU như thế nào?

<details>
<summary>Đáp án</summary>

- Nếu không lập lịch theo chu kỳ burst, khi Tiến trình 1 chờ đọc ổ đĩa (I/O Burst), vi xử lý sẽ hoàn toàn nhàn rỗi (**CPU Idle**).
- Với cơ chế chồng lấn hiện đại: Ngay khi Tiến trình 1 phát lệnh I/O (ví dụ system call `read()`) và chuyển sang trạng thái `Blocked`, bộ lập lịch lập tức thu hồi CPU và cấp quyền thực thi cho Tiến trình 2 đang có nhu cầu **CPU Burst**.
- Khi thiết bị I/O đọc xong dữ liệu, nó phát **ngắt phần cứng (I/O Interrupt)** báo về CPU để chuyển Tiến trình 1 sang trạng thái `READY` (sẵn sàng nhận lại CPU ở lần chuyển ngữ cảnh tiếp theo). Nhờ đó CPU và các bộ điều khiển I/O hoạt động **song song đồng thời (overlapped execution)**, đẩy mức sử dụng phần cứng lên gần 100%.
</details>

### Câu Hỏi 6: Trên Linux, ta có thể dùng các lệnh `pidstat` và tệp `/proc/<pid>/schedstat` như thế nào để quan sát đặc tính CPU Burst và I/O Burst của một tiến trình?

<details>
<summary>Đáp án</summary>

- **`pidstat -u -p <PID> 1`**: Đo mức độ sử dụng CPU theo từng giây (`%usr`, `%system`, `%CPU`). Chỉ số `%CPU` chạm gần 100% phản ánh luồng CPU-Bound đang liên tục giữ lõi vi xử lý.
- **`pidstat -d -p <PID> 1`**: Đo mức độ I/O đĩa (`kB_rd/s`, `kB_wr/s`, `iodelay`), trong đó `iodelay` thể hiện thời gian tiến trình bị hoãn lại để chờ khối dữ liệu thực tế được đọc/ghi trên thiết bị lưu trữ.
- **`cat /proc/<PID>/schedstat`**: Tra cứu 3 số liệu thống kê điều phối trực tiếp từ nhân Linux theo thứ tự: `<cpu_run_time_ns>` (tổng thời gian chạy trên CPU), `<runqueue_wait_time_ns>` (thời gian chờ trong hàng đợi runqueue), và `<timeslices_count>` (số lát cắt thời gian đã thực thi).
</details>

### Câu Hỏi 7: Tại sao việc chạy các tác vụ CPU-Bound trực tiếp trên Event Loop đơn luồng (như Node.js hoặc Python AsyncIO) lại là một cạm bẫy nghiêm trọng và cần khắc phục như thế nào?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy**: Kiến trúc non-blocking event loop đơn luồng được tối ưu cho tác vụ **I/O-Bound** (nơi CPU Burst chỉ kéo dài vài micro-giây rồi nhả quyền điều khiển cho `epoll`). Nếu đưa tác vụ **CPU-Bound** kéo dài (mã hóa ảnh, băm `bcrypt` cost cao, xử lý JSON khổng lồ) vào luồng chính, CPU Burst kéo dài sẽ **chặn đứng (block) toàn bộ Event Loop**, khiến mọi yêu cầu I/O khác bị treo cứng trong hàng đợi.
- **Giải pháp**: Tách biệt tác vụ CPU-Bound khỏi luồng chính bằng cách đẩy sang **Worker Threads** riêng biệt (`worker_threads` trong Node.js, `ProcessPoolExecutor` trong Python) hoặc chuyển sang các microservice tính toán chuyên biệt (Go/Rust/C++), để luồng chính chỉ điều phối I/O.
</details>

### Câu Hỏi 8: Khi cấu hình kích thước Thread Pool cho backend, nguyên tắc chọn số lượng luồng cho tác vụ CPU-Bound và I/O-Bound khác nhau ra sao theo công thức Brian Goetz?

<details>
<summary>Đáp án</summary>

- **Với tác vụ CPU-Bound**: Không nên đặt số luồng vượt quá số lõi CPU ($N_{\text{threads}} > N_{\text{CPU}}$) vì không giúp chạy nhanh hơn mà chỉ làm tăng chi phí chuyển ngữ cảnh (Context Switching Overhead) và tràn CPU Cache.
- **Với tác vụ I/O-Bound**: Nếu chỉ đặt số luồng bằng số lõi CPU sẽ gây thiếu tải (**Underutilization**), do các luồng phần lớn thời gian nằm ngủ chờ đĩa hoặc mạng.
- **Công thức Brian Goetz**:
  $$N_{\text{threads}} = N_{\text{CPU}} \times U_{\text{CPU}} \times \left(1 + \frac{W}{C}\right)$$
  Trong đó:
  - $N_{\text{CPU}}$: Số lõi vi xử lý khả dụng.
  - $U_{\text{CPU}}$: Mức độ sử dụng CPU mục tiêu ($0 \le U_{\text{CPU}} \le 1$).
  - $W/C$: Tỷ lệ giữa **Thời gian chờ I/O (Wait time)** và **Thời gian tính toán CPU (Compute time / CPU Burst)**.
</details>
