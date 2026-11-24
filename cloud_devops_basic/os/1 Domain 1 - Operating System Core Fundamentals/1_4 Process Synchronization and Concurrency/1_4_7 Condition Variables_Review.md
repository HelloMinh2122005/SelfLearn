# Review: 1_4_7 Condition Variables

### Câu Hỏi 1: Condition Variable là gì và nó giải quyết vấn đề gì mà Mutex đơn thuần không giải quyết hiệu quả?

<details>
<summary>Đáp án</summary>

Mutex chỉ giải quyết bài toán loại trừ tương hỗ (Mutual Exclusion) — đảm bảo chỉ một luồng duy nhất thực thi bên trong miền găng. Nếu một luồng cần chờ một điều kiện trạng thái (Condition State) thỏa mãn mà chỉ dùng Mutex, luồng phải liên tục chiếm khóa, kiểm tra biến cờ rồi nhả khóa trong vòng lặp quay bận (*polling*), gây tiêu tốn chu kỳ CPU và nghẽn khóa nghiêm trọng.

**Condition Variable** là một hàng đợi chờ tường minh (Explicit Wait Queue) do hệ điều hành hoặc thư viện quản lý, cho phép luồng tự đưa mình vào giấc ngủ (*sleep*, trạng thái Blocked, giải phóng 100% CPU) khi điều kiện chưa thỏa mãn và chờ được đánh thức bởi một luồng khác.
</details>

### Câu Hỏi 2: Tại sao Condition Variable luôn phải đi kèm với một Mutex, và hàm `pthread_cond_wait(&cond, &mutex)` thực hiện những bước nào từ lúc được gọi đến lúc trả về?

<details>
<summary>Đáp án</summary>

Bản thân Condition Variable không tự lưu trữ trạng thái (không có biến cờ hay bộ đếm bên trong) mà chỉ là một hàng đợi chờ; trạng thái thực sự (như biến `count`, hàng đợi dữ liệu) được bảo vệ bởi Mutex.

Khi gọi `pthread_cond_wait(&cond, &mutex)`:
1. Hàm thực hiện **nguyên tử** hai hành động: nhả khóa `mutex` (để các luồng khác có thể vào miền găng thay đổi trạng thái) và đưa luồng gọi vào hàng đợi ngủ (*Wait Queue*) của biến điều kiện ở trạng thái Blocked.
2. Khi được đánh thức bởi `pthread_cond_signal` hoặc `pthread_cond_broadcast`, hàm chưa trả về ngay mà bắt buộc phải **tái chiếm lại khóa `mutex`** (*re-acquire the mutex*). Chỉ khi giành được quyền sở hữu Mutex, hàm mới chính thức trả về quyền điều khiển cho mã nguồn ứng dụng.
</details>

### Câu Hỏi 3: Tại sao việc nhả khóa Mutex và đưa luồng vào hàng đợi ngủ trong `pthread_cond_wait()` bắt buộc phải diễn ra một cách nguyên tử (atomic)?

<details>
<summary>Đáp án</summary>

Nếu hai hành động nhả khóa và đi ngủ diễn ra tách rời, có thể xảy ra lỗi **Tín hiệu thất lạc (Lost Wakeup)**: giả sử luồng Consumer vừa nhả Mutex nhưng chưa kịp vào hàng đợi ngủ thì CPU chuyển sang luồng Producer. Producer nạp dữ liệu và gọi `signal()`, nhưng vì Consumer chưa nằm trong danh sách ngủ nên tín hiệu bị phát vào không khí. Sau đó CPU quay lại Consumer và đưa nó vào giấc ngủ vĩnh viễn dù dữ liệu đã có sẵn. Tính nguyên tử của `pthread_cond_wait()` loại bỏ hoàn toàn kẽ hở thời gian này.
</details>

### Câu Hỏi 4: Ngữ nghĩa Mesa (Mesa Semantics) khác gì với Ngữ nghĩa Hoare (Hoare Semantics), và chuẩn POSIX pthreads sử dụng ngữ nghĩa nào?

<details>
<summary>Đáp án</summary>

- **Ngữ nghĩa Hoare (Hoare Semantics)**: Khi luồng A gọi `signal()`, CPU lập tức đình chỉ luồng A và chuyển giao quyền thực thi ngay tức khắc cho luồng B vừa được đánh thức. Do không có luồng nào chen ngang, trạng thái điều kiện được đảm bảo đúng 100%, nên có thể dùng `if` để kiểm tra.
- **Ngữ nghĩa Mesa (Mesa Semantics)** *(chuẩn mực của POSIX pthreads và các hệ điều hành hiện đại)*: Khi luồng A gọi `signal()`, luồng B chỉ được chuyển từ Wait Queue sang Ready Queue. Luồng B không chạy ngay mà phải chờ bộ lập lịch CPU phân bổ thời gian và phải cạnh tranh chiếm lại Mutex với các luồng khác. Trong khoảng thời gian này, một luồng C khác có thể nhanh chân chiếm Mutex trước và làm thay đổi trạng thái dữ liệu.
</details>

### Câu Hỏi 5: Hiện tượng Thức tỉnh giả (Spurious Wakeup) là gì và những nguyên nhân nào gây ra hiện tượng này?

<details>
<summary>Đáp án</summary>

Theo đặc tả chuẩn POSIX (`man 3 pthread_cond_wait`), **Thức tỉnh giả (Spurious Wakeup)** là hiện tượng một luồng đang ngủ trong `pthread_cond_wait()` đột ngột thức giấc và hàm trả về thành công dù hoàn toàn không có luồng nào gọi `pthread_cond_signal()` hay `pthread_cond_broadcast()`.

Nguyên nhân phát sinh:
- Nhân Linux Kernel tối ưu hóa cơ chế phân phối tín hiệu ngắt phần cứng hoặc tín hiệu hệ thống Unix (*Signals* như `SIGINT`, `SIGCHLD`).
- Các cuộc đua vi kiến trúc trên máy tính đa nhân khi đánh thức luồng từ `futex` wait queue.
</details>

### Câu Hỏi 6: Tại sao lập trình viên luôn phải đặt `pthread_cond_wait()` bên trong vòng lặp `while` thay vì câu lệnh `if`?

<details>
<summary>Đáp án</summary>

Vì cả hai lý do: **Ngữ nghĩa Mesa** và **hiện tượng Thức tỉnh giả (Spurious Wakeup)**.

- Dưới Ngữ nghĩa Mesa, một luồng khác có thể chen vào chiếm Mutex và lấy mất tài nguyên trước khi luồng vừa được đánh thức kịp giành lại Mutex.
- Với Thức tỉnh giả, luồng có thể tự thức dậy dù điều kiện chưa hề thay đổi.

Đặt `pthread_cond_wait()` trong vòng lặp `while (condition)` ép luồng khi thức dậy và chiếm lại được Mutex phải **kiểm tra lại điều kiện một lần nữa**. Nếu điều kiện vẫn chưa thỏa mãn, luồng sẽ tiếp tục quay lại ngủ an toàn, tránh lỗi đọc dữ liệu rỗng/rác dẫn đến sập ứng dụng (như `Segmentation Fault` hoặc `NullPointerException`).
</details>

### Câu Hỏi 7: Sự khác nhau giữa `pthread_cond_signal()` và `pthread_cond_broadcast()` là gì, và khi nào bắt buộc phải dùng `pthread_cond_broadcast()`?

<details>
<summary>Đáp án</summary>

- `pthread_cond_signal(&cond)`: Đánh thức **ít nhất một** luồng đang chờ trong hàng đợi. Phù hợp khi tất cả các luồng đang chờ có cùng chung một điều kiện và mỗi lần phát tín hiệu chỉ có đúng một luồng có thể tiến triển (như mô hình Producer-Consumer cơ bản).
- `pthread_cond_broadcast(&cond)`: Đánh thức **toàn bộ** các luồng đang chờ trong hàng đợi. **Bắt buộc sử dụng** khi các luồng đang chờ có các tiêu chí hoặc kích thước tài nguyên thỏa mãn khác nhau (ví dụ: cấp phát bộ nhớ động `malloc` đa luồng, luồng 1 cần 60 KB còn luồng 2 cần 20 KB). Nếu chỉ dùng `signal()` khi mới giải phóng 30 KB, hệ thống có thể đánh thức nhầm luồng cần 60 KB; luồng đó ngủ tiếp và khiến luồng cần 20 KB bị bỏ đói vĩnh viễn (*Thread Starvation*).
</details>

### Câu Hỏi 8: Trong mô hình Producer-Consumer Bounded Buffer dùng Pthreads, cần sử dụng bao nhiêu Mutex và bao nhiêu Condition Variables, vai trò của từng thành phần là gì?

<details>
<summary>Đáp án</summary>

Cần sử dụng **1 Mutex** và **2 Condition Variables**:
- **1 Mutex (`mutex`)**: Bảo vệ vùng đệm vòng (*Circular Buffer*) và các biến trạng thái dùng chung như `count`, `in`, `out`.
- **Condition Variable `cond_empty`**: Nơi luồng Producer ngủ chờ khi đệm bị ĐẦY (`count == BUFFER_SIZE`). Khi Consumer lấy dữ liệu ra khỏi đệm, Consumer gọi `pthread_cond_signal(&cond_empty)` để báo cho Producer biết đệm đã có chỗ trống.
- **Condition Variable `cond_fill`**: Nơi luồng Consumer ngủ chờ khi đệm bị RỖNG (`count == 0`). Khi Producer nạp dữ liệu mới vào đệm, Producer gọi `pthread_cond_signal(&cond_fill)` để báo cho Consumer biết đã có dữ liệu.
</details>

### Câu Hỏi 9: Tại sao vẫn có thể xảy ra cạm bẫy Tín hiệu thất lạc (Lost Wakeup) nếu gọi `pthread_cond_signal()` bên ngoài khóa Mutex, và cách phòng tránh là gì?

<details>
<summary>Đáp án</summary>

Nếu một luồng (như Manager) thay đổi biến trạng thái và gọi `pthread_cond_signal()` **bên ngoài khóa Mutex**, một luồng Worker khác có thể kiểm tra điều kiện ngay tại tích tắc trước khi biến trạng thái kịp cập nhật, thấy chưa thỏa mãn và chuẩn bị gọi `wait()`. Khi đó, tín hiệu `signal()` phát ra sẽ bị mất hút vào khoảng trống và luồng Worker ngủ mãi mãi.

**Cách phòng tránh**: Luôn cập nhật điều kiện trạng thái và ưu tiên phát tín hiệu `signal` hoặc `broadcast` trong khi vẫn đang nắm giữ Mutex (hoặc ngay sau khi chuẩn bị nhả Mutex có kiểm soát).
</details>
