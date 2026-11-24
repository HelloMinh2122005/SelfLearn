# Review: 1_6_7 Multilevel Feedback Queue

### Câu Hỏi 1: Thuật toán MLFQ ra đời để giải quyết xung đột giữa hai mục tiêu hiệu năng nào, trong điều kiện thực tế gì và do ai phát minh?

<details>
<summary>Đáp án</summary>

- **Hai mục tiêu hiệu năng xung đột**:
  1. **Tối ưu hóa Turnaround Time (Thời gian hoàn thành)**: Cần ưu tiên các tác vụ ngắn chạy trước (giống Shortest Job First - SJF hoặc STCF).
  2. **Tối ưu hóa Response Time (Thời gian phản hồi)**: Cần chia nhỏ lát cắt thời gian CPU đều đặn cho mọi tiến trình (giống Round Robin - RR) để đảm bảo tính tương tác mượt mà.
- **Điều kiện thực tế**: Hệ điều hành hoàn toàn **không thể biết trước độ dài CPU burst tương lai** của bất kỳ tiến trình nào.
- **Nguồn gốc**: Thuật toán **Multi-Level Feedback Queue (MLFQ)** được nhà khoa học máy tính **Fernando J. Corbató** phát minh vào năm 1962 cho hệ thống chia sẻ thời gian **CTSS** (công trình mang lại cho ông giải thưởng Turing Award năm 1990).
</details>

### Câu Hỏi 2: Triết lý "học hỏi từ quá khứ" của MLFQ phân loại tiến trình dựa trên hành vi thực thi như thế nào?

<details>
<summary>Đáp án</summary>

MLFQ không yêu cầu tiến trình khai báo trước thời lượng chạy mà quan sát hành vi quá khứ qua 3 nguyên tắc:
1. **Tiến trình mới đến**: Mặc định được coi là tác vụ ngắn tương tác, nên được đưa vào hàng đợi ưu tiên cao nhất ($Q_{\text{top}}$ / $Q_2$) với Time Quantum ngắn.
2. **Nếu tiến trình ngốn hết Time Quantum / Time Allotment**: Nó tự bộc lộ là tác vụ tính toán nặng (CPU-Bound) và bị **giáng cấp (Demote)** xuống hàng đợi ưu tiên thấp hơn.
3. **Nếu tiến trình nhả CPU sớm để làm I/O**: Nó thể hiện đặc tính của tác vụ tương tác và được **giữ nguyên ở hàng đợi ưu tiên cao** để duy trì tốc độ phản hồi nhanh.
</details>

### Câu Hỏi 3: Quy tắc 1 (Rule 1) và Quy tắc 2 (Rule 2) trong 5 quy tắc chuẩn mực của MLFQ quy định cách chọn tiến trình chạy CPU như thế nào?

<details>
<summary>Đáp án</summary>

Theo giáo trình chuẩn mực OSTEP:
- **Quy tắc 1 (Rule 1)**: Nếu $\text{Priority}(A) > \text{Priority}(B)$, tiến trình $A$ được chạy CPU ($B$ không được chạy).
- **Quy tắc 2 (Rule 2)**: Nếu $\text{Priority}(A) = \text{Priority}(B)$ (cùng nằm trong một hàng đợi), $A$ và $B$ cùng chạy chia sẻ thời gian theo thuật toán **Round Robin (RR)** sử dụng **Time Quantum** của hàng đợi đó.
</details>

### Câu Hỏi 4: Theo Quy tắc 3 (Rule 3), một tiến trình mới bước vào hệ thống được đặt vào đâu và vì sao?

<details>
<summary>Đáp án</summary>

- **Vị trí ban đầu**: Khi một tiến trình mới bước vào hệ thống, nó luôn được đặt vào **hàng đợi có mức ưu tiên cao nhất (Topmost Queue)**.
- **Lý do**: Đây là giả định lạc quan ban đầu của MLFQ rằng mọi tiến trình mới đều có thể là tác vụ ngắn, cần tương tác nhanh. Nếu đúng như vậy, nó sẽ được chạy và hoàn tất ngay với Response Time thấp; nếu không phải, nó sẽ tự bị giáng cấp dần ở các bước sau.
</details>

### Câu Hỏi 5: Quy tắc 4 (Rule 4 - Anti-Gaming) giải quyết lỗ hổng gian lận nào của phiên bản MLFQ thô sơ bằng cơ chế gì?

<details>
<summary>Đáp án</summary>

- **Lỗ hổng ban đầu**: Nếu quy tắc giáng cấp chỉ kiểm tra xem tiến trình có dùng hết 1 Time Quantum liên tiếp hay không, một tiến trình tinh vi có thể chạy tính toán đến 99% thời lượng quantum rồi phát ra một lệnh I/O giả (**dummy I/O**) để tự nguyện nhả CPU. Hệ thống sẽ tưởng nhầm đó là tác vụ I/O và tiếp tục giữ nó ở hàng đợi cao nhất vĩnh viễn.
- **Giải pháp của Rule 4 (Cumulative Time Allotment)**: Hệ thống theo dõi **hạn mức thời gian tích lũy (Cumulative Time Allotment)** của tiến trình tại mỗi tầng hàng đợi. Bất kể tiến trình đã chủ động nhả CPU bằng lệnh I/O bao nhiêu lần, chỉ cần tổng thời gian nó thực thi cộng dồn chạm hết Time Allotment của tầng đó, độ ưu tiên của nó sẽ lập tức bị giáng xuống một bậc (chuyển xuống hàng đợi thấp hơn kề dưới).
</details>

### Câu Hỏi 6: Quy tắc 5 (Rule 5 - Priority Boost) hoạt động ra sao và giải quyết hai vấn đề cốt lõi nào của MLFQ?

<details>
<summary>Đáp án</summary>

- **Cơ chế hoạt động**: Sau một chu kỳ thời gian $S$ nhất định (Time Period $S$), hệ thống thực hiện **Priority Boost**, đồng loạt di chuyển toàn bộ tất cả các tiến trình trong hệ thống trở lại **hàng đợi cao nhất (Topmost Queue)**.
- **Hai vấn đề được giải quyết**:
  1. **Chống bỏ đói (Preventing Starvation)**: Nếu có quá nhiều tiến trình tương tác mới liên tục xuất hiện, các tiến trình CPU-Bound ở hàng đợi thấp nhất ($Q_0$) vẫn được đưa lên lại đỉnh định kỳ để đảm bảo tiến triển.
  2. **Thích ứng đổi pha (Handling Phase Change)**: Một tiến trình trước đây là CPU-Bound (nằm ở $Q_0$) nhưng sau đó chuyển sang pha tương tác (như chờ người dùng thao tác) sẽ có cơ hội quay lại hàng đợi cao nhất để đạt phản hồi nhanh.
</details>

### Câu Hỏi 7: Trong cấu trúc MLFQ nhiều tầng (như mô hình 3 tầng trong bài học), Time Quantum thay đổi như thế nào giữa hàng đợi ưu tiên cao và hàng đợi ưu tiên thấp?

<details>
<summary>Đáp án</summary>

- **Hàng đợi ưu tiên cao nhất ($Q_2$)**: Có **Time Quantum ngắn** (ví dụ `10ms` trong sơ đồ/code mẫu, hoặc `8ms` trong sơ đồ Silberschatz), chạy **Round Robin** để phục vụ tiến trình mới và các tác vụ tương tác/I/O-Bound phản hồi siêu tốc.
- **Các hàng đợi ưu tiên thấp hơn ($Q_1, Q_0$)**: Có **Time Quantum tăng dần** (ví dụ `20ms` ở $Q_1$, `40ms` hoặc **FCFS** ở $Q_0$). Điều này giúp các tác vụ tính toán vừa và nặng (CPU-Bound) được chạy các khoảng dài hơn, giảm tần suất chuyển ngữ cảnh không cần thiết.
</details>

### Câu Hỏi 8: Trong chương trình mô phỏng `mlfq_simulator.c` với 3 tiến trình $P_1$ (`80ms`), $P_2$ (`35ms`) và $P_3$ (`8ms`), tại sao $P_3$ hoàn tất ngay ở $Q_2$ còn $P_2$ sau khi bị giáng xuống $Q_0$ lại kết thúc được ở $Q_2$?

<details>
<summary>Đáp án</summary>

- **Đối với $P_3$ (`8ms`)**: Cả 3 tiến trình đều bắt đầu ở $Q_2$ với allotment `10ms` (Rule 3). $P_1$ và $P_2$ dùng hết `10ms` nên bị giáng xuống $Q_1$ (Rule 4), trong khi $P_3$ chỉ cần `8ms < 10ms` nên hoàn tất ngay tại $Q_2$ ở thời điểm `T=28ms`.
- **Đối với $P_2$ (`35ms`)**: Sau khi chạy `10ms` ở $Q_2$ và `20ms` ở $Q_1$, $P_2$ bị giáng xuống $Q_0$ và chỉ còn `5ms` thời gian chạy. Đến `T=68ms` (vượt chu kỳ `BOOST_INTERVAL = 50ms`), cơ chế **Priority Boost** (Rule 5) đưa cả $P_1$ và $P_2$ trở lại $Q_2$ với `time_allotment_left = 10ms`. Nhờ được nâng cấp, $P_2$ chạy nốt `5ms` còn lại ngay tại $Q_2$ và hoàn tất ở `T=83ms`.
</details>

### Câu Hỏi 9: Mainline Linux Kernel hiện đại có sử dụng MLFQ không? Hãy tóm tắt lộ trình tiến hóa bộ lập lịch của Linux Kernel được nêu trong bài học.

<details>
<summary>Đáp án</summary>

**Không.** Mainline Linux Kernel **không** sử dụng MLFQ. Lộ trình tiến hóa bộ lập lịch của nhân Linux gồm 4 giai đoạn:
1. **Linux 2.4**: Bộ lập lịch **$O(n)$** đơn giản (duyệt tuyến tính toàn bộ task).
2. **Linux 2.6**: Bộ lập lịch **$O(1)$** của Ingo Molnar (dùng 2 mảng active/expired runqueues với 140 mảng liên kết; sau bị thay thế vì logic tương tác quá phức tạp và dễ lỗi).
3. **Linux 2.6.23 đến 6.5**: **Completely Fair Scheduler (CFS)** của Ingo Molnar — không dùng nhiều hàng đợi ưu tiên như MLFQ mà dùng một **Cây Đỏ-Đen (Red-Black Tree)** duy nhất kết hợp chỉ số **Virtual Runtime (`vruntime`)** theo triết lý Chia sẻ tỷ lệ (**Proportional Share**).
4. **Linux 6.6+ (hiện tại)**: **EEVDF (Earliest Eligible Virtual Deadline First)** do Peter Zijlstra phát triển, thay thế hoàn toàn CFS để giải quyết triệt để bài toán độ trễ phản hồi cho các tác vụ nhạy cảm độ trễ (**latency-sensitive tasks**).
</details>

### Câu Hỏi 10: Những hệ điều hành thực tế nào sử dụng thuật toán MLFQ hoặc biến thể hàng đợi đa cấp có phản hồi?

<details>
<summary>Đáp án</summary>

Theo bài học, các hệ điều hành thực tế sử dụng MLFQ gồm:
- **4.4BSD & FreeBSD**: Triển khai thuật toán MLFQ cổ điển với cơ chế phân rã độ ưu tiên (**decay-usage priority**).
- **Oracle Solaris**: Phân lớp lập lịch `TS` (Time-Sharing Scheduling Class) sử dụng bảng tra cứu ma trận MLFQ với các mức ưu tiên từ `0` đến `59`.
- **Microsoft Windows NT (Windows 10/11 Server)**: Sử dụng hàng đợi đa cấp kết hợp cơ chế **Dynamic Priority Boosting** — tự động tăng độ ưu tiên tạm thời cho các luồng khi nhận sự kiện chuột/bàn phím hoặc hoàn tất I/O.
</details>

### Câu Hỏi 11: Điều gì xảy ra nếu cấu hình số lượng hàng đợi trong hệ thống MLFQ quá ít hoặc quá nhiều?

<details>
<summary>Đáp án</summary>

- **Quá ít hàng đợi** (ví dụ chỉ có 2 hàng đợi): MLFQ mất khả năng phân loại tinh tế và bị thoái hóa thành thuật toán **Round Robin** thông thường.
- **Quá nhiều hàng đợi** (ví dụ 64 tầng): Chi phí kiểm tra và dịch chuyển tiến trình qua lại giữa quá nhiều tầng hàng đợi sẽ làm nghẽn bộ nhớ đệm CPU (**Cache Thrashing**).
</details>

### Câu Hỏi 12: Nếu tham số chu kỳ $S$ của Priority Boost được cấu hình quá lớn hoặc quá nhỏ thì hệ thống gặp phải vấn đề gì?

<details>
<summary>Đáp án</summary>

- **Nếu $S$ quá lớn**: Các tiến trình tính toán nặng (CPU-Bound) nằm ở đáy $Q_0$ sẽ phải chờ quá lâu mới được boost, dẫn đến bị bỏ đói (**Starvation**) trong thời gian dài.
- **Nếu $S$ quá nhỏ**: Các tác vụ CPU-Bound liên tục bị đẩy trở lại đỉnh $Q_{\text{top}}$, làm nghẽn hàng đợi ưu tiên cao nhất và cản trở các tác vụ tương tác thực sự.
</details>
