# Review: 1_4_6 Semaphores

### Câu Hỏi 1: Semaphore là gì và hai thao tác nguyên tử (atomic operations) $P()$ và $V()$ hoạt động như thế nào trong chuẩn POSIX?

<details>
<summary>Đáp án</summary>

**Semaphore** (do Edsger W. Dijkstra giới thiệu năm 1965) là một cấu trúc dữ liệu dạng biến số nguyên chỉ được truy cập và thao tác độc quyền thông qua hai thao tác nguyên tử:

- **$P()$ (*proberen* – kiểm tra / thử giảm)**, chuẩn POSIX là `sem_wait()`:
  - Kiểm tra giá trị hiện tại của semaphore.
  - Nếu giá trị lớn hơn `0`: giảm giá trị đi `1` và cho phép tiến trình/luồng tiếp tục thực thi ngay.
  - Nếu giá trị bằng `0` (hoặc không dương): tiến trình/luồng bị chặn (block/sleep) và đưa vào hàng đợi chờ của semaphore.
- **$V()$ (*verhogen* – làm tăng lên)**, chuẩn POSIX là `sem_post()`:
  - Tăng giá trị của semaphore lên `1`.
  - Nếu đang có luồng bị phong tỏa trong hàng đợi chờ, hệ điều hành sẽ đánh thức một luồng dậy để tiếp tục chạy.

Cả `sem_wait()` và `sem_post()` phải đảm bảo tính nguyên tử tuyệt đối (atomic), không thể bị ngắt quãng giữa chừng bởi context switch hay tranh chấp đa luồng đồng thời.
</details>

### Câu Hỏi 2: Binary Semaphore và Counting Semaphore khác nhau như thế nào về miền giá trị khởi tạo và mục đích sử dụng?

<details>
<summary>Đáp án</summary>

1. **Binary Semaphore (Semaphore nhị phân)**:
   - **Miền giá trị khởi tạo**: Chỉ nhận `0` hoặc `1`.
   - **Mục đích sử dụng**:
     - Khi khởi tạo bằng `1`: Có thể dùng cho mục đích loại trừ tương hỗ (Mutual Exclusion) — luồng gọi `sem_wait()` trước khi vào Critical Section và `sem_post()` khi rời khỏi.
     - Khi khởi tạo bằng `0`: Dùng cho mục đích phát tín hiệu thông báo (Signaling) — một luồng dừng chờ bằng `sem_wait()`, luồng khác làm xong việc sẽ gọi `sem_post()` để đánh thức luồng đang chờ.
2. **Counting Semaphore (Semaphore đếm)**:
   - **Miền giá trị khởi tạo**: Là một số nguyên không âm $N \ge 0$.
   - **Mục đích sử dụng**: Quản lý và giới hạn số lượng tài nguyên hữu hạn khả dụng (Resource Pooling / Throttling), như hồ kết nối cơ sở dữ liệu hay bộ đệm giới hạn. Mỗi lần chiếm giữ 1 tài nguyên, luồng gọi `sem_wait()` để giảm số lượng khả dụng; khi dùng xong thì gọi `sem_post()` để hoàn trả lại vào hồ dùng chung.
</details>

### Câu Hỏi 3: Khái niệm Quyền sở hữu (Ownership) là điểm khác biệt cốt lõi nào giữa Mutex và Semaphore, và nó đem lại khả năng đặc biệt gì cho Semaphore?

<details>
<summary>Đáp án</summary>

- **Mutex có quyền sở hữu chặt chẽ (Strict Ownership)**: Luồng nào gọi `pthread_mutex_lock()` để khóa thì **chỉ duy nhất luồng đó** được phép gọi `pthread_mutex_unlock()`. Nếu một luồng khác tự ý mở khóa Mutex, hệ thống sẽ rơi vào hành vi không xác định (Undefined Behavior) hoặc báo lỗi `EPERM`.
- **Semaphore KHÔNG có quyền sở hữu (No Ownership)**: Bất kỳ luồng nào trong tiến trình, thậm chí một hàm xử lý ngắt phần cứng (Interrupt Service Routine – ISR), đều có thể gọi `sem_post()` để tăng giá trị semaphore và đánh thức luồng khác đang chờ.

Nhờ tính chất không sở hữu này:
1. Semaphore là công cụ lý tưởng cho bài toán **báo hiệu sự kiện (Event Signaling)** giữa các luồng hoặc tiến trình độc lập.
2. Semaphore **có thể dùng trong ISR**: ISR chạy trong ngữ cảnh ngắt và tuyệt đối không được phép ngủ để chờ khóa (nên không thể gọi `pthread_mutex_lock()`), trong khi `sem_post()` là thao tác non-blocking, không đòi hỏi quyền sở hữu nên ISR gọi `sem_post()` hoàn toàn an toàn.
</details>

### Câu Hỏi 4: Trong bảng so sánh Mutex, Binary Semaphore và Counting Semaphore, mỗi cơ chế phù hợp nhất với công dụng chính nào và khả năng hỗ trợ Priority Inheritance ra sao?

<details>
<summary>Đáp án</summary>

- **Mutex**:
  - **Công dụng chính**: Bảo vệ Critical Section chống Race Condition (loại trừ tương hỗ).
  - **Priority Inheritance**: Có hỗ trợ giao thức kế thừa độ ưu tiên (`PTHREAD_PRIO_INHERIT`).
- **Binary Semaphore**:
  - **Công dụng chính**: Báo hiệu sự kiện (Signaling) giữa các luồng hoặc tiến trình.
  - **Priority Inheritance**: Không tích hợp sẵn trong chuẩn POSIX.
- **Counting Semaphore**:
  - **Công dụng chính**: Giới hạn hồ tài nguyên chia sẻ hữu hạn (Resource Pooling / Throttling).
  - **Priority Inheritance**: Không tích hợp sẵn trong chuẩn POSIX.
</details>

### Câu Hỏi 5: Mô hình lý thuyết Semaphore của Dijkstra và chuẩn POSIX trên Linux khác nhau như thế nào về giá trị âm và hàm `sem_getvalue()`?

<details>
<summary>Đáp án</summary>

| Tiêu chí | Mô hình lý thuyết Dijkstra | Chuẩn POSIX (`sem_overview(7)`) |
| :--- | :--- | :--- |
| **Giá trị âm** | Giá trị $S$ **có thể âm**. Khi $S < 0$, giá trị tuyệt đối $\|S\|$ phản ánh chính xác số lượng luồng đang bị chặn trong hàng đợi ngủ. | Giá trị semaphore **không bao giờ giảm xuống dưới `0`**. Giá trị đại diện cho số tài nguyên sẵn sàng cấp phát. |
| **Đọc giá trị** | Đọc được số âm (ví dụ `-3` nghĩa là đang có 3 luồng ngủ chờ). | Hàm `sem_getvalue()` trả về `0` nếu hiện tại không còn tài nguyên hoặc đang có luồng bị block chờ tài nguyên. |
</details>

### Câu Hỏi 6: Phân biệt Unnamed Semaphore và Named Semaphore trong chuẩn POSIX về cách khởi tạo, phạm vi chia sẻ và cách hủy/dọn dẹp?

<details>
<summary>Đáp án</summary>

1. **Unnamed Semaphore (Semaphore không tên)**:
   - Khai báo dưới dạng biến bộ nhớ `sem_t` và khởi tạo bằng `sem_init(sem_t *sem, int pshared, unsigned int value)`.
   - **Phạm vi chia sẻ** phụ thuộc vào cờ `pshared`:
     - `pshared = 0`: Chia sẻ giữa các luồng trong cùng một tiến trình (nằm trên bộ nhớ heap hoặc global).
     - `pshared != 0`: Chia sẻ giữa các tiến trình khác nhau (biến phải đặt trong vùng nhớ chia sẻ Shared Memory).
   - **Hủy**: Dùng `sem_destroy(sem_t *sem)`.
2. **Named Semaphore (Semaphore có tên)**:
   - Định danh bằng chuỗi ký tự dạng đường dẫn `/ten_semaphore`, tạo hoặc mở bằng `sem_open(const char *name, int oflag, ...)`.
   - Xuất hiện trên hệ thống tập tin ảo (thường gắn tại `/dev/shm/` trên Linux với tiền tố `sem.ten_semaphore`).
   - **Phạm vi chia sẻ**: Cho phép các tiến trình hoàn toàn độc lập, không có quan hệ cha-con dễ dàng đồng bộ với nhau thông qua tên gọi.
   - **Đóng và xóa**: Đóng bằng `sem_close()` và xóa bỏ vĩnh viễn khỏi hệ thống bằng `sem_unlink()`.
</details>

### Câu Hỏi 7: Khi khởi tạo một Counting Semaphore với giá trị $S = 2$ (tối đa 2 worker hoạt động đồng thời), luồng hoạt động diễn ra như thế nào nếu có 3 luồng cùng gọi `sem_wait()` trước khi có luồng nào hoàn tất?

<details>
<summary>Đáp án</summary>

1. **Thread 1** gọi `sem_wait()`: Vì $S = 2 > 0$, $S$ giảm xuống còn `1` và Thread 1 vào thực thi công việc ở Slot 1.
2. **Thread 2** gọi `sem_wait()`: Vì $S = 1 > 0$, $S$ giảm xuống còn `0` và Thread 2 vào thực thi công việc ở Slot 2.
3. **Thread 3** gọi `sem_wait()`: Lúc này $S = 0$ (đã hết slot tài nguyên khả dụng), nên Thread 3 bị phong tỏa và đưa vào hàng đợi chờ (`BLOCKED / SLEEP`).
4. Khi Thread 1 hoàn thành công việc và gọi `sem_post()`, tài nguyên được hoàn trả/tăng lên và hệ điều hành lập tức đánh thức Thread 3 (chuyển từ `READY` sang `RUNNING`) để chiếm slot và thực thi.

Nhờ cơ chế này, tại bất kỳ thời điểm nào cũng không bao giờ có quá 2 luồng cùng chạy đồng thời trong vùng giới hạn.
</details>

### Câu Hỏi 8: Vì sao việc dùng Semaphore để bảo vệ Critical Section có thể dẫn đến hiểm họa Nghịch đảo độ ưu tiên (Priority Inversion), và quy tắc thực chiến khi chọn giữa Mutex và Semaphore là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân gây Priority Inversion không tự cứu được**:
  - Với `pthread_mutex_t`, hệ điều hành có thể dùng thuộc tính `PTHREAD_PRIO_INHERIT` (Priority Inheritance Protocol): nếu luồng ưu tiên thấp giữ khóa mà luồng ưu tiên cao đang chờ, luồng thấp sẽ tạm thời được nâng độ ưu tiên ngang bằng luồng cao để chạy nhanh và nhả khóa.
  - Với Semaphore, vì **không có quyền sở hữu (No Ownership)**, kernel không biết luồng nào sẽ là người gọi `sem_post()` trong tương lai nên **không thể áp dụng cơ chế thừa kế độ ưu tiên**. Kết quả là một luồng ưu tiên trung bình có thể chiếm CPU liên tục, khiến luồng ưu tiên cao bị bỏ đói vô tận (Starvation / Livelock).
- **Quy tắc thực chiến**:
  - Chỉ dùng **Mutex** cho bài toán bảo vệ đoạn găng độc quyền (Mutual Exclusion).
  - Chỉ dùng **Semaphore** cho bài toán báo hiệu sự kiện (Signaling) hoặc giới hạn hồ tài nguyên (Throttling / Rate Limiting).
</details>

### Câu Hỏi 9: Trong Linux production, lỗi `EINTR` xảy ra với `sem_wait()` trong tình huống nào, gây nguy hiểm gì nếu bỏ qua, và cách xử lý đúng ra sao?

<details>
<summary>Đáp án</summary>

- **Tình huống xảy ra**: Khi một tiến trình/luồng đang dừng chờ tại `sem_wait()`, nếu có bất kỳ POSIX Signal nào được gửi tới tiến trình (ví dụ `SIGALRM`, `SIGCHLD`, `SIGUSR1`), hàm `sem_wait()` sẽ lập tức bị hủy bỏ, trả về `-1` và thiết lập `errno = EINTR`.
- **Nguy hiểm nếu bỏ qua**: Nếu không kiểm tra giá trị trả về của `sem_wait()`, luồng có thể tiếp tục chạy thẳng vào Critical Section dù chưa thực sự nhận được tài nguyên, gây hỏng dữ liệu.
- **Cách xử lý đúng**: Bọc `sem_wait()` trong một vòng lặp `while` kiểm tra mã lỗi; nếu trả về `-1` với `errno == EINTR` thì lặp lại để chờ tiếp, còn nếu `errno != EINTR` thì xử lý lỗi thực sự.
</details>

### Câu Hỏi 10: Nguyên nhân gây ra hiện tượng rò rỉ Named Semaphore trên `/dev/shm` và biện pháp khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Khi dùng Named Semaphore (`sem_open()`), kernel tạo file định danh tại `/dev/shm/sem.<tên>`. Nếu tiến trình bị dừng đột ngột (ví dụ do `SIGKILL` hoặc `SIGSEGV`), file định danh này vẫn tồn tại vĩnh viễn trên RAM của kernel Linux. Khi ứng dụng khởi động lại, nó mở nhầm semaphore cũ đang chứa giá trị rác hoặc trạng thái khóa dở dang, dẫn đến deadlock toàn hệ thống.
- **Biện pháp khắc phục**: Luôn đăng ký hàm dọn dẹp bằng `atexit()` hoặc signal handlers để gọi `sem_unlink()`, đồng thời giám sát thư mục `/dev/shm/` trong các kịch bản kiểm thử tích hợp.
</details>
