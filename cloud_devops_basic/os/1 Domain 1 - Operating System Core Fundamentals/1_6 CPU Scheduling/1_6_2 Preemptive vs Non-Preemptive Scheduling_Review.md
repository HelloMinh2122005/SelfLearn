# Review: 1_6_2 Preemptive vs Non-Preemptive Scheduling

### Câu Hỏi 1: Sự khác biệt cốt lõi giữa điều phối không chiếm dụng (Non-Preemptive / Cooperative Scheduling) và điều phối chiếm dụng (Preemptive Scheduling) là gì?

<details>
<summary>Đáp án</summary>

- **Non-Preemptive (Cooperative) Scheduling**: Tiến trình giữ quyền sử dụng CPU cho đến khi nó tự nguyện từ bỏ (thông qua `exit()`, yêu cầu I/O hoặc chủ động nhường CPU). Hệ điều hành không thể can thiệp để tước quyền CPU giữa chừng. Cơ chế này phụ thuộc vào "sự tử tế" của mã nguồn và từng được dùng trong các hệ điều hành cũ như Windows 3.1, Mac OS 9.
- **Preemptive Scheduling**: Hệ điều hành giữ quyền kiểm soát tối thượng và có quyền ngắt ngang tiến trình đang chạy (thường được kích hoạt bởi Ngắt đồng hồ phần cứng - Hardware Timer Interrupt) để thu hồi và phân bổ lại CPU. Cơ chế này giúp đảm bảo công bằng và tính phản hồi, được sử dụng trong các hệ điều hành hiện đại như Linux và Windows NT.
</details>

### Câu Hỏi 2: Theo lý thuyết hệ điều hành (Silberschatz §5.1.3), quyết định điều phối CPU có thể diễn ra tại 4 thời điểm chuyển trạng thái nào của tiến trình, và quy tắc phân loại Non-Preemptive vs Preemptive dựa trên 4 thời điểm đó là gì?

<details>
<summary>Đáp án</summary>

Bốn thời điểm ra quyết định điều phối gồm:
1. **Từ `Running` sang `Waiting`**: Tiến trình phát sinh yêu cầu I/O hoặc gọi hàm chờ (`wait()`, `sleep()`). Đây là **Non-preemptive** vì tiến trình tự nguyện rời CPU.
2. **Từ `Running` sang `Ready`**: Xuất hiện ngắt phần cứng (như Timer Interrupt báo hết Time Slice) hoặc có tiến trình độ ưu tiên cao hơn thức dậy. Đây là **Preemptive**.
3. **Từ `Waiting` sang `Ready`**: Thao tác I/O hoàn tất hoặc sự kiện chờ đợi đã xảy ra; nếu tiến trình mới sẵn sàng này có độ ưu tiên cao hơn tiến trình đang chạy, bộ điều phối có thể ngắt ngay tiến trình hiện tại. Đây là **Preemptive**.
4. **Khi tiến trình kết thúc (`Terminated`)**: Tiến trình hoàn thành khối lệnh hoặc gọi `exit()`. Đây là **Non-preemptive**.

**Định lý phân loại**:
- Nếu hệ thống chỉ điều phối tại **thời điểm 1 và 4**, đó là mô hình **Non-preemptive (Cooperative)**.
- Nếu hệ thống thực hiện điều phối tại **thời điểm 2 hoặc 3**, đó là mô hình **Preemptive**.
</details>

### Câu Hỏi 3: Trong mô hình Non-Preemptive (Cooperative) Scheduling, tiến trình có thể nhượng quyền sử dụng CPU bằng những cách nào và hạn chế trí mạng của mô hình này là gì?

<details>
<summary>Đáp án</summary>

**Ba cách thức tiến trình tự nguyện nhượng CPU**:
1. Gọi lệnh kết thúc chương trình (`exit()`).
2. Bị chặn bởi thao tác vào/ra I/O hoặc đồng bộ hóa khóa.
3. Chủ động nhường CPU thông qua lời gọi hàm hệ thống chuyên dụng như `sched_yield(2)` trong chuẩn POSIX.

**Hạn chế trí mạng**: Hệ thống hoàn toàn phụ thuộc vào sự đúng đắn của lập trình viên. Nếu một tiến trình rơi vào lỗi vòng lặp vô hạn không có I/O (`while(1) { /* không I/O */ }`), toàn bộ máy tính sẽ bị "đóng băng" vĩnh viễn, người dùng thậm chí không thể di chuột hay bấm bàn phím để tắt ứng dụng.
</details>

### Câu Hỏi 4: Chu trình ngắt chiếm dụng (Preemption Cycle) sử dụng Hardware Timer Interrupt diễn ra theo các bước nào?

<details>
<summary>Đáp án</summary>

Chu trình xử lý ngắt chiếm dụng diễn ra theo trình tự:
1. Trong khi tiến trình đang chạy mã lệnh ở User Mode (Ring 3), bộ đếm thời gian phần cứng (Hardware Timer) phát tín hiệu ngắt đồng hồ (Timer Interrupt / IRQ 0) sau mỗi khoảng thời gian cố định.
2. Phần cứng CPU tạm dừng tiến trình người dùng, lưu các User Registers, chuyển Mode Bit từ Ring 3 sang Ring 0 (Kernel Mode) và nhảy vào trình xử lý ngắt (Timer Interrupt Handler) của hệ điều hành.
3. Bộ lập lịch (Scheduler) kiểm tra biến đếm lát cắt thời gian (Time Slice / Quantum) của tiến trình hiện tại.
4. Nếu đã hết định mức thời gian, bộ điều phối lưu toàn bộ trạng thái thanh ghi còn lại của tiến trình cũ vào **Process Control Block (PCB)**, thực hiện **Chuyển ngữ cảnh (Context Switch)** bằng cách nạp trạng thái thanh ghi từ PCB của tiến trình tiếp theo trong hàng đợi `Ready`, rồi chuyển lại về User Mode (Ring 3) để tiến trình mới bắt đầu thực thi.
</details>

### Câu Hỏi 5: Cơ chế điều phối Preemptive mang lại hai ưu điểm quan trọng nào so với Non-Preemptive?

<details>
<summary>Đáp án</summary>

1. **Bảo vệ hệ thống**: Một tiến trình bị lỗi vòng lặp vô hạn chỉ làm tiêu tốn phần quota thời gian (Time Slice) của chính nó, không thể làm tê liệt toàn bộ hệ thống vì hệ điều hành sẽ luôn ngắt để thu hồi CPU.
2. **Đảm bảo tính phản hồi (Responsiveness)**: Các tác vụ tương tác giao diện người dùng (UI, di chuột, bàn phím) luôn được ưu tiên chen ngang để phản hồi tức thì thay vì phải chờ tiến trình tính toán nặng tự dừng.
</details>

### Câu Hỏi 6: Phép so sánh "Xe buýt liên tỉnh không dừng" và "Taxi có đồng hồ tính giờ định kỳ" trong bài học minh họa bản chất của hai cơ chế điều phối như thế nào?

<details>
<summary>Đáp án</summary>

- **Xe buýt liên tỉnh không dừng (Non-Preemptive)**: Bác tài chỉ dừng xe khi tới bến cuối (`exit()`), xe hết xăng/hỏng giữa đường (`I/O Block`), hoặc khách tự xin xuống (`sched_yield`). Nếu có hành khách ngồi lì trên ghế không chịu xuống, những người chờ ở trạm sau sẽ không bao giờ được lên xe.
- **Taxi có đồng hồ tính giờ định kỳ (Preemptive)**: Mỗi khách chỉ được đi tối đa một khoảng thời gian cố định (ví dụ 15 phút). Khi hết giờ, đồng hồ báo thức phần cứng (Timer Interrupt) kêu lên, tài xế mời khách xuống trạm để đón người khác và khách cũ quay lại cuối hàng đợi nếu cần đi tiếp. Nhờ đó, mọi người đều được di chuyển từng chặng và không ai bị bỏ quên.
</details>

### Câu Hỏi 7: Lời gọi hệ thống `sched_yield(2)` trong POSIX dùng để làm gì và ảnh hưởng thế nào đến luồng đang thực thi?

<details>
<summary>Đáp án</summary>

`sched_yield(2)` là lời gọi hệ thống chuẩn POSIX cho phép một luồng hoặc tiến trình chủ động tự nguyện nhường CPU theo cơ chế hợp tác (Non-Preemptive Cooperative Yield). Khi gọi `sched_yield()`, luồng hiện tại sẽ tự động được đưa về cuối hàng đợi của mức độ ưu tiên tương ứng để nhường quyền thực thi cho các luồng khác đang chờ.
</details>

### Câu Hỏi 8: Khi quan sát tiến trình trên Linux bằng lệnh `pidstat -w` hoặc đọc `/proc/<PID>/status`, hai chỉ số `cswch/s` và `nvcswch/s` cho biết điều gì?

<details>
<summary>Đáp án</summary>

- **`cswch/s` (`voluntary_ctxt_switches`) — Voluntary Context Switches**: Số lần chuyển ngữ cảnh **tự nguyện** mỗi giây (tương ứng với Non-Preemptive), xảy ra khi tiến trình tự nhả CPU để chờ I/O, chờ tài nguyên/khóa mutex, hoặc chủ động gọi `sched_yield()`.
- **`nvcswch/s` (`nonvoluntary_ctxt_switches`) — Non-voluntary / Involuntary Context Switches**: Số lần chuyển ngữ cảnh **cưỡng chế / chiếm dụng** mỗi giây (tương ứng với Preemptive), xảy ra khi tiến trình chạy hết lát cắt thời gian (Time Slice) hoặc bị tiến trình có độ ưu tiên cao hơn cướp CPU.
</details>

### Câu Hỏi 9: Vì sao mô hình Preemptive Scheduling dễ phát sinh lỗi tranh chấp dữ liệu (Concurrency Bugs / Race Condition) hơn Non-Preemptive và cần giải pháp gì để phòng tránh?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Trong mô hình Non-Preemptive, một tiến trình có thể cập nhật cấu trúc dữ liệu (như danh sách liên kết) mà không sợ bị luồng khác xen ngang miễn là nó không tự gọi I/O trong lúc đó. Ngược lại, trong mô hình Preemptive, ngắt đồng hồ có thể xảy ra tại bất kỳ chu kỳ lệnh máy nào, kể cả khi tiến trình đang ghi dở nửa con trỏ bộ nhớ, dẫn đến hỏng dữ liệu vĩnh viễn (Race Condition).
- **Giải pháp**: Lập trình viên bắt buộc phải sử dụng các cơ chế đồng bộ hóa phù hợp như **Mutex** hoặc **Spinlock** để bảo vệ vùng dữ liệu dùng chung.
</details>

### Câu Hỏi 10: Khái niệm Chiếm dụng nhân hệ điều hành (Kernel Preemption - `CONFIG_PREEMPT`) trên Linux hiện đại khác gì so với Unix cổ điển và mang lại lợi ích gì?

<details>
<summary>Đáp án</summary>

- **Unix cổ điển (Non-preemptive Kernel)**: Mã nguồn thực thi trong Kernel Mode (khi tiến trình gọi system call) là bất khả xâm phạm; không tiến trình nào được phép cướp CPU cho tới khi system call hoàn tất hoặc tiến trình tự ngủ.
- **Linux hiện đại (`CONFIG_PREEMPT`)**: Cho phép một tác vụ có độ ưu tiên cao (Real-Time task) **chiếm dụng CPU ngay cả khi CPU đang chạy mã hạt nhân**, ngoại trừ các đoạn mã đang giữ `spinlock`.
- **Lợi ích**: Giảm mạnh độ trễ đáp ứng (Latency) của hệ điều hành từ vài miligiây xuống dưới 50 microgiây, rất quan trọng đối với các hệ thống viễn thông và robot tự hành.
</details>
