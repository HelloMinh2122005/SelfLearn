# Review: 1_5_6 Deadlock Detection and Recovery

### Câu Hỏi 1: Triết lý cốt lõi của chiến lược Deadlock Detection and Recovery là gì và nó khác gì so với Deadlock Prevention hay Deadlock Avoidance?

<details>
<summary>Đáp án</summary>

Trong khi Deadlock Prevention (Ngăn ngừa) và Deadlock Avoidance (Né tránh - Banker's Algorithm) can thiệp từ sớm để hệ thống không bao giờ rơi vào trạng thái bế tắc, **Deadlock Detection and Recovery (Phát hiện và Khôi phục)** tiếp cận theo hướng thực dụng gồm 3 bước:
1. **Cho phép Deadlock tự do xảy ra**: Không áp đặt các quy tắc khắt khe làm nghẽn hiệu năng cấp phát tài nguyên tại thời gian chạy (runtime).
2. **Định kỳ quét và phát hiện (Periodic Detection)**: Một tiến trình giám sát chạy ngầm định kỳ hoặc được kích hoạt sau một khoảng thời gian chờ (timeout) để phân tích trạng thái phân bổ tài nguyên nhằm tìm Deadlock.
3. **Thực thi quy trình giải cứu (Recovery Action)**: Khi phát hiện Deadlock, hệ thống chủ động can thiệp bằng cách cưỡng chế hủy tiến trình hoặc thu hồi tài nguyên để phá vỡ chu trình bế tắc.
</details>

### Câu Hỏi 2: Đồ thị chờ đợi (Wait-For Graph - WFG) được xây dựng như thế nào từ Resource Allocation Graph (RAG) và áp dụng cho loại tài nguyên nào?

<details>
<summary>Đáp án</summary>

**Wait-For Graph (WFG)** được chuyển đổi từ đồ thị phân bổ tài nguyên (RAG) cho các hệ thống mà mỗi loại tài nguyên chỉ có **đúng 1 thực thể duy nhất (Single-Instance Resource)**:
- **Đỉnh (Vertices - $V$)**: Tập hợp toàn bộ các tiến trình hoặc giao dịch $\{P_1, P_2, \dots, P_n\}$ đang hoạt động; các đỉnh tài nguyên trung gian bị loại bỏ hoàn toàn.
- **Cạnh có hướng (Directed Edges - $E$)**: Cạnh $P_i \to P_j$ tồn tại nếu và chỉ nếu tiến trình $P_i$ đang bị chặn chờ một tài nguyên mà tiến trình $P_j$ hiện đang chiếm giữ.
- **Định lý cốt lõi**: Với tài nguyên đơn lẻ (Single-instance), Deadlock tồn tại khi và chỉ khi đồ thị WFG chứa ít nhất một chu trình có hướng (Directed Cycle). (Lưu ý: với tài nguyên đa thực thể - Multi-instance, chu trình chỉ là điều kiện cần chứ không phải điều kiện đủ).
</details>

### Câu Hỏi 3: Thuật toán nào được dùng để phát hiện chu trình trong Wait-For Graph (WFG), độ phức tạp ra sao và dấu hiệu nào khẳng định Deadlock?

<details>
<summary>Đáp án</summary>

Bộ phát hiện Deadlock sử dụng thuật toán duyệt đồ thị **Tìm kiếm theo chiều sâu (Depth-First Search - DFS)** với ba trạng thái đánh dấu đỉnh:
- **Trắng**: Chưa duyệt.
- **Xám**: Đang nằm trên ngăn xếp đệ quy duyệt.
- **Đen**: Đã duyệt xong.

- **Độ phức tạp tính toán**: Thời gian $O(V + E)$, với $V$ là số lượng tiến trình và $E$ là số lượng mối quan hệ phụ thuộc chờ đợi.
- **Dấu hiệu khẳng định Deadlock**: Nếu quá trình duyệt DFS gặp lại một đỉnh đang ở trạng thái **Xám** (Back-edge), một chu trình khép kín được xác nhận và Deadlock đã xảy ra.
</details>

### Câu Hỏi 4: Trong chiến lược Hủy tiến trình (Process Termination) để khôi phục Deadlock, có những cách tiếp cận nào và hệ thống dựa vào các tiêu chí nào để chọn tiến trình nạn nhân (Victim Selection)?

<details>
<summary>Đáp án</summary>

Có 2 cách tiếp cận khi hủy tiến trình:
1. **Hủy toàn bộ (Abort All Deadlocked Processes)**: Giải phóng ngay lập tức mọi tài nguyên nhưng tốn kém nhất vì vứt bỏ toàn bộ kết quả tính toán của mọi tiến trình liên quan.
2. **Hủy từng tiến trình một (Abort One Process at a Time)**: Chọn một tiến trình làm "vật tế thần" (Victim Selection), tiêu diệt nó, rồi chạy lại thuật toán WFG và lặp lại cho đến khi đồ thị sạch chu trình.

**Các tiêu chí lựa chọn nạn nhân (Victim Selection Metrics)**:
1. **Độ ưu tiên (Priority)**: Tiến trình có mức ưu tiên thấp nhất bị hủy trước.
2. **Thời gian tính toán đã tiêu tốn**: Ưu tiên giữ lại tiến trình đã chạy lâu và sắp hoàn tất; chọn tiến trình vừa mới bắt đầu chạy để giảm thiểu lãng phí tính toán.
3. **Số lượng và loại tài nguyên đang giữ**: Chọn tiến trình đang giữ ít tài nguyên nhất hoặc đang giữ tài nguyên dễ cấp phát lại nhất.
</details>

### Câu Hỏi 5: Chiến lược Thu hồi tài nguyên & Hoàn nguyên (Resource Preemption & Rollback) hoạt động như thế nào và làm sao để phòng chống Starvation (đói tài nguyên vĩnh viễn)?

<details>
<summary>Đáp án</summary>

- **Cơ chế hoạt động**: Thay vì tiêu diệt tiến trình, hệ thống cưỡng bức tước đoạt tài nguyên từ tiến trình nạn nhân để trao cho tiến trình khác trong chu trình.
- **Yêu cầu Checkpoint & Rollback**: Tiến trình bị tước tài nguyên phải được khôi phục trạng thái về điểm kiểm tra (**Checkpoint**) an toàn gần nhất trước thời điểm nó yêu cầu tài nguyên đó.
- **Phòng chống Starvation**: Nếu chỉ dựa vào chi phí thấp nhất, một tiến trình "nhẹ cân" có thể liên tục bị chọn làm nạn nhân và rollback mãi không thể hoàn thành. Hệ thống giải quyết bằng cách gắn một **Bộ đếm số lần Rollback (Rollback Counter)**; tiến trình nào bị rollback vượt quá ngưỡng quy định sẽ được tăng độ ưu tiên tạm thời để thoát khỏi danh sách nạn nhân.
</details>

### Câu Hỏi 6: Thuật toán Đà điểu (The Ostrich Algorithm) là gì và tại sao các hệ điều hành lớn như Linux, macOS, Windows lại áp dụng nó cho tài nguyên hạt nhân và bộ nhớ thông thường?

<details>
<summary>Đáp án</summary>

**The Ostrich Algorithm (Thuật toán Đà điểu)** là chiến lược hoàn toàn **bỏ qua Deadlock** (ví như đà điểu vùi đầu vào cát), không thực hiện phát hiện hay né tránh Deadlock cho các tài nguyên hạt nhân và cấp phát bộ nhớ thông thường.

Các hệ điều hành lớn chọn chiến lược này vì 3 lý do thực tế:
1. **Tần suất xảy ra cực thấp**: Ở cấp độ phân bổ bộ nhớ hệ điều hành, Deadlock giữa các tiến trình hệ thống xảy ra rất hiếm.
2. **Chi phí đánh đổi quá lớn**: Một OS phục vụ hàng trăm ngàn lời gọi cấp phát bộ nhớ (`malloc`, `mmap`, `brk`, cấp phát Page Frame) mỗi giây. Nếu mỗi lần đều cập nhật ma trận, dựng WFG và chạy DFS hay Banker's Algorithm, năng lực CPU sẽ bị suy giảm từ **50% đến 90%** chỉ cho việc kiểm tra.
3. **Đánh đổi thực tế (Engineering Trade-off)**: Chấp nhận xác suất rất hiếm có ứng dụng bị treo (để người dùng tự xử lý bằng Task Manager hoặc `kill -9`) thay vì làm toàn bộ máy tính chạy chậm đi trong 100% thời gian hoạt động.
</details>

### Câu Hỏi 7: Cơ sở dữ liệu quan hệ (như PostgreSQL và MySQL InnoDB) xử lý Deadlock khác gì so với hệ điều hành đa dụng, và tiêu chí chọn Victim trong MySQL InnoDB là gì?

<details>
<summary>Đáp án</summary>

Khác với hệ điều hành (dùng Ostrich Algorithm), các hệ quản trị CSDL như **PostgreSQL** và **MySQL (InnoDB)** **bắt buộc phải có cơ chế Deadlock Detection & Recovery tự động**, vì hàng triệu giao dịch cập nhật khóa dòng (Row-level Locks) đan xen liên tục; nếu không tự phát hiện và xử lý sẽ làm khóa cứng các bảng quan trọng, vi phạm tính toàn vẹn **ACID** và tính sẵn sàng của dữ liệu.

- **Cơ chế kích hoạt**: Dựa trên bộ đếm thời gian chờ khóa (`deadlock_timeout`, `lock_wait_timeout`).
- **Hình thức xử lý**: Tự động chọn 1 Transaction làm Victim để thực hiện `ROLLBACK` và giải phóng khóa cho Transaction còn lại tiếp tục.
- **Tiêu chí chọn Victim của MySQL InnoDB**: Áp dụng tiêu chuẩn tối thiểu hóa chi phí (Cost Metric) — so sánh số lượng dòng dữ liệu đã bị `INSERT`, `UPDATE`, hoặc `DELETE`; Transaction nào làm thay đổi **ít dòng dữ liệu hơn (nhẹ hơn)** sẽ bị chọn để `ROLLBACK` nhằm giảm thiểu công việc hoàn nguyên từ undo log.
</details>

### Câu Hỏi 8: Tham số `deadlock_timeout` trong PostgreSQL hoạt động như thế nào và cần lưu ý gì khi cấu hình tham số này trong môi trường sản xuất?

<details>
<summary>Đáp án</summary>

- **Cách hoạt động**: Khi một transaction xin khóa nhưng bị chặn và phải vào hàng đợi chờ, PostgreSQL bắt đầu đếm thời gian `deadlock_timeout` (mặc định là **`1s`**). Sau khoảng thời gian này, Deadlock Detector Thread sẽ quét Lock Wait Queue, dựng WFG để tìm chu trình và gửi tín hiệu `ABORT / ROLLBACK` cho một transaction nạn nhân (báo lỗi `ERROR: deadlock detected`).
- **Cạm bẫy cấu hình**:
  - Đặt **quá nhỏ** (ví dụ `10ms`): Chi phí chạy thuật toán kiểm tra chu trình trên hàng ngàn khóa hàng đợi sẽ làm nghẽn CPU của Database Server.
  - Đặt **quá lớn** (ví dụ `60s`): Các ứng dụng backend phía trên bị dồn ứ kết nối (**Connection Pool Exhaustion**) suốt cả phút trước khi giao dịch được giải phóng.
- **Thực tiễn sản xuất**: Giữ mặc định `1s` hoặc tinh chỉnh trong khoảng **`500ms` đến `2s`**. (Với MySQL InnoDB, đảm bảo cờ `innodb_deadlock_detect = ON` luôn bật trừ trường hợp có hàng ngàn luồng tranh chấp cực đoan trên cùng một dòng).
</details>

### Câu Hỏi 9: Khi một ứng dụng C/C++ đa luồng trên Linux bị treo cứng do Deadlock trong User Space, các kỹ sư dùng công cụ CLI nào để chẩn đoán và dấu hiệu nhận biết là gì?

<details>
<summary>Đáp án</summary>

Kỹ sư hệ thống sử dụng các thông tin từ `/proc` và trình gỡ lỗi `gdb`:
1. Tìm Process ID (PID) của tiến trình bị treo (ví dụ `pgrep -f <tên_chương_trình>`).
2. Kiểm tra trạng thái các luồng với `ps -p $PID -L -o pid,tid,stat,time,comm` (thấy các luồng ở trạng thái `Sl+` - Interruptible Sleep, luồng con đang ngủ).
3. Đính kèm GDB không tương tác để in stack backtrace của toàn bộ luồng:
   `sudo gdb -batch -ex "thread apply all bt" -p $PID`
- **Dấu hiệu nhận biết**: Các luồng bị kẹt tại hàm thư viện `__pthread_mutex_lock_wait` và system call hạt nhân `futex`, trong đó các luồng đang chờ lẫn nhau trên các địa chỉ mutex lock khác nhau (ví dụ Thread 3 chờ `lock2` trong khi Thread 2 chờ `lock1`).
</details>

### Câu Hỏi 10: Quan niệm cho rằng OOM Killer của nhân Linux là cơ chế Deadlock Recovery có đúng không? Bản chất thực sự của OOM Killer là gì?

<details>
<summary>Đáp án</summary>

Quan niệm đó là **sai**. **OOM Killer (Out-Of-Memory Killer)** hoàn toàn không liên quan đến Deadlock:
- **Bản chất của OOM Killer**: Chỉ được kích hoạt khi dung lượng RAM vật lý và Swap của máy chủ bị cạn kiệt 100%. Khi đó, nhân Linux tính điểm `oom_score` và tiêu diệt tiến trình ngốn nhiều RAM nhất để cứu hệ điều hành.
- **Đối với Deadlock thuần túy**: Các tiến trình bị Deadlock thường chiếm 0% CPU và không tiêu tốn thêm RAM, nên Linux hoàn toàn không can thiệp (áp dụng Thuật toán Đà điểu - Ostrich Algorithm).
</details>
