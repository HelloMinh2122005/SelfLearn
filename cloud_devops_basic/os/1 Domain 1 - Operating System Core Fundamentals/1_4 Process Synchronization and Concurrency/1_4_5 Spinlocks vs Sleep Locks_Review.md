# Review: 1_4_5 Spinlocks vs Sleep Locks

### Câu Hỏi 1: Sự khác biệt cơ bản giữa Spinlock và Sleep Lock khi một luồng muốn vào miền găng nhưng khóa đang bị chiếm giữ là gì?

<details>
<summary>Đáp án</summary>

Khi khóa đang bị chiếm giữ (*lock is contended*), hai cơ chế xử lý trái ngược nhau:
- **Spinlock (Khóa bận)**: Luồng không từ bỏ CPU mà liên tục quay vòng lặp (*busy-waiting / polling*) để kiểm tra trạng thái khóa. Cách này đốt cháy 100% chu kỳ CPU nhưng không tốn chi phí Context Switch và có độ trễ phản hồi gần như `0 ns`, phù hợp khi thời gian giữ khóa siêu ngắn.
- **Sleep Lock (Khóa ngủ / Blocking Lock)**: Luồng chủ động gọi System Call vào Kernel để chuyển trạng thái từ `Running` sang `Blocked / Waiting`, nhường CPU cho tiến trình khác. Cách này tiết kiệm CPU nhưng tốn chi phí 2 lần Context Switch (khi đi ngủ và khi được đánh thức), phù hợp khi thời gian giữ khóa dài (như tác vụ I/O).
</details>

### Câu Hỏi 2: Spinlock dựa trên cơ chế phần cứng nào để hoạt động và "Quy tắc vàng" (Rule of Thumb) để lựa chọn giữa Spinlock và Sleep Lock là gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế phần cứng**: Spinlock dựa trên các chỉ lệnh nguyên tử phần cứng như `TestAndSet` hoặc `CompareAndSwap` trên một biến cờ nguyên tử để liên tục kiểm tra và chiếm khóa.
- **Quy tắc vàng (Rule of Thumb - OSTEP Ch. 28.16)**: Spinlock chỉ hiệu quả hơn về mặt kinh tế hiệu năng khi thời gian giữ khóa ngắn hơn hai lần thời gian chuyển đổi ngữ cảnh:
  $$\text{Thời gian giữ khóa (Lock Hold Time)} < 2 \times T_{\text{context\_switch}}$$
  (Trên máy chủ hiện đại, một lần chuyển đổi ngữ cảnh thường tốn khoảng $1 \text{ đến } 5 \ \mu\text{s}$).
  - Nếu miền găng chỉ cộng vài phép tính (tốn khoảng $50 \text{ ns}$), Spinlock tối ưu hơn hẳn việc ngủ rồi đánh thức.
  - Nếu miền găng thực hiện đọc ghi ổ đĩa hoặc kết nối mạng (tốn $1 \text{ ms}$ đến $10 \text{ ms}$), dùng Spinlock sẽ lãng phí hàng triệu chu kỳ CPU nên phải dùng Sleep Lock.
</details>

### Câu Hỏi 3: Tại sao sử dụng Spinlock trên hệ thống chỉ có 1 CPU Core vật lý lại gây ra lỗi nghiêm trọng, và Spinlock thực sự phù hợp với kiến trúc CPU nào?

<details>
<summary>Đáp án</summary>

- **Hiểm họa trên hệ thống đơn nhân (Uniprocessor Livelock)**: Giả sử Luồng 1 đang giữ Spinlock và bị chuyển ngữ cảnh sang Luồng 2 (do hết định mức thời gian hoặc Luồng 2 có độ ưu tiên cao hơn). Khi Luồng 2 cố chiếm Spinlock, nó sẽ quay vòng vô tận và chiếm trọn 100% thời gian của lõi CPU duy nhất đó. Do đó, Luồng 1 không bao giờ được cấp CPU để chạy tiếp và nhả khóa, dẫn đến bế tắc sống (*Livelock*) hoặc bỏ đói vĩnh viễn (*Priority Inversion Starvation*).
- **Kiến trúc phù hợp**: Spinlock chỉ thực sự phát huy giá trị trên các hệ thống vi xử lý đa nhân (**Symmetric Multiprocessing - SMP**), nơi luồng giữ khóa có thể chạy song song trên một core khác để nhanh chóng hoàn thành công việc và nhả khóa.
</details>

### Câu Hỏi 4: Tại sao bên trong các hàm xử lý ngắt phần cứng (Interrupt Service Routines - ISR) của nhân Linux bắt buộc phải sử dụng Spinlock thay vì Sleep Lock (như Mutex hay Semaphore)?

<details>
<summary>Đáp án</summary>

- Trong ngữ cảnh ngắt phần cứng (*Interrupt Context / ISR*), CPU tạm dừng luồng hiện tại để chạy hàm ISR, và hàm này không có cấu trúc tiến trình đại diện cụ thể (`current` là bất kỳ, không có ngữ cảnh tiến trình để Kernel lưu lại và lập lịch đánh thức sau đó).
- Do nguyên tắc nghiêm cấm ngủ trong ngữ cảnh ngắt (`Cannot sleep in interrupt context`), các Sleep Lock (vốn có thể đưa luồng vào trạng thái `Blocked`) không thể sử dụng trong ISR.
- Vì vậy, **Spinlock** (luôn giữ CPU hoạt động và không bao giờ ngủ) là cơ chế khóa duy nhất hợp lệ bên trong các hàm xử lý ngắt.
</details>

### Câu Hỏi 5: Hiện tượng Self-Deadlock liên quan đến ngắt khi dùng Spinlock trong Linux Kernel xảy ra như thế nào và hàm `spin_lock_irqsave` giải quyết vấn đề này ra sao?

<details>
<summary>Đáp án</summary>

- **Hiện tượng Self-Deadlock**: Giả sử một tiến trình thông thường trên Core 0 đang giữ Spinlock `lock_A`. Đúng lúc đó, một ngắt phần cứng xảy ra trên chính Core 0 khiến CPU nhảy vào ISR, và ISR cũng cố gắng chiếm `lock_A`. ISR bắt đầu quay vòng chờ `lock_A`, nhưng tiến trình đang giữ `lock_A` lại bị chính ISR này chặn đứng trên cùng một CPU Core 0, dẫn đến ISR quay vòng vĩnh viễn và làm Kernel treo cứng (*Self-Deadlock*).
- **Giải pháp**: Khi chiếm Spinlock có khả năng được dùng bởi hàm xử lý ngắt, nhân Linux bắt buộc dùng cặp hàm `spin_lock_irqsave(&lock, flags)` và `spin_unlock_irqrestore(&lock, flags)`. Hàm `spin_lock_irqsave` sẽ **vô hiệu hóa ngắt cục bộ trên lõi CPU đó** (*disable local IRQs*) và lưu lại cờ trạng thái trước khi chiếm khóa, ngăn ngắt chen ngang vào giữa miền găng.
</details>

### Câu Hỏi 6: Cơ chế Linux `futex(2)` (Fast Userspace Mutex) vận hành theo mô hình hai pha như thế nào để kết hợp ưu điểm của Spinlock và Sleep Lock?

<details>
<summary>Đáp án</summary>

Một Futex về bản chất là một số nguyên 32-bit trong bộ nhớ người dùng, vận hành theo hai pha:
1. **Pha Nhanh (Fastpath - User Space)**: Khi không có tranh chấp (*uncontended case*), luồng thực hiện chỉ lệnh nguyên tử `atomic_CAS(lock_val, 0, 1)` ngay tại User Space (Ring 3). Nếu thành công, luồng chiếm khóa trong vài nano-giây mà **không tốn bất kỳ System Call nào vào Kernel** (nhanh như Spinlock).
2. **Pha Chậm (Slowpath - Kernel Space)**: Chỉ khi CAS thất bại do khóa đang bị chiếm giữ, luồng mới gọi System Call `futex(uaddr, FUTEX_WAIT, val, ...)` để Kernel chuyển trạng thái luồng sang `Blocked` và đưa vào hàng đợi chờ (*wait queue*), giải phóng 100% CPU (như Sleep Lock). Khi nhả khóa, luồng giữ khóa gọi `futex(uaddr, FUTEX_WAKE, 1)` để đánh thức luồng đang ngủ.
</details>

### Câu Hỏi 7: Trong bài thực hành với `strace -c -e futex`, kết quả quan sát chứng minh điều gì về cách hoạt động của `pthread_mutex_t` trên Linux?

<details>
<summary>Đáp án</summary>

Trong ví dụ thực hành với 4 luồng và tổng cộng **800.000 lần** chiếm/nhả khóa (`4 threads x 200.000 ops`), kết quả từ `strace` chỉ ghi nhận đúng **1.420 lần** gọi System Call `futex` (chỉ xảy ra khi có tranh chấp thực sự giữa các luồng).

Hơn 798.000 lần còn lại được thực hiện hoàn toàn ở User Space thông qua pha nhanh (Fastpath) của Futex với **0 System Calls**, chứng minh hiệu quả tối ưu hóa của `pthread_mutex_t` khi không có tranh chấp.
</details>

### Câu Hỏi 8: Điều gì xảy ra nếu lập trình viên gọi các hàm có khả năng ngủ (như `kmalloc(..., GFP_KERNEL)` hoặc `copy_from_user()`) khi đang giữ Spinlock trong nhân Linux?

<details>
<summary>Đáp án</summary>

Các hàm như `kmalloc` với cờ `GFP_KERNEL` hoặc `copy_from_user()` có thể đưa luồng vào trạng thái ngủ (ví dụ khi bộ nhớ khan hiếm). Việc **ngủ trong khi đang giữ Spinlock là vi phạm nghiêm trọng trong Linux Kernel**.

Cơ chế kiểm tra lỗi của Kernel sẽ kích hoạt cảnh báo `BUG: scheduling while atomic` hoặc `might_sleep()`, dẫn đến sập nhân hệ điều hành (*Kernel Panic*). Do đó, tuyệt đối không gọi bất kỳ hàm nào có khả năng ngủ (I/O, cấp phát RAM lớn, semaphore) khi đang giữ Spinlock.
</details>

### Câu Hỏi 9: Tại sao việc lạm dụng Spinlock ở User Space lại gây ra sự cố nghiêm trọng trong môi trường Kubernetes Pod có giới hạn CPU (`resources.limits.cpu`)?

<details>
<summary>Đáp án</summary>

Khi ứng dụng chạy trong Pod có giới hạn CPU, nếu luồng đang giữ Spinlock bị bộ lập lịch CFS của Linux ngắt quyền thực thi do hết hạn ngạch CPU (*CPU Throttling*), các luồng khác trên các core còn lại sẽ liên tục **quay vòng Spinlock**.

Vòng lặp quay bận này đốt cháy cạn kiệt phần hạn ngạch CPU còn lại của container chỉ trong chốc lát, khiến toàn bộ Pod bị Kernel cưỡng chế đóng băng (*Throttle*) cho đến hết chu kỳ định thời, gây phản hồi cực chậm và nghẽn mạng. Vì vậy, trong môi trường container và Cloud chia sẻ tài nguyên, nên ưu tiên dùng **Futex Mutex** thay cho Spinlock thuần túy.
</details>

### Câu Hỏi 10: Hiện tượng Đảo ngược độ ưu tiên (Priority Inversion) xảy ra với Spinlock như thế nào và hướng khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Kịch bản xảy ra**: Một luồng có độ ưu tiên thấp ($L$) đang chiếm Spinlock. Sau đó một luồng có độ ưu tiên cao ($H$) xuất hiện và cần chiếm Spinlock đó. Luồng $H$ chiếm trọn 100% CPU để quay vòng chờ khóa, khiến luồng $L$ không bao giờ được cấp thời gian CPU để chạy tiếp và nhả khóa, làm hệ thống bị tê liệt.
- **Cách khắc phục**: Trong các hệ thống thời gian thực (*Real-Time OS*), cần áp dụng giao thức **Thừa kế độ ưu tiên (Priority Inheritance Protocol)** hoặc sử dụng khóa ngủ có hỗ trợ **PI Mutex**.
</details>
