# Review: 1_5_4 Deadlock Prevention

### Câu Hỏi 1: Deadlock Prevention là gì và nguyên lý nền tảng của chiến lược này dựa trên định lý nào?

<details>
<summary>Đáp án</summary>

**Deadlock Prevention (Ngăn ngừa Bế tắc)** là chiến lược can thiệp tĩnh ngay từ giai đoạn thiết kế hệ thống (Design Time), gồm tập hợp các kỹ thuật và quy tắc lập trình nhằm **vô hiệu hóa vĩnh viễn ít nhất một trong bốn điều kiện Coffman** (Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait).

Nguyên lý này dựa trên định lý của **Coffman et al. (1971)**: *Deadlock chỉ xảy ra khi và chỉ khi cả 4 điều kiện Coffman cùng tồn tại đồng thời*. Vì vậy, nếu triệt tiêu được ít nhất một điều kiện ngay từ khâu thiết kế, trạng thái Deadlock về mặt toán học không bao giờ có thể hình thành.
</details>

### Câu Hỏi 2: Chiến lược triệt tiêu Mutual Exclusion sử dụng những kỹ thuật nào và tại sao khó áp dụng hoàn toàn trong thực tế?

<details>
<summary>Đáp án</summary>

Mục tiêu của chiến lược này là loại bỏ sự tồn tại của các tài nguyên độc quyền (Non-shareable Resources) bằng 3 kỹ thuật chính:
1. **Chia sẻ dữ liệu chỉ đọc (Read-Only / Immutable Sharing)**: Dữ liệu bất biến có thể được nhiều luồng đọc đồng thời mà không cần dùng Mutex.
2. **Cấu trúc dữ liệu Lock-Free / Wait-Free**: Sử dụng các chỉ thị nguyên tử phần cứng CPU (như `Compare-And-Swap` - CAS hoặc `Load-Linked / Store-Conditional` - LL/SC) để cập nhật trạng thái hoặc con trỏ mà không cần dùng khóa (`pthread_mutex_t`).
3. **Kỹ thuật Spooling (Đệm tài nguyên)**: Áp dụng cho thiết bị phần cứng độc quyền vật lý (như máy in). Các tiến trình ghi dữ liệu vào thư mục đệm (spool directory) rồi tiếp tục chạy, chỉ có một tiến trình nền duy nhất (Spooler Daemon) tương tác tuần tự với thiết bị.

**Giới hạn thực tế**: Rất khó loại bỏ hoàn toàn Mutual Exclusion vì trong bản chất hệ thống luôn có những tài nguyên bắt buộc phải thay đổi trạng thái (Mutable State) và có tính độc quyền phần cứng không thể tránh khỏi.
</details>

### Câu Hỏi 3: Chiến lược triệt tiêu Hold and Wait được thực hiện bằng cách nào và gây ra những nhược điểm nghiêm trọng gì?

<details>
<summary>Đáp án</summary>

Mục tiêu là đảm bảo một tiến trình không bao giờ vừa nắm giữ tài nguyên này vừa ngủ chờ được cấp thêm tài nguyên khác, thông qua 2 kỹ thuật:
1. **Cấp phát nguyên tử toàn bộ (Atomic All-or-Nothing Acquisition)**: Tiến trình phải yêu cầu và nhận toàn bộ tài nguyên cần dùng trong suốt vòng đời ngay trước khi thực thi; nếu thiếu dù chỉ một tài nguyên thì không được cấp tài nguyên nào.
2. **Khóa tổng thể (Global Master Lock)**: Khi cần nhiều khóa (như `lockA` và `lockB`), luồng phải giữ một khóa tổng thể `global_lock` trước khi xin `lockA` và `lockB`, sau đó mới mở `global_lock`.

**3 nhược điểm nghiêm trọng**:
- **Giảm thông lượng tương tranh (Poor Concurrency)**: Tuần tự hóa (serialization) đoạn mã, làm triệt tiêu lợi thế của CPU đa nhân, giảm throughput và tăng latency.
- **Lãng phí tài nguyên**: Tài nguyên có thể chỉ cần dùng trong 1 giây ở cuối tiến trình nhưng lại bị chiếm giữ suốt từ đầu tiến trình.
- **Nguy cơ Starvation (Đói tài nguyên)**: Tiến trình cần nhiều tài nguyên cùng lúc có thể phải chờ vô thời hạn vì luôn có ít nhất một tài nguyên đang bị tiến trình khác sử dụng.
</details>

### Câu Hỏi 4: Chiến lược triệt tiêu No Preemption hoạt động như thế nào khi sử dụng `pthread_mutex_trylock()`?

<details>
<summary>Đáp án</summary>

Thay vì dùng hàm khóa chặn `pthread_mutex_lock()` (khiến luồng đi ngủ và giữ chặt các khóa đã chiếm được), lập trình viên sử dụng hàm không chặn **`pthread_mutex_trylock()`** để cho phép tự nguyện nhả tài nguyên nếu xin tài nguyên tiếp theo thất bại.

Cụ thể, luồng khóa `lockA` trước, sau đó gọi `pthread_mutex_trylock(&lockB)`:
- Nếu thành công (trả về `0`), luồng giữ cả 2 khóa, xử lý công việc rồi giải phóng.
- Nếu thất bại (khác `0`), luồng **chủ động nhả ngay `lockA`** (`pthread_mutex_unlock`), chờ một khoảng thời gian ngẫu nhiên rồi thử lại từ đầu.
</details>

### Câu Hỏi 5: Livelock là gì, khác với Deadlock như thế nào khi quan sát CPU và làm sao để khắc phục?

<details>
<summary>Đáp án</summary>

- **Livelock (Khóa sống)** là hiện tượng các luồng liên tục chiếm khóa thứ nhất, cùng thất bại khi thử chiếm khóa thứ hai, cùng đồng loạt nhả khóa thứ nhất rồi lại lặp lại quá trình đó mãi mà không hoàn thành được công việc.
- **So sánh với Deadlock**:
  - **Deadlock**: Các tiến trình rơi vào trạng thái ngủ (`D` hoặc `S` state, bị chặn ở các lời gọi như `futex`), tiêu thụ CPU xấp xỉ **0.0%**.
  - **Livelock**: Các luồng vẫn chạy vòng lặp liên tục (`trylock`, nhả khóa, kiểm tra điều kiện), mức tiêu thụ CPU thường tăng vọt lên **100%** trên các lõi tương ứng nhưng không tạo ra kết quả hữu ích nào.
- **Cách khắc phục**: Không dùng thời gian chờ cố định (Fixed Delay — vì dễ khiến các luồng thức dậy đồng bộ và tiếp tục va chạm), mà phải dùng thời gian chờ ngẫu nhiên (**Randomized Exponential Backoff** / cộng thêm giá trị **Jitter** ngẫu nhiên theo công thức $\text{Delay} = \text{Base Backoff} + \text{rand() } \% \text{ Jitter}$).
</details>

### Câu Hỏi 6: Quy tắc Havender (Total Ordering) triệt tiêu điều kiện Circular Wait bằng cách nào và tại sao về mặt toán học không thể xảy ra Deadlock?

<details>
<summary>Đáp án</summary>

**Quy tắc Havender (1968)** là chiến lược phổ biến và hiệu quả nhất, hoạt động theo 2 nguyên tắc:
1. Gán cho mỗi tài nguyên/khóa trong hệ thống một số thứ tự duy nhất $F: R \to \mathbb{N}$ sao cho $R_1 < R_2 < R_3 < \dots < R_n$.
2. **Quy tắc bất biến (Lock Ordering Invariant)**: Mọi luồng bắt buộc phải chiếm khóa theo đúng thứ tự tăng dần. Một luồng đang giữ $R_i$ chỉ được xin thêm $R_j$ nếu và chỉ nếu $F(R_j) > F(R_i)$.

**Chứng minh toán học (bằng phản chứng)**:
Giả sử tồn tại một chu trình chờ đợi khép kín $P_0 \to P_1 \to P_2 \to \dots \to P_{k-1} \to P_0$. Theo quy tắc Havender, điều này suy ra:
$$F(R_{P_0}) < F(R_{P_1}) < \dots < F(R_{P_{k-1}}) < F(R_{P_0})$$
Theo tính chất bắc cầu, ta thu được $F(R_{P_0}) < F(R_{P_0})$ — đây là điều vô lý. Do đó, đồ thị phân bổ tài nguyên RAG không bao giờ tồn tại chu trình khép kín và Deadlock là bất khả thi.
</details>

### Câu Hỏi 7: Trong bài toán chuyển tiền ngân hàng giữa hai tài khoản, quy tắc Havender được áp dụng trong code C như thế nào để tránh Deadlock khi chuyển tiền chéo?

<details>
<summary>Đáp án</summary>

Nếu khóa theo thứ tự tài khoản nguồn trước, tài khoản đích sau thì hai giao dịch ngược chiều ($A \to B$ và $B \to A$) sẽ gây Deadlock ngay lập tức.

Để áp dụng quy tắc Havender, hàm chuyển tiền so sánh **địa chỉ con trỏ vùng nhớ** `(uintptr_t)first > (uintptr_t)second` (hoặc dùng **ID tài khoản duy nhất**) để sắp xếp lại thứ tự `first` và `second`, rồi luôn khóa `first` trước, `second` sau. Vì mỗi cấu trúc tài khoản nằm tại một địa chỉ bộ nhớ ảo duy nhất, cố định và có quan hệ thứ tự toàn phần, mọi luồng dù chuyển tiền theo chiều nào cũng khóa theo cùng một thứ tự nhất quán, triệt tiêu hoàn toàn Circular Wait.
</details>

### Câu Hỏi 8: Cạm bẫy "Lock Order Inversion via Callbacks" là gì và nguyên tắc "Open Calls" phòng ngừa nó ra sao?

<details>
<summary>Đáp án</summary>

- **Lock Order Inversion via Callbacks (Đảo ngược thứ tự khóa qua hàm gọi ngược)**: Dù hệ thống quy ước thứ tự $A < B$, nhưng nếu Luồng 1 chạy trong `Module A`, giữ `Lock A` rồi gọi vào `Module B` (xin `Lock B`), trong khi Luồng 2 chạy trong `Module B`, giữ `Lock B` trước rồi thông qua một **Observer Callback** gọi ngược về `Module A` (xin `Lock A`), thì thứ tự khóa bị đảo ngược ngầm thành $B \to A$, gây ra Deadlock ở môi trường Production.
- **Biện pháp phòng ngừa (Open Calls)**: Tuyệt đối không thực hiện lời gọi hàm ngoại vi (External Call / Callback) trong khi đang nắm giữ một khóa cục bộ.
</details>
