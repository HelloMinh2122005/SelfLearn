# Review: 1_4_4 Mutex Locks

### Câu Hỏi 1: Mutex là viết tắt của cụm từ gì và nó được thiết kế để giải quyết bài toán nào?

<details>
<summary>Đáp án</summary>

**Mutex** là viết tắt của **Mutual Exclusion Lock (Khóa độc quyền tương hỗ)**. Đây là cơ chế đồng bộ hóa nền tảng trong các hệ thống POSIX và hệ điều hành hiện đại, được thiết kế để bảo vệ **miền găng (Critical Section)** trước nguy cơ **xung đột dữ liệu (Race Condition)** khi nhiều luồng cùng truy cập tài nguyên dùng chung.

</details>

### Câu Hỏi 2: Ngữ nghĩa sở hữu nghiêm ngặt (Strict Ownership Semantics) của Mutex là gì và điểm này khác với Binary Semaphore như thế nào?

<details>
<summary>Đáp án</summary>

- **Tính sở hữu của Mutex**: Khi một chiếc Mutex bị khóa, nó được gắn liền với định danh của luồng đã khóa nó (**Owner Thread**). Theo quy tắc sở hữu tuyệt đối, **chỉ duy nhất luồng đã thực hiện thao tác khóa (`lock`) mới có quyền thực hiện thao tác mở khóa (`unlock`)** chiếc Mutex đó.
- **Khác biệt với Binary Semaphore**: Binary Semaphore không có khái niệm sở hữu — một luồng này có thể đợi (`wait()`), và một luồng hoàn toàn khác (hoặc thậm chí trình xử lý ngắt phần cứng ISR) có thể phát tín hiệu mở (`post()`). Với Mutex, việc luồng khác mở khóa chéo là không được phép.

</details>

### Câu Hỏi 3: Điều gì sẽ xảy ra nếu một luồng cố tình gọi `pthread_mutex_unlock()` trên một Mutex đang do luồng khác nắm giữ hoặc chưa hề bị khóa?

<details>
<summary>Đáp án</summary>

Hành vi cụ thể phụ thuộc vào loại Mutex đang sử dụng (theo đặc tả chuẩn POSIX):
- **`PTHREAD_MUTEX_ERRORCHECK`**: Hàm `pthread_mutex_unlock()` sẽ từ chối và trả về mã lỗi **`EPERM` (Operation not permitted)**.
- **`PTHREAD_MUTEX_RECURSIVE`**: Hàm cũng trả về mã lỗi **`EPERM`**.
- **`PTHREAD_MUTEX_NORMAL`** *(loại mặc định)*: Dẫn đến hành vi bất định (**Undefined Behavior**), có thể làm hỏng trạng thái khóa.

</details>

### Câu Hỏi 4: Chuẩn POSIX.1-2008 định nghĩa 3 loại Mutex nào? Chúng xử lý việc tự khóa lại chính mình (Re-locking) như thế nào và được ứng dụng trong trường hợp nào?

<details>
<summary>Đáp án</summary>

Ba loại Mutex được cấu hình qua thuộc tính `pthread_mutexattr_settype` gồm:
1. **`PTHREAD_MUTEX_NORMAL`** *(Mặc định)*:
   - *Re-locking*: Gây **Deadlock vĩnh viễn** vì luồng tự chờ chính mình nhả khóa.
   - *Ứng dụng*: Hiệu năng cao nhất, dùng khi logic mã nguồn đã được chứng minh an toàn.
2. **`PTHREAD_MUTEX_ERRORCHECK`**:
   - *Re-locking*: Trả về mã lỗi **`EDEADLK`** ngay lập tức, ngăn ngừa Deadlock.
   - *Ứng dụng*: Dùng trong môi trường kiểm thử và gỡ lỗi (Testing/Debugging) để truy tìm lỗi logic.
3. **`PTHREAD_MUTEX_RECURSIVE`**:
   - *Re-locking*: Cho phép cùng một luồng khóa nhiều lần liên tiếp bằng cách tăng biến đếm nội bộ (**lock counter**). Luồng phải gọi số lần `unlock` tương ứng để nhả khóa hoàn toàn.
   - *Ứng dụng*: Dùng trong các hàm đệ quy hoặc các hàm thành phần gọi lồng nhau.

</details>

### Câu Hỏi 5: Hiện tượng Nghịch đảo mức ưu tiên (Priority Inversion) xảy ra trong điều kiện nào và diễn biến ra sao?

<details>
<summary>Đáp án</summary>

Hiện tượng này xảy ra trong các hệ điều hành sử dụng bộ lập lịch ưu tiên tước quyền (**Preemptive Priority Scheduling**) theo trình tự sau:
1. **Luồng Thấp ($L$)** giành được Mutex $M$ để truy cập tài nguyên.
2. **Luồng Cao ($H$)** thức dậy và cần Mutex $M$, nhưng vì $M$ đang bị $L$ giữ nên $H$ bị block và rơi vào hàng đợi chờ.
3. Đúng lúc đó, các **Luồng Trung bình ($M_1, M_2$)** thức dậy. Do có độ ưu tiên cao hơn $L$ và không cần Mutex $M$, bộ lập lịch CPU liên tục cấp phát thời gian chạy cho các luồng trung bình, khiến $L$ không thể chạy để hoàn thành công việc và nhả khóa.
4. **Hậu quả**: Luồng ưu tiên cao nhất ($H$) bị gián tiếp "đói CPU" và chờ đợi vô tận bởi các luồng trung bình (điển hình là sự cố trên tàu thăm dò Mars Pathfinder năm 1997 dẫn đến Watchdog Timer liên tục reset hệ thống).

</details>

### Câu Hỏi 6: Giao thức Kế thừa mức ưu tiên (Priority Inheritance Protocol - PIP) giải quyết hiện tượng Priority Inversion bằng cách nào?

<details>
<summary>Đáp án</summary>

Chuẩn POSIX hỗ trợ giao thức này thông qua `PTHREAD_PRIO_INHERIT` (`pthread_mutexattr_setprotocol`):
- Khi **Luồng Cao ($H$)** bị block vì chờ Mutex đang do **Luồng Thấp ($L$)** nắm giữ, kernel sẽ **tạm thời nâng mức ưu tiên của $L$ lên bằng đúng mức ưu tiên của $H$**.
- Nhờ mức ưu tiên cao tạm thời này, các luồng trung bình không thể chen ngang chiếm quyền CPU của $L$.
- Luồng $L$ nhanh chóng thực thi xong miền găng và gọi `unlock()`. Ngay khi nhả khóa, kernel hạ mức ưu tiên của $L$ về lại mức ban đầu và trao quyền kiểm soát Mutex cho Luồng $H$.

</details>

### Câu Hỏi 7: Trong kiến trúc Mutex 3 tầng của Linux Kernel, Tầng 1 (Fastpath) và Tầng 2 (Midpath) tối ưu hóa việc chiếm khóa như thế nào?

<details>
<summary>Đáp án</summary>

- **Tầng 1 — Fastpath (Không có tranh chấp / Zero Contention)**: Khi Mutex đang rảnh rỗi, luồng chỉ mất duy nhất 1 chỉ lệnh nguyên tử **`atomic CAS` (`lock cmpxchg`)** để đổi trạng thái khóa từ `1` về `0` trong vài nano-giây mà hoàn toàn không cần sự can thiệp của bộ lập lịch. Nếu thất bại (khóa đang bị giữ), luồng chuyển xuống Tầng 2.
- **Tầng 2 — Midpath (Optimistic Spinning)**: Kernel kiểm tra xem luồng chủ sở hữu khóa (Owner) có đang trực tiếp chạy trên một CPU core khác hay không. Nếu đang chạy, kernel giả định miền găng rất ngắn và khóa sắp được nhả; luồng yêu cầu sẽ chủ động xoay chờ ngắn (**Spinning**) trên hàng đợi **MCS lock** nhẹ để chộp lấy khóa ngay khi nó được nhả, giúp tránh chi phí đắt đỏ của hai lần chuyển đổi ngữ cảnh (Context Switch).

</details>

### Câu Hỏi 8: Khi nào luồng chờ Mutex bị đưa xuống Tầng 3 (Slowpath) của Linux Kernel và điều gì xảy ra ở tầng này?

<details>
<summary>Đáp án</summary>

Luồng yêu cầu sẽ bị chuyển xuống **Tầng 3 (Slowpath)** khi luồng chủ sở hữu khóa đang ngủ (ví dụ đang chờ I/O) hoặc việc xoay chờ ở Midpath kéo dài quá lâu.

Tại đây, kernel thực hiện các bước:
1. Chuyển luồng yêu cầu sang trạng thái ngủ (**`TASK_UNINTERRUPTIBLE`**).
2. Đưa luồng vào danh sách hàng đợi chờ (**Wait-queue**) của Mutex.
3. Gọi **`schedule_preempt_disabled()`** để bộ lập lịch nhường core CPU cho tiến trình khác chạy.

</details>

### Câu Hỏi 9: Cạm bẫy tự khóa lại chính mình trên `PTHREAD_MUTEX_NORMAL` thường xảy ra trong tình huống nào và cách khắc phục ra sao?

<details>
<summary>Đáp án</summary>

- **Tình huống cạm bẫy**: Lập trình viên viết một hàm `foo()` đã chiếm giữ Mutex, sau đó `foo()` gọi một hàm phụ trợ `bar()`, và bên trong `bar()` lại tiếp tục gọi `pthread_mutex_lock()` trên chính chiếc Mutex đó.
- **Hậu quả**: Với loại mặc định `PTHREAD_MUTEX_NORMAL`, luồng sẽ tự chờ đợi chính mình nhả khóa, dẫn đến **Deadlock tự thân vĩnh viễn** và đóng băng toàn bộ tiến trình.
- **Cách khắc phục**: Sử dụng loại **`PTHREAD_MUTEX_RECURSIVE`** nếu logic bắt buộc phải gọi khóa lồng nhau (và đảm bảo gọi số lần `unlock` tương ứng), hoặc tái cấu trúc mã nguồn để tách riêng logic miền găng.

</details>

### Câu Hỏi 10: Vấn đề của Coarse-Grained Locking là gì và nguyên tắc Fine-Grained Locking giúp khắc phục điều đó như thế nào?

<details>
<summary>Đáp án</summary>

- **Vấn đề của Coarse-Grained Locking (Khóa quá lớn)**: Đặt một Mutex bao bọc toàn bộ một hàm dài, bao gồm cả các thao tác chậm chạp như đọc ghi I/O mạng hoặc truy vấn cơ sở dữ liệu. Điều này khiến tất cả các luồng khác đều bị block ở Tầng Slowpath của kernel, gây ra hàng trăm nghìn lần Context Switch không cần thiết, làm tải hệ thống tăng vọt nhưng throughput xử lý lại giảm sâu.
- **Cách khắc phục bằng Fine-Grained Locking**: Chỉ khóa trong phạm vi vài dòng mã trực tiếp thao tác trên biến số dùng chung, và **giải phóng khóa ngay lập tức trước khi thực hiện các tác vụ I/O**.

</details>
