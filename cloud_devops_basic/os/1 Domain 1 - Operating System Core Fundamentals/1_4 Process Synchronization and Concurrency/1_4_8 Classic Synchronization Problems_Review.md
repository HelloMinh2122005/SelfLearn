# Review: 1_4_8 Classic Synchronization Problems

### Câu Hỏi 1: Các bài toán đồng bộ hóa kinh điển (Classic Synchronization Problems) mô hình hóa những vấn đề nào và gồm ba bài toán nền tảng nào?

<details>
<summary>Đáp án</summary>

Các bài toán đồng bộ hóa kinh điển được đề xuất nhằm mô hình hóa toàn diện các mẫu tranh chấp tài nguyên (Resource Contention), điều phối bất đối xứng, hiện tượng bỏ đói (**Starvation**) và hiểm họa bế tắc (**Deadlock**) trong kernel hệ điều hành và kiến trúc phân tán.

Ba bài toán nền tảng gồm:
1. **Bounded Buffer (Producer-Consumer)**: Điều phối dòng dữ liệu qua vùng đệm có sức chứa giới hạn.
2. **Readers-Writers**: Điều phối giữa quyền độc quyền ghi và quyền chia sẻ đọc song song.
3. **Dining Philosophers**: Xử lý tranh chấp tài nguyên hạn chế và triệt tiêu chu trình Deadlock.

</details>

### Câu Hỏi 2: Trong bài toán Bounded Buffer (Producer-Consumer), ba ràng buộc an toàn (Safety Invariants) cần phải đảm bảo là gì?

<details>
<summary>Đáp án</summary>

Trong bài toán Bounded Buffer (vùng đệm chia sẻ có sức chứa tối đa $N$ phần tử), ba ràng buộc an toàn gồm:
1. **Không ghi tràn (No Overflow)**: Producer không được phép ghi dữ liệu khi vùng đệm đã đầy ($N$ phần tử); Producer phải chuyển sang trạng thái chờ (block/sleep) cho tới khi có ít nhất một ô trống.
2. **Không đọc rỗng (No Underflow)**: Consumer không được phép đọc khi vùng đệm đang rỗng (0 phần tử); Consumer phải chờ cho tới khi có ít nhất một ô dữ liệu được ghi vào.
3. **Loại trừ tương hỗ (Mutual Exclusion)**: Việc cập nhật con trỏ hàng đợi (`in_idx`, `out_idx` / Head-Tail pointers) của buffer phải được bảo vệ độc quyền để tránh xung đột dữ liệu.

</details>

### Câu Hỏi 3: Để giải quyết bài toán Bounded Buffer bằng Semaphores và Mutex, ba biến `empty`, `full` và `mutex` có vai trò và giá trị khởi tạo ban đầu như thế nào?

<details>
<summary>Đáp án</summary>

- **`empty`** (Counting Semaphore): Khởi tạo bằng **$N$** (kích thước tối đa của buffer), biểu thị số lượng ô trống khả dụng để Producer ghi dữ liệu.
- **`full`** (Counting Semaphore): Khởi tạo bằng **`0`**, biểu thị số lượng ô đã có dữ liệu sẵn sàng để Consumer đọc.
- **`mutex`** (Binary Semaphore hoặc Mutex Lock): Khởi tạo bằng **`1`**, dùng để bảo vệ cấu trúc dữ liệu hàng đợi bên trong đoạn găng (Critical Section), đảm bảo chỉ một tiến trình/luồng cập nhật buffer tại một thời điểm.

</details>

### Câu Hỏi 4: Trong bài toán Bounded Buffer, vì sao chỉ dùng Counting Semaphore (`empty`, `full`) là không đủ khi có nhiều Producer hoặc nhiều Consumer cùng chạy?

<details>
<summary>Đáp án</summary>

Counting Semaphore chỉ đóng vai trò điều phối số lượng ô khả dụng (báo hiệu khi nào vùng đệm đầy hoặc rỗng). Khi có nhiều Producer hoặc nhiều Consumer truy cập đồng thời, nếu không có Mutex Lock bảo vệ, hai Producer có thể cùng được phép ghi vào hàng đợi và cập nhật biến con trỏ `in_idx` cùng lúc, gây ra **Race Condition** trực tiếp trên chỉ số mảng và ghi đè làm mất dữ liệu của nhau (tương tự với Consumer trên `out_idx`). Do đó, Mutex Lock là bắt buộc để đảm bảo **Mutual Exclusion** cho cấu trúc dữ liệu nội bộ của hàng đợi.

</details>

### Câu Hỏi 5: Trong logic của Producer và Consumer ở bài toán Bounded Buffer, thứ tự gọi `sem_wait` và `pthread_mutex_lock` phải tuân theo quy tắc nào? Nếu đảo ngược thứ tự sẽ gây ra hậu quả gì?

<details>
<summary>Đáp án</summary>

**Quy tắc thứ tự khóa (Nesting Order)**: Phải luôn gọi `sem_wait` (`sem_wait(&empty)` ở Producer hoặc `sem_wait(&full)` ở Consumer) **trước**, sau đó mới gọi `pthread_mutex_lock(&mutex)`.

**Hậu quả nếu đảo ngược thứ tự** (gọi `pthread_mutex_lock(&buffer_mutex)` trước `sem_wait(&empty_slots)`):
- Khi buffer đã đầy ($N$ phần tử, `empty_slots = 0`), Producer khóa thành công `buffer_mutex`, sau đó gọi `sem_wait(&empty_slots)` và bị kernel đưa vào trạng thái ngủ chờ (sleep/blocked) nhưng **vẫn giữ khóa `buffer_mutex`**.
- Consumer đến lấy dữ liệu để giải phóng ô trống nhưng bị chặn ngay tại `pthread_mutex_lock(&buffer_mutex)` vì Mutex đang bị Producer nắm giữ.
- Producer chờ Consumer giải phóng ô trống, còn Consumer chờ Producer nhả Mutex, dẫn đến **Deadlock vĩnh cửu**.

</details>

### Câu Hỏi 6: Trong bài toán Readers-Writers, yêu cầu truy cập dữ liệu chia sẻ của Readers và Writers khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- **Readers (Độc giả)**: Chỉ đọc dữ liệu và không làm thay đổi trạng thái dữ liệu. Vì vậy, **nhiều Reader được phép truy cập đọc đồng thời** mà hoàn toàn không gây ra Race Condition.
- **Writers (Tác giả)**: Sửa đổi dữ liệu. Vì vậy, **Writer đòi hỏi quyền truy cập độc quyền tuyệt đối (Mutual Exclusion)**: khi một Writer đang ghi, không được phép có bất kỳ Reader nào đang đọc hoặc Writer nào khác đang ghi cùng lúc.

</details>

### Câu Hỏi 7: Hãy phân biệt hai biến thể điều phối Reader-Preference và Writer-Preference trong bài toán Readers-Writers?

<details>
<summary>Đáp án</summary>

1. **Reader-Preference (Ưu tiên người đọc)**:
   - *Cơ chế*: Nếu dữ liệu đang mở cho một Reader đọc, các Reader đến sau được phép vào đọc ngay lập tức mà không phải chờ.
   - *Hệ quả tiêu cực*: Dẫn đến **Writer Starvation (Tác giả bị chết đói)**. Trong hệ thống có lưu lượng đọc liên tục không ngắt quãng, biến đếm người đọc (`readcount`) luôn $\ge 1$, khiến Writer có thể phải chờ vô thời hạn.
2. **Writer-Preference (Ưu tiên người ghi)**:
   - *Cơ chế*: Ngay khi một Writer phát tín hiệu yêu cầu quyền ghi, các Reader đến sau sẽ bị chặn lại và xếp hàng chờ. Khi nhóm Reader hiện tại đọc xong, Writer sẽ được ưu tiên vào ghi ngay trước nhóm Reader mới.
   - *Đặc điểm*: Ngăn chặn được Writer Starvation, nhưng có thể làm giảm thông lượng đọc (**Read Throughput**).

</details>

### Câu Hỏi 8: Chuẩn POSIX cung cấp công cụ nào cho bài toán Readers-Writers, và các hệ thống tải đọc cao trong thực tế sản xuất dùng biện pháp nào để tránh Writer Starvation?

<details>
<summary>Đáp án</summary>

- **Chuẩn POSIX**: Thư viện POSIX Threads cung cấp cấu trúc khóa chuyên dụng `pthread_rwlock_t` với hai hàm:
  - `pthread_rwlock_rdlock()`: Khóa chia sẻ dành cho Readers.
  - `pthread_rwlock_wrlock()`: Khóa độc quyền dành cho Writers.
- **Biện pháp thực tế sản xuất (Production)** cho các hệ thống có tải đọc cao (như Web Cache / API Gateway):
  - Sử dụng **Fair Read-Write Lock** (xếp hàng theo thứ tự FIFO).
  - Hoặc sử dụng cấu trúc dữ liệu không khóa **Lock-Free RCU (Read-Copy-Update)** (như trong Linux Kernel), cho phép Writer tạo bản sao mới và thay thế con trỏ nguyên tử mà không cần phong tỏa các Readers.

</details>

### Câu Hỏi 9: Hãy mô tả mô hình bài toán Dining Philosophers và giải thích vì sao thuật toán ngây thơ đối xứng dẫn đến Deadlock?

<details>
<summary>Đáp án</summary>

- **Mô hình**: Năm nhà triết học ngồi quanh một bàn tròn, giữa mỗi cặp triết gia liền kề có đúng một chiếc đũa (tổng cộng 5 triết gia và 5 chiếc đũa). Mỗi triết gia luân phiên giữa hai trạng thái **Thinking (Suy ngẫm)** và **Eating (Ăn mì)**. Để ăn được, mỗi triết gia bắt buộc phải cầm đủ **2 chiếc đũa** (bên trái và bên phải mình), ăn xong thì đặt cả 2 xuống.
- **Nguyên nhân Deadlock với thuật toán đối xứng**: Nếu cả 5 triết gia cùng áp dụng quy tắc nhặt đũa bên trái trước rồi chờ đũa bên phải và họ cùng đói tại một thời điểm, mỗi người sẽ nhặt thành công 1 chiếc đũa bên trái. Lúc này cả 5 chiếc đũa đều bị giữ, không còn chiếc nào tự do, và cả 5 triết gia cùng ngồi chờ chiếc đũa bên phải của nhau. Điều này tạo thành **Chu trình chờ đợi (Circular Wait)** khiến toàn bộ hệ thống treo cứng (Deadlock).

</details>

### Câu Hỏi 10: Giải pháp kinh điển của Dijkstra (Breaking Symmetry) giải quyết Deadlock trong bài toán Dining Philosophers như thế nào?

<details>
<summary>Đáp án</summary>

Giải pháp của Dijkstra thực hiện **phá vỡ tính đối xứng (Breaking Symmetry)** bằng cách thay đổi thứ tự nhặt đũa của một triết gia:
- Bốn triết gia đầu tiên (từ 0 đến 3) vẫn giữ quy tắc: **nhặt đũa bên trái trước, đũa bên phải sau**.
- Riêng triết gia cuối cùng (triết gia số 4) đảo ngược quy tắc: **nhặt đũa bên phải trước (Đũa 0), đũa bên trái sau (Đũa 4)**.

Việc này khiến triết gia số 4 cạnh tranh trực tiếp chiếc đũa số 0 với triết gia số 0 ngay từ đầu, thay vì giữ đũa số 4 rồi chờ đũa số 0. Nhờ đó, giải pháp triệt tiêu hoàn toàn điều kiện **Chờ đợi vòng quanh (Circular Wait)** trong 4 điều kiện Coffman, đảm bảo luôn có ít nhất một triết gia lấy đủ 2 đũa và loại bỏ hoàn toàn Deadlock.

</details>
