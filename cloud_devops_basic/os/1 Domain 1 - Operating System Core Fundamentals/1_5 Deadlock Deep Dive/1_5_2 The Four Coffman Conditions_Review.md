# Review: 1_5_2 The Four Coffman Conditions

### Câu Hỏi 1: Deadlock là gì và công trình của Coffman cùng các cộng sự (1971) đã chứng minh điều gì về 4 điều kiện Coffman?

<details>
<summary>Đáp án</summary>

- **Deadlock (Bế tắc)** là trạng thái mà một tập hợp các tiến trình hoặc luồng bị phong tỏa vĩnh viễn (permanently blocked), trong đó mỗi tiến trình đều đang nắm giữ một số tài nguyên và đồng thời chờ đợi được cấp phát thêm tài nguyên khác đang bị chính các tiến trình trong tập hợp đó chiếm giữ.
- Năm 1971, Edward G. Coffman Jr., Michael J. Elphick và Arie Shoshani đã chứng minh rằng Deadlock chỉ có thể xảy ra khi **đồng thời cả 4 điều kiện Coffman** cùng hội tụ tại một thời điểm. Đây là **điều kiện cần (Necessary Conditions)** cho sự xuất hiện của Deadlock trong mọi hệ thống tổng quát.
</details>

### Câu Hỏi 2: Điều kiện thứ nhất — Mutual Exclusion (Loại trừ tương hỗ) có bản chất kỹ thuật như thế nào? Hãy nêu ví dụ minh họa?

<details>
<summary>Đáp án</summary>

- **Định nghĩa & Bản chất**: Ít nhất một tài nguyên trong hệ thống phải ở trạng thái **không thể chia sẻ (Non-shareable Mode)**. Tại một thời điểm, tài nguyên đó chỉ có thể được phục vụ hoặc sở hữu bởi duy nhất một tiến trình. Nếu tiến trình khác yêu cầu sử dụng, nó buộc phải bị hệ điều hành hoãn lại và đưa vào hàng đợi chờ cho tới khi tài nguyên được giải phóng hoàn toàn.
- **Ví dụ trong bài học**: Thiết bị ghi đĩa CD/DVD, máy in phần cứng, hoặc một khóa loại trừ `pthread_mutex_t` bảo vệ vùng nhớ ghi.
</details>

### Câu Hỏi 3: Điều kiện thứ hai — Hold and Wait (Giữ và chờ) được định nghĩa như thế nào?

<details>
<summary>Đáp án</summary>

- **Hold and Wait** xảy ra khi tồn tại một tiến trình đang **nắm giữ (holding)** ít nhất một tài nguyên đã được cấp phát trước đó, và đồng thời đang **chờ đợi (waiting)** để được cấp phát thêm các tài nguyên mới hiện đang bị một hoặc nhiều tiến trình khác chiếm giữ.
- Trong suốt thời gian chờ đợi, tiến trình đó không chịu trả lại tài nguyên mình đang có mà vẫn giữ chặt chúng.
</details>

### Câu Hỏi 4: Điều kiện thứ ba — No Preemption (Không thể thu hồi / cưỡng chế) có nghĩa là gì?

<details>
<summary>Đáp án</summary>

- Tài nguyên đã cấp phát cho một tiến trình thì **không thể bị tước đoạt cưỡng bức (forcibly preempted)** bởi hệ điều hành hoặc các tiến trình khác.
- Tiến trình đang nắm giữ chỉ nhả tài nguyên ra một cách hoàn toàn tự nguyện sau khi đã hoàn thành toàn bộ công việc cần thiết (ví dụ thông qua hàm `pthread_mutex_unlock` hoặc `close`).
</details>

### Câu Hỏi 5: Điều kiện thứ tư — Circular Wait (Chờ đợi vòng quanh) là gì?

<details>
<summary>Đáp án</summary>

- Tồn tại một tập hợp khép kín gồm $n$ tiến trình $\{P_0, P_1, P_2, \dots, P_{n-1}\}$ sao cho:
  - $P_0$ đang chờ tài nguyên do $P_1$ nắm giữ,
  - $P_1$ đang chờ tài nguyên do $P_2$ nắm giữ,
  - $\dots$
  - $P_{n-1}$ đang chờ tài nguyên do $P_0$ nắm giữ.
- Điều kiện này hình thành một **chu trình phụ thuộc khép kín (Directed Cycle)**, khiến mỗi mắt xích đều phụ thuộc vào mắt xích tiếp theo và không mắt xích nào tự giải thoát được.
</details>

### Câu Hỏi 6: Sự khác biệt giữa "điều kiện cần" và "điều kiện đủ" của 4 điều kiện Coffman trong hệ thống Single-instance và Multi-instance là gì?

<details>
<summary>Đáp án</summary>

- Trong hệ thống tổng quát, 4 điều kiện Coffman là **điều kiện cần (Necessary Conditions)**: nếu Deadlock đang diễn ra, chắc chắn 100% cả 4 điều kiện đều đang tồn tại.
- Chiều ngược lại phụ thuộc vào loại tài nguyên:
  1. **Hệ thống tài nguyên đơn vị (Single-instance resources)**: Mỗi loại tài nguyên chỉ có đúng 1 bản sao duy nhất (ví dụ 1 máy in duy nhất, 1 biến mutex duy nhất). Khi đó, 4 điều kiện Coffman là **điều kiện cần và đủ (Necessary and Sufficient Conditions)** — cả 4 cùng thỏa mãn thì chắc chắn xảy ra Deadlock.
  2. **Hệ thống tài nguyên đa đơn vị (Multi-instance resources)**: Một loại tài nguyên có thể có nhiều bản sao (ví dụ 3 máy in cùng loại). Khi đó, dù cả 4 điều kiện cùng thỏa mãn (có chu trình Circular Wait), Deadlock vẫn **chưa chắc xảy ra** nếu một tiến trình nằm ngoài chu trình giải phóng một bản sao tài nguyên mà các tiến trình trong chu trình đang chờ.
</details>

### Câu Hỏi 7: Hệ quả toán học cốt lõi nào từ 4 điều kiện Coffman làm nền tảng cho mọi kỹ thuật phòng ngừa Deadlock (Deadlock Prevention)?

<details>
<summary>Đáp án</summary>

- Theo luật phản đảo trong logic mệnh đề ($P \implies Q \iff \neg Q \implies \neg P$): nếu thiếu dù chỉ **1 trong 4 điều kiện Coffman**, trạng thái Deadlock về mặt toán học là **không thể hình thành** trong bất kỳ hệ thống nào (cả Single-instance lẫn Multi-instance).
- Do đó, mọi kỹ thuật **Deadlock Prevention** trong thiết kế hệ thống và phần mềm đều tập trung vào việc **triệt tiêu vĩnh viễn ít nhất một trong bốn điều kiện** này.
</details>

### Câu Hỏi 8: Trong Đồ thị phân bổ tài nguyên (Resource Allocation Graph - RAG), trạng thái Circular Wait được biểu diễn như thế nào?

<details>
<summary>Đáp án</summary>

- Khi cả 4 điều kiện xảy ra, đồ thị RAG sẽ xuất hiện một **chu trình có hướng (Directed Cycle)**.
- Ví dụ trong bài học: `Thread 1` đang sở hữu `Resource 1` và xin chờ `Resource 2`; trong khi `Thread 2` đang sở hữu `Resource 2` và xin chờ `Resource 1`. Điều này tạo thành chu trình khép kín: $\text{Thread 1} \to \text{Resource 2} \to \text{Thread 2} \to \text{Resource 1} \to \text{Thread 1}$.
</details>

### Câu Hỏi 9: Trong chương trình C minh họa POSIX threads (`lock1`, `lock2`), 4 điều kiện Coffman xuất hiện tương ứng ở đâu và GDB cho thấy các luồng bị kẹt tại đâu?

<details>
<summary>Đáp án</summary>

- **4 điều kiện Coffman trong mã nguồn**:
  1. *Mutual Exclusion*: `lock1` và `lock2` là khóa `pthread_mutex_t` không thể chia sẻ.
  2. *Hold and Wait*: `Thread A` giữ `lock1` (và `sleep(1)`) rồi chờ xin `lock2`; `Thread B` giữ `lock2` rồi chờ xin `lock1`.
  3. *No Preemption*: Hệ điều hành không thể cưỡng chế tước `lock1` hoặc `lock2` từ luồng đang giữ.
  4. *Circular Wait*: `Thread A` giữ `lock1` chờ `lock2` của `Thread B`, còn `Thread B` giữ `lock2` chờ `lock1` của `Thread A`.
- **Phân tích bằng GDB**: Khi chạy `gdb -batch -ex "thread apply all bt" -p $PID`, backtrace cho thấy cả hai luồng đều đang bị kẹt vĩnh viễn trong lời gọi hàm kernel `futex` (`__futex_abstimed_wait_common64` từ `__pthread_mutex_lock_wait`) để chờ nhau giải phóng khóa.
</details>

### Câu Hỏi 10: Vì sao hiện tượng tranh chấp khóa (Resource / Lock Contention) khi nhiều luồng cùng giành một khóa `lockA` lại không phải là Deadlock?

<details>
<summary>Đáp án</summary>

- Khi nhiều luồng cùng cố gắng lấy một khóa `lockA`, điều kiện *Mutual Exclusion* và *No Preemption* có thể thỏa mãn, nhưng **hoàn toàn không có Hold and Wait** (các luồng không giữ khóa nào khác trong khi chờ) và **không có Circular Wait**.
- Hệ quả của Lock Contention chỉ là làm chậm ứng dụng (High Latency) vì các luồng sẽ lần lượt vào rồi ra khỏi khóa, chứ không bị treo cứng vĩnh viễn như Deadlock.
</details>

### Câu Hỏi 11: Trong cơ sở dữ liệu (PostgreSQL / MySQL InnoDB), hai giao dịch cập nhật chéo hai dòng (`TX1` cập nhật `id=1` rồi `id=2`; `TX2` cập nhật `id=2` rồi `id=1`) thỏa mãn 4 điều kiện Coffman như thế nào và biện pháp phòng ngừa chuẩn là gì?

<details>
<summary>Đáp án</summary>

- **Phân tích theo 4 điều kiện Coffman**:
  1. *Mutual Exclusion*: Khóa dòng độc quyền (Exclusive Row Lock `X-lock`) không thể chia sẻ.
  2. *Hold and Wait*: `TX1` giữ khóa dòng 1 và chờ dòng 2; `TX2` giữ khóa dòng 2 và chờ dòng 1.
  3. *No Preemption*: CSDL không thể tự ý ép một giao dịch nhả khóa khi giao dịch đó chưa `COMMIT` hoặc `ROLLBACK`.
  4. *Circular Wait*: Tạo vòng chờ `TX1` $\to$ `TX2` $\to$ `TX1`.
- **Biện pháp phòng ngừa chuẩn**: Chuẩn hóa thứ tự cập nhật dữ liệu (**Total Ordering**) trong code backend, ví dụ luôn sắp xếp mảng các ID cần cập nhật theo thứ tự tăng dần (`ORDER BY id ASC`) trước khi gửi lệnh `UPDATE` tới CSDL.
</details>

### Câu Hỏi 12: Tại sao không thể bỏ Mutual Exclusion bằng Read-Only hoặc Lock-Free cho mọi tài nguyên, và làm sao ứng dụng có thể tự nguyện phá vỡ điều kiện No Preemption với POSIX mutex?

<details>
<summary>Đáp án</summary>

- **Giới hạn khi bỏ Mutual Exclusion**: Một số tài nguyên theo bản chất vật lý và logic bắt buộc phải có tính thay đổi trạng thái (Mutable State) và độc quyền phần cứng (như cổng serial, máy in vật lý, số dư tài khoản ngân hàng). Nếu biến mọi thứ thành Read-Only thì hệ thống mất khả năng cập nhật trạng thái; còn cấu trúc Lock-Free chỉ phù hợp với các biến dữ liệu đơn giản hỗ trợ lệnh CPU Compare-And-Swap (CAS), không thể mở rộng tùy tiện cho các đoạn logic nghiệp vụ phức tạp.
- **Tự nguyện phá vỡ No Preemption**: Với `pthread_mutex_lock()`, luồng bị block sẽ ngủ và giữ chặt khóa đã có. Để phá vỡ No Preemption, lập trình viên có thể dùng `pthread_mutex_trylock()`: nếu không thể chiếm được khóa tiếp theo ngay lập tức, luồng sẽ chủ động nhả toàn bộ các khóa đang nắm giữ, lùi lại một khoảng thời gian ngẫu nhiên (backoff) rồi thử lại từ đầu.
</details>
