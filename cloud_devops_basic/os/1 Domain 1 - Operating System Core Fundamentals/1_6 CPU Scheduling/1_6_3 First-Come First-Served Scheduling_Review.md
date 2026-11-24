# Review: 1_6_3 First-Come First-Served Scheduling

### Câu Hỏi 1: Cơ chế hàng đợi FIFO trong thuật toán lập lịch FCFS hoạt động như thế nào khi một tiến trình chuyển sang trạng thái `Ready`?

<details>
<summary>Đáp án</summary>

Thuật toán **First-Come, First-Served (FCFS)** (còn gọi là **First-In, First-Out - FIFO**) sử dụng cơ chế hàng đợi sẵn sàng (Ready Queue):
- Khi một tiến trình chuyển sang trạng thái `Ready`, Khối Điều Khiển Tiến Trình (**Process Control Block - PCB**) của nó được nối vào **đuôi** của Ready Queue.
- Bộ điều phối (**Scheduler**) luôn lấy tiến trình đang đứng ở **đầu hàng đợi (Head of Queue)** để trao quyền kiểm soát CPU.

</details>

### Câu Hỏi 2: Tính chất Không Chiếm Quyền (Non-Preemptive) của FCFS có nghĩa là gì, và một tiến trình đang chạy chỉ rời khỏi CPU trong những trường hợp nào?

<details>
<summary>Đáp án</summary>

Tính chất **Không Chiếm Quyền (Non-Preemptive / phi tước đoạt)** có nghĩa là một khi CPU đã được cấp phát cho một tiến trình, hệ điều hành **không bao giờ ngắt ngang** tiến trình đó để nhường quyền cho tiến trình khác.

Tiến trình sẽ giữ chặt CPU cho đến khi tự nguyện từ bỏ quyền thực thi trong một trong hai trường hợp:
1. Hoàn tất toàn bộ công việc và gọi lời gọi hệ thống kết thúc (`exit()`).
2. Phát sinh yêu cầu I/O (khi đó tiến trình chuyển sang trạng thái `Blocked`).

</details>

### Câu Hỏi 3: Ba thước đo hiệu năng lập lịch CPU được nêu trong bài học là gì, và công thức tính của từng thước đo ra sao?

<details>
<summary>Đáp án</summary>

Theo giáo trình OSTEP (Chương 7, Mục 7.2) được trích dẫn trong bài học, có 3 thước đo hiệu năng chuẩn mực:
1. **Thời Gian Hoàn Thành (Turnaround Time - $T_{\text{turnaround}}$)**: Khoảng thời gian từ lúc tiến trình xuất hiện trong hệ thống (Arrival Time) đến khi hoàn tất trọn vẹn (Completion Time):
   $$T_{\text{turnaround}} = T_{\text{completion}} - T_{\text{arrival}}$$
2. **Thời Gian Chờ Đợi (Waiting Time - $T_{\text{waiting}}$)**: Tổng thời gian tiến trình phải nằm chờ thụ động trong Ready Queue mà không được cấp phát CPU:
   $$T_{\text{waiting}} = T_{\text{turnaround}} - T_{\text{burst}}$$
3. **Thời Gian Phản Hồi (Response Time - $T_{\text{response}}$)**: Khoảng thời gian từ lúc tiến trình xuất hiện cho đến lần đầu tiên nó được cấp CPU để bắt đầu phản hồi:
   $$T_{\text{response}} = T_{\text{first\_run}} - T_{\text{arrival}}$$

</details>

### Câu Hỏi 4: Hiệu ứng Đoàn Tàu (Convoy Effect) trong lập lịch FCFS là gì?

<details>
<summary>Đáp án</summary>

**Hiệu Ứng Đoàn Tàu (Convoy Effect)** là hiện tượng một tiến trình tiêu tốn CPU khổng lồ (tiến trình **CPU-Bound / Heavyweight Process**) chiếm giữ CPU quá lâu, buộc toàn bộ các tiến trình ngắn hơn đứng sau (thường là các tiến trình hướng nhập/xuất **I/O-Bound**) phải xếp hàng chờ đợi kéo dài.

Tình trạng này làm **thời gian chờ trung bình tăng vọt**: các tiến trình chỉ cần lượng thời gian CPU rất nhỏ để tương tác vẫn phải chờ rất lâu phía sau một tiến trình tính toán nặng.

</details>

### Câu Hỏi 5: Ngoài việc làm tăng thời gian chờ trung bình, Convoy Effect gây ra hậu quả gì đối với các thiết bị ngoại vi I/O?

<details>
<summary>Đáp án</summary>

Convoy Effect gây **lãng phí thiết bị ngoại vi (Low Device Utilization / Device Underutilization)**:
- Trong lúc tiến trình CPU-Bound đang chiếm giữ CPU, các tiến trình I/O-Bound bị kẹt cứng trong Ready Queue nên không thể chạy CPU burst ngắn để phát lệnh I/O. Kết quả là các thiết bị I/O (như ổ đĩa SSD, card mạng NIC) rơi vào trạng thái **hoàn toàn nhàn rỗi (Idle)**.
- Khi tiến trình CPU-Bound cuối cùng chuyển sang I/O, toàn bộ các tiến trình ngắn đồng loạt ùa vào CPU trong tích tắc rồi lại đồng loạt ùa ra tranh giành I/O, gây mất cân bằng luân phiên nghiêm trọng giữa CPU và thiết bị ngoại vi.

</details>

### Câu Hỏi 6: Bài toán đối chiếu giữa thứ tự $P_1(24\text{ ms}) \to P_2(3\text{ ms}) \to P_3(3\text{ ms})$ và $P_2 \to P_3 \to P_1$ (cùng đến tại $T_{\text{arrival}} = 0$) chứng minh điều gì về thuật toán FCFS?

<details>
<summary>Đáp án</summary>

Bài toán chứng minh rằng **FCFS cực kỳ nhạy cảm và phụ thuộc hoàn toàn vào thứ tự tiến trình đến ban đầu**:
- **Trường hợp A ($P_1 \to P_2 \to P_3$)**: $P_2$ phải chờ $24\text{ ms}$, $P_3$ phải chờ $27\text{ ms}$. Thời gian chờ trung bình là **$17.0\text{ ms}$** và thời gian hoàn thành trung bình là **$27.0\text{ ms}$**.
- **Trường hợp B ($P_2 \to P_3 \to P_1$)**: Các tiến trình ngắn chạy trước nên $P_2$ chờ $0\text{ ms}$, $P_3$ chờ $3\text{ ms}$, $P_1$ chờ $6\text{ ms}$. Thời gian chờ trung bình giảm xuống còn **$3.0\text{ ms}$** (nhanh hơn gần 6 lần) và thời gian hoàn thành trung bình giảm xuống còn **$13.0\text{ ms}$**.

</details>

### Câu Hỏi 7: Trong mô phỏng FCFS, nếu tại thời điểm hiện tại CPU đang rảnh nhưng tiến trình tiếp theo chưa đến (`current_time < arrival_time`), hệ thống xử lý thế nào?

<details>
<summary>Đáp án</summary>

Khi `current_time < proc[i].arrival_time`, CPU sẽ ở trạng thái **nhàn rỗi (`IDLE`)** trong khoảng thời gian từ `current_time` đến `proc[i].arrival_time`.

Sau đó, đồng hồ thời gian hiện tại (`current_time`) được cập nhật lên bằng `proc[i].arrival_time`, và tiến trình `proc[i]` mới bắt đầu thực thi trên CPU trong khoảng thời lượng `burst_time` của nó.

</details>

### Câu Hỏi 8: Hiện tượng Head-of-Line (HoL) Blocking trong Message Queues & Microservices tương đồng với Convoy Effect như thế nào, và có những biện pháp khắc phục nào?

<details>
<summary>Đáp án</summary>

- **Sự tương đồng**: Trong các Message Broker vận hành theo cơ chế FCFS nghiêm ngặt (như RabbitMQ, AWS SQS FIFO, Kafka Partition), nếu một tác vụ độc hại hoặc quá nặng (**Poison Message / Heavy Batch Task**) nằm ở đầu hàng đợi (Head of Line) và mất nhiều thời gian xử lý hoặc liên tục retry, toàn bộ hàng triệu thông điệp nhẹ phía sau sẽ bị **chặn đứng hoàn toàn (Head-of-Line Blocking)** — giống hệt hiện tượng Convoy Effect trên CPU.
- **Hai biện pháp chuẩn mực (Best Practices)**:
  1. **Tách hàng đợi**: Phân tách các tác vụ thành nhiều hàng đợi theo độ ưu tiên và thời lượng dự kiến (ví dụ: `fast-lane-queue` cho tác vụ nhẹ và `batch-lane-queue` cho tác vụ nặng).
  2. **Thiết lập Dead-Letter Queue (DLQ)**: Tự động cô lập các tin nhắn lỗi hoặc quá hạn sau $N$ lần thử thất bại để giải phóng đầu hàng đợi.

</details>

### Câu Hỏi 9: Tại sao không bao giờ sử dụng thuần thuật toán FCFS cho các ứng dụng tương tác hiện đại?

<details>
<summary>Đáp án</summary>

Vì FCFS **hoàn toàn không hỗ trợ cơ chế chiếm quyền (Preemption)** dựa trên ngắt thời gian (**Timer Interrupt**):
- Nếu một ứng dụng người dùng rơi vào vòng lặp vô tận `while(1);` (Infinite Loop), tiến trình đó sẽ độc chiếm CPU vĩnh viễn và làm tê liệt toàn bộ hệ thống.
- Ngoài ra, với các hệ thống đòi hỏi thời gian phản hồi thấp (Response Time thấp), một tiến trình nền chạy lâu sẽ làm đóng băng hoàn toàn các thao tác tương tác của người dùng cho đến khi tiến trình nền kết thúc.

</details>

### Câu Hỏi 10: Trong thực tế hiện nay, thuật toán FCFS thường được áp dụng trong những ngữ cảnh nào?

<details>
<summary>Đáp án</summary>

Trong thực tế, FCFS được sử dụng trong hai phạm vi chính:
1. **Làm thuật toán thứ cấp (cấp 2) bên trong một mức ưu tiên đơn lẻ** của các bộ lập lịch phức tạp hơn (ví dụ: các tác vụ có cùng mức ưu tiên trong Round Robin sẽ được xếp hàng theo FCFS).
2. **Trong các hệ thống tính toán lô / siêu máy tính (Batch Computing / High-Performance Supercomputing)** như **SLURM** hoặc **PBS**, nơi các bài toán khoa học chạy tuần tự từ đầu đến cuối mà không cần tương tác người dùng.

</details>
