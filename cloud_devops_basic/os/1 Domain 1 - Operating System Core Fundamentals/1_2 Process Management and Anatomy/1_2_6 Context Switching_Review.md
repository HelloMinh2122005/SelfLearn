# Review: 1_2_6 Context Switching

### Câu Hỏi 1: Chuyển đổi ngữ cảnh (Context Switching) là gì và nó giúp hệ điều hành tạo ra cơ chế gì?

<details>
<summary>Đáp án</summary>

- **Định nghĩa**: Theo giáo trình *Operating Systems: Three Easy Pieces (OSTEP)* Chương 6, chuyển đổi ngữ cảnh là quy trình kỹ thuật mà qua đó hệ điều hành tạm thời đình chỉ việc thực thi của một tiến trình đang chạy (outgoing process) và khôi phục trạng thái để tiếp tục chạy một tiến trình khác (incoming process) trên cùng một nhân vi xử lý (CPU core).
- **Mục đích**: Trong hệ điều hành đa nhiệm (Multitasking Operating System), cơ chế này tạo ra ảo ảnh rằng hàng chục hoặc hàng trăm chương trình đang chạy đồng thời (Time-sharing).

</details>

### Câu Hỏi 2: Quy trình chuyển đổi ngữ cảnh tầng thấp trong nhân hệ điều hành diễn ra theo những bước chính nào?

<details>
<summary>Đáp án</summary>

Khi xảy ra ngắt (ví dụ Timer Interrupt), CPU chuyển sang Kernel Mode (Ring 0) và hạt nhân thực thi hàm hợp ngữ (như `switch()` trong OSTEP hoặc `__switch_to()` trong Linux kernel) qua các bước chính sau:
1. **Lưu ngữ cảnh của tiến trình cũ**: Lưu các thanh ghi CPU (thanh ghi đa năng, con trỏ lệnh `PC/RIP`, con trỏ ngăn xếp `RSP`, cờ trạng thái) vào ngăn xếp hạt nhân (**Kernel Stack**) hoặc cấu trúc PCB của tiến trình cũ.
2. **Chuyển đổi con trỏ ngăn xếp hạt nhân**: Cập nhật con trỏ ngăn xếp `%rsp` từ Kernel Stack của tiến trình cũ sang Kernel Stack của tiến trình mới do bộ lập lịch (Scheduler) chọn.
3. **Nạp lại thanh ghi cơ sở bảng phân trang (`CR3`)**: Nếu chuyển sang tiến trình có không gian địa chỉ khác trên kiến trúc x86-64, nạp lại thanh ghi `CR3` để trỏ tới bảng trang bộ nhớ ảo của tiến trình mới.
4. **Khôi phục ngữ cảnh của tiến trình mới**: Nạp lại các thanh ghi CPU đã lưu trước đó từ Kernel Stack của tiến trình mới.
5. **Quay trở lại User Mode**: Thực thi chỉ lệnh `return-from-trap` (ví dụ `IRETQ` hoặc `SYSRETQ`) để đưa CPU về lại User Mode (Ring 3) và tiếp tục chạy tiến trình mới đúng tại vị trí nó đã dừng trước đó.

</details>

### Câu Hỏi 3: Chi phí trực tiếp (Direct Overhead) của một lần chuyển đổi ngữ cảnh bao gồm những gì và tiêu tốn khoảng bao nhiêu thời gian?

<details>
<summary>Đáp án</summary>

- **Bản chất**: Chi phí trực tiếp là thời gian CPU trực tiếp thực thi các chỉ lệnh hợp ngữ để chuyển đổi ngữ cảnh, cụ thể gồm:
  - Lưu và khôi phục hàng chục thanh ghi CPU (General-Purpose Registers, Segment Registers, và FP/SIMD Registers nếu có).
  - Cập nhật con trỏ ngăn xếp hạt nhân (`%rsp`).
  - Nạp lại thanh ghi điều khiển cơ sở bảng phân trang `CR3` (trên kiến trúc x86-64).
- **Thời gian tiêu tốn**: Có thể đo đạc chính xác, thường mất từ **vài trăm nano-giây đến vài micro-giây** tùy thuộc vào vi kiến trúc vi xử lý.

</details>

### Câu Hỏi 4: Vì sao chi phí gián tiếp (Indirect Overhead) thường đắt đỏ hơn nhiều so với chi phí trực tiếp?

<details>
<summary>Đáp án</summary>

Chi phí trực tiếp chỉ mất vài trăm nano-giây để chạy lệnh hợp ngữ, trong khi chi phí gián tiếp bắt nguồn từ việc làm xáo trộn các tầng bộ nhớ đệm phần cứng của CPU, ảnh hưởng kéo dài trong hàng nghìn chu kỳ lệnh tiếp theo:
1. **Mất hiệu lực TLB (TLB Invalidation / Flushing)**: Khi nạp lại thanh ghi `CR3`, theo mặc định CPU phải xả sạch TLB, gây ra hàng loạt **TLB Misses** và buộc MMU phải thực hiện thao tác duyệt cây bảng trang trong RAM vật lý (**Page Table Walk**) tốn hàng trăm chu kỳ CPU.
2. **Ô nhiễm bộ nhớ đệm CPU (CPU Cache Pollution & Cache Misses)**: Dữ liệu và chỉ lệnh của tiến trình mới chưa có trong các tầng cache L1, L2, L3 (**Cold Cache**). CPU liên tục gặp **CPU Cache Misses** và phải dừng chờ nạp dữ liệu từ bộ nhớ chính RAM (chậm hơn cache từ 100 đến 200 lần) cho đến khi làm ấm lại tập dữ liệu làm việc (*warm up its working set*).

</details>

### Câu Hỏi 5: Thanh ghi `CR3` và bộ đệm TLB liên quan với nhau như thế nào khi chuyển đổi tiến trình, và phần cứng hiện đại tối ưu vấn đề này bằng cơ chế gì?

<details>
<summary>Đáp án</summary>

- **Mối liên hệ giữa `CR3` và TLB**:
  - **TLB (Translation Lookaside Buffer)** là bộ nhớ đệm phần cứng siêu tốc lưu các bản dịch từ địa chỉ ảo sang địa chỉ vật lý.
  - Trên x86-64, khi hệ điều hành chuyển sang tiến trình khác và nạp lại thanh ghi `CR3` (trỏ tới bảng trang của tiến trình mới), theo mặc định CPU phải **xả sạch toàn bộ TLB (TLB Flush)** để tránh tiến trình mới dùng nhầm ánh xạ bộ nhớ của tiến trình cũ.
- **Giải pháp phần cứng hiện đại (ASID / PCID)**:
  - Các CPU hiện đại gắn nhãn không gian địa chỉ cho từng mục trong TLB thông qua **ASID (Address Space Identifier)** trên ARM hoặc **PCID (Process-Context Identifier)** — trường 12-bit trên x86-64 (được nhân Linux hỗ trợ qua cấu hình `CONFIG_X86_PCID`).
  - Nhờ nhãn định danh này, TLB có thể lưu giữ đồng thời bản dịch của nhiều tiến trình mà không cần xả sạch toàn bộ TLB mỗi lần switch, giúp giảm đáng kể chi phí gián tiếp.
  - *Lưu ý trong ảo hóa*: Trên máy ảo KVM/VMware, cần đảm bảo đã kích hoạt cờ CPU `pcid` và `invpcid` để tận dụng tối đa cơ chế này.

</details>

### Câu Hỏi 6: Phân biệt chuyển đổi ngữ cảnh tự nguyện (Voluntary) và cưỡng bức (Non-voluntary) trên Linux?

<details>
<summary>Đáp án</summary>

Theo tài liệu hướng dẫn Linux (`man 1 pidstat`, `man 8 vmstat`), hạt nhân theo dõi hai loại chuyển đổi ngữ cảnh độc lập:
1. **Voluntary Context Switch (`cswch/s` — Tự nguyện)**:
   - Xảy ra khi tiến trình **tự nguyện nhường quyền kiểm soát CPU**.
   - **Nguyên nhân điển hình**: Tiến trình thực hiện lời gọi hệ thống chờ tài nguyên ngoại vi (đọc/ghi đĩa cứng, chờ dữ liệu từ socket mạng), gọi `sleep()`, hoặc bị block khi chờ giải phóng khóa tương tranh (**Mutex lock / Semaphore**).
2. **Non-voluntary Context Switch (`nvcswch/s` — Cưỡng bức / Không tự nguyện)**:
   - Xảy ra khi tiến trình **bị hệ điều hành tước quyền kiểm soát CPU một cách bắt buộc**.
   - **Nguyên nhân điển hình**: Tiến trình dùng hết hạn mức thời gian CPU được cấp (**Time-slice Expiration**) và bị Timer Interrupt ngắt, hoặc một tiến trình khác có mức ưu tiên cao hơn thức dậy và chiếm quyền (**Preemption**).

</details>

### Câu Hỏi 7: Lệnh `vmstat` giúp theo dõi chuyển đổi ngữ cảnh toàn hệ thống qua chỉ số nào và cần chú ý thêm các cột liên quan nào?

<details>
<summary>Đáp án</summary>

Có thể chạy `vmstat 1 5` (lấy mẫu mỗi 1 giây trong 5 lần) để quan sát thống kê hệ thống theo thời gian thực:
- **Cột `cs` (Context Switches)** dưới nhóm `-system-`: Cho biết **tổng số lần chuyển đổi ngữ cảnh diễn ra trên toàn bộ hệ thống trong mỗi giây**. Ở máy chủ bình thường, `cs` dao động từ vài trăm đến vài nghìn lần/giây; nếu vọt lên hàng trăm nghìn hoặc hàng triệu là dấu hiệu bão chuyển đổi ngữ cảnh.
- **Các cột liên quan khác**:
  - **`r` (Run queue)**: Số lượng tiến trình đang ở trạng thái Ready/Running.
  - **`in` (Interrupts)**: Số lượng ngắt hệ thống phát sinh mỗi giây.

</details>

### Câu Hỏi 8: Làm thế nào để phân tích đặc điểm tải công việc (I/O-bound vs CPU-bound) của từng tiến trình bằng lệnh `pidstat`?

<details>
<summary>Đáp án</summary>

Sử dụng lệnh `pidstat -w 1 3` (thuộc gói `sysstat`) để xem tần suất hai loại chuyển đổi ngữ cảnh của từng tiến trình mỗi giây:
- **Tác vụ I/O-bound / Event-driven** (ví dụ `nginx`): Có chỉ số **`cswch/s` rất cao** và `nvcswch/s` thấp, vì tiến trình liên tục tự nguyện nhường CPU khi chờ đọc/ghi socket mạng (qua `epoll`) hoặc đĩa.
- **Tác vụ CPU-bound** (ví dụ `ffmpeg`): Có chỉ số **`nvcswch/s` rất cao** và `cswch/s` thấp, vì tiến trình vắt kiệt thời gian tính toán trên CPU và liên tục bị bộ lập lịch tước quyền điều khiển cưỡng bức khi hết lượng tử thời gian (time-slice).

</details>

### Câu Hỏi 9: Hiện tượng Context Switch Storm và CPU Thrashing là gì, nguyên nhân phổ biến gây ra chúng trong thực tế sản xuất là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân phổ biến**: Lập trình viên cấu hình kích thước Thread Pool quá lớn (ví dụ 1000–2000 luồng trong dịch vụ Java Spring Boot hoặc Python backend) trên máy chủ ảo chỉ có ít core (4 hoặc 8 vCPU).
- **Diễn biến và hậu quả**:
  - Hàng nghìn luồng cạnh tranh số core CPU ít ỏi và tranh giành khóa dùng chung (**Lock Contention**).
  - Tần suất chuyển đổi ngữ cảnh (`cs` trong `vmstat`) tăng vọt lên hàng triệu lần mỗi giây (**Context Switch Storm**).
  - Dẫn tới **CPU Thrashing**: CPU tiêu tốn **40%–70% tổng năng lực tính toán** chỉ để lưu/nạp thanh ghi của hệ điều hành (cột `%sy` tăng cao) và chịu tổn thất trượt Cache/TLB, làm thời gian xử lý mã nghiệp vụ (`%us`) sụp đổ và ứng dụng bị treo/không phản hồi (*hang/unresponsive*).

</details>

### Câu Hỏi 10: Theo thực tiễn sản xuất trong bài học, nên thiết kế mô hình luồng xử lý như thế nào cho tác vụ CPU-bound và I/O-bound để tránh bão chuyển đổi ngữ cảnh?

<details>
<summary>Đáp án</summary>

- **Với tác vụ thuần tính toán (CPU-bound)**: Kích thước Thread Pool tối ưu nên đặt **bằng đúng số CPU Core** (`N_threads = N_cores`).
- **Với tác vụ I/O mạng (I/O-bound)**: Ưu tiên sử dụng mô hình **lập trình bất đồng bộ không chặn (Non-blocking I/O)** như Node.js, Go Goroutines, Netty, hoặc Java 21 Virtual Threads thay vì tạo ra hàng nghìn kernel threads truyền thống.

</details>
