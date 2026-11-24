# Review: 1_4_3 Hardware Synchronization Primitives

### Câu Hỏi 1: Tại sao các thuật toán đồng bộ hóa thuần phần mềm (như thuật toán Dekker hay Peterson) không thể đảm bảo loại trừ tương hỗ một cách tin cậy trên máy tính hiện đại, và phần cứng cung cấp hai nhóm công cụ cốt lõi nào để giải quyết?

<details>
<summary>Đáp án</summary>

- **Lý do phần mềm thuần túy thất bại**: Các thuật toán cổ điển giả định mọi thao tác đọc/ghi vào bộ nhớ diễn ra tuần tự đúng theo thứ tự từng dòng code (*Sequential Consistency*). Trên kiến trúc hiện đại với bộ xử lý đa nhân (*multi-core*), kỹ thuật thực thi ngoài trật tự (*out-of-order execution*), bộ nhớ đệm ghi trì hoãn (*store buffers*) và tối ưu hóa của trình biên dịch (*compiler reordering*), giả định này bị phá vỡ khiến các lõi CPU có thể nhìn thấy các biến cờ ở các trật tự khác nhau.
- **Hai nhóm công cụ phần cứng cốt lõi**:
  1. **Các chỉ lệnh nguyên tử (Atomic Read-Modify-Write Instructions)**: như Test-and-Set (`xchg`), Compare-and-Swap (`cmpxchg` + `lock`), và Load-Linked / Store-Conditional (`LL`/`SC`).
  2. **Các rào cản bộ nhớ (Memory Barriers / Fences)**: gồm Compiler Barrier và CPU Memory Fence (`mfence`, `lfence`, `sfence`, `dmb`).
</details>

### Câu Hỏi 2: Theo giáo trình OSTEP (Chương 28), một thao tác được gọi là nguyên tử (Atomic) có bản chất như thế nào?

<details>
<summary>Đáp án</summary>

Một thao tác được gọi là **Nguyên tử (Atomic)** khi nó được phần cứng CPU thực thi trọn vẹn như một khối duy nhất: hoặc là toàn bộ thao tác hoàn thành thành công, hoặc là không có gì thay đổi; tuyệt đối không thể có bất kỳ ngắt phần cứng, ngắt đồng hồ hay luồng tính toán nào khác xen ngang vào giữa.
</details>

### Câu Hỏi 3: Chỉ lệnh Test-and-Set (`xchg` trên kiến trúc x86) hoạt động như thế nào và được dùng để xây dựng Spinlock ra sao?

<details>
<summary>Đáp án</summary>

- **Hành vi logic**: `TestAndSet(int *old_ptr, int new_val)` thực hiện trọn vẹn trong một thao tác nguyên tử: đọc giá trị cũ tại `*old_ptr`, ghi giá trị `new_val` vào `*old_ptr`, rồi trả về giá trị cũ đó.
- **Hiện thực phần cứng và ứng dụng làm Spinlock**:
  - Trên x86, chỉ lệnh `xchg` tự động khóa bus hoặc đường truyền bộ nhớ đệm (*cache line*) để hoán đổi nguyên tử giữa thanh ghi và ô nhớ RAM.
  - Quy ước `0` là khóa mở, `1` là khóa đang bị chiếm: luồng gọi Test-and-Set để ghi giá trị `1`. Nếu nhận về giá trị cũ là `0`, luồng chiếm khóa thành công; nếu nhận về `1`, khóa đang bận nên luồng phải tiếp tục lặp chờ (*busy-wait*).
</details>

### Câu Hỏi 4: Chỉ lệnh Compare-and-Swap (CAS) nhận vào những tham số nào và cơ chế hoạt động của nó diễn ra ra sao?

<details>
<summary>Đáp án</summary>

- **Ba tham số đầu vào**: con trỏ ô nhớ cần kiểm tra (`ptr`), giá trị kỳ vọng (`expected`), và giá trị mới muốn cập nhật (`new_val`).
- **Cơ chế hoạt động**:
  - CPU so sánh nội dung hiện tại tại `*ptr` với `expected`.
  - Nếu **bằng nhau**: CPU ghi đè `new_val` vào ô nhớ `*ptr`.
  - Nếu **không bằng nhau** (do luồng khác đã thay đổi dữ liệu trước đó): CPU giữ nguyên giá trị ô nhớ và trả về giá trị thực tế đang có để phần mềm biết thao tác cập nhật chưa xảy ra.
</details>

### Câu Hỏi 5: Trên kiến trúc x86 đa nhân, tiền tố `LOCK` trong `lock cmpxchg` có vai trò gì, và tại sao CAS là nền tảng của các cấu trúc dữ liệu Lock-Free?

<details>
<summary>Đáp án</summary>

- **Vai trò của tiền tố `LOCK`**: Để `cmpxchg` giữ được tính nguyên tử trên hệ thống nhiều lõi CPU, trình biên dịch phải chèn tiền tố `lock`. Tín hiệu này kích hoạt giao thức duy trì nhất quán bộ nhớ đệm (như *MESI Protocol*) để khóa đường truyền *cache line* của ô nhớ đó, ngăn không cho lõi nào khác ghi đồng thời.
- **Nền tảng của Lock-Free**: Thay vì dùng khóa làm các luồng khác phải ngủ hoặc dừng chờ, thuật toán Lock-Free dùng vòng lặp thử lại lạc quan (*Optimistic Retry Loop*): đọc giá trị hiện tại, tính toán giá trị mới, rồi gọi CAS. Nếu không có tranh chấp, CAS thành công ngay; nếu có luồng khác vừa ghi đè trước, CAS thất bại an toàn và luồng chỉ việc đọc lại giá trị mới để thử lại (như trong `java.util.concurrent.atomic` của Java hay `sync/atomic` của Go), giúp tránh deadlock và luôn có ít nhất một luồng tiến triển.
</details>

### Câu Hỏi 6: Cặp chỉ lệnh Load-Linked / Store-Conditional (LL/SC) trên các kiến trúc RISC (như ARMv8, RISC-V) hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

Thay vì dùng một chỉ lệnh đơn phức tạp như CAS, kiến trúc RISC tách làm hai bước phối hợp với nhau:
- **`Load-Linked (LL)`** (ví dụ `LDREX` trên ARMv8, `lr` trên RISC-V): Nạp giá trị từ ô nhớ và đặt một cờ giám sát phần cứng (*hardware monitor*) theo dõi ô nhớ đó.
- **`Store-Conditional (SC)`** (ví dụ `STREX` trên ARMv8, `sc` trên RISC-V): Chỉ cho phép ghi giá trị mới vào ô nhớ nếu từ thời điểm gọi `LL` đến thời điểm gọi `SC` **chưa có bất kỳ luồng hay vi xử lý nào khác ghi đè vào ô nhớ đó**. Nếu có sự can thiệp, `SC` sẽ thất bại và trả về mã lỗi để phần mềm thử lại.
</details>

### Câu Hỏi 7: Hai nguyên nhân nào gây ra hiện tượng tái sắp xếp trật tự thực thi đọc/ghi bộ nhớ (Memory Reordering), và điều gì khiến việc chỉ có chỉ lệnh nguyên tử vẫn chưa đủ?

<details>
<summary>Đáp án</summary>

Chỉ lệnh nguyên tử chỉ bảo vệ từng thao tác đọc-sửa-ghi đơn lẻ, không ngăn được việc đảo thứ tự giữa các lệnh đọc/ghi bộ nhớ khác nhau. Để tối đa hóa hiệu năng, cả trình biên dịch và CPU đều tái sắp xếp trật tự thực thi miễn sao không làm đổi kết quả của một luồng đơn lẻ:
1. **Trình biên dịch (Compiler Reordering)**: Ở các mức tối ưu hóa (`-O2`/`-O3`), trình biên dịch có thể đổi chỗ các câu lệnh gán biến độc lập hoặc gom thao tác đọc biến vào thanh ghi.
2. **Phần cứng CPU (Out-of-Order Execution & Store Buffers)**: CPU thực thi lệnh ngoài trật tự và đẩy dữ liệu ghi vào bộ đệm tạm **Store Buffer** thay vì ghi thẳng ngay xuống RAM chậm, khiến các lõi khác có thể quan sát thứ tự cập nhật các biến hoàn toàn trái ngược nhau.
</details>

### Câu Hỏi 8: Store Buffer gây ra lỗi gì trong ví dụ hai luồng giao tiếp qua biến `data` và `flag`?

<details>
<summary>Đáp án</summary>

Xét kịch bản `data = 0`, `flag = 0`:
- **Luồng 1 (Producer)** thực hiện: `data = 42;` rồi `flag = 1;`.
- **Luồng 2 (Consumer)** thực hiện: `while (flag == 0);` rồi `print(data);`.

Do cơ chế **Store Buffer** và **Out-of-Order Execution** (hoặc trình biên dịch đảo thứ tự), việc ghi `flag = 1` có thể hiển thị ra cho Luồng 2 trước khi giá trị `data = 42` kịp được xả ra bộ nhớ chung. Hậu quả là Luồng 2 thấy `flag == 1`, thoát vòng chờ và đọc phải giá trị cũ `data = 0` (dữ liệu rác).
</details>

### Câu Hỏi 9: Hãy phân biệt Rào cản Trình biên dịch (Compiler Barrier) và Rào cản Phần cứng (Hardware Memory Barrier) về mục đích, mã máy sinh ra và phạm vi hiệu lực.

<details>
<summary>Đáp án</summary>

| Đặc tính | Compiler Barrier | Hardware Memory Barrier |
| :--- | :--- | :--- |
| **Mục đích** | Ngăn trình biên dịch di chuyển lệnh đọc/ghi qua ranh giới khi tối ưu hóa | Ép CPU xả **Store Buffer** và tuần tự hóa việc đọc/ghi RAM giữa các lõi CPU |
| **Ví dụ trong C/Linux** | `barrier()` (`__asm__ __volatile__("": : :"memory")`) | `smp_mb()`, `mfence`, `lfence`, `sfence` (x86), `dmb` (ARM) |
| **Mã máy sinh ra** | **Không sinh ra mã máy nào (0 instructions)** | Sinh ra chỉ lệnh máy cụ thể cho CPU thực thi |
| **Phạm vi hiệu lực** | Chỉ có tác dụng trong lúc biên dịch mã nguồn; không ngăn được CPU đảo lệnh khi chạy | Có hiệu lực thời gian thực trên bus phần cứng và các lõi CPU |
</details>

### Câu Hỏi 10: Trong đoạn mã C dùng GCC/Clang built-in intrinsics ở bài học, các hàm `__atomic_test_and_set`, `__atomic_clear`, `__atomic_compare_exchange_n` và chỉ lệnh `pause` có công dụng gì?

<details>
<summary>Đáp án</summary>

- **`__atomic_test_and_set(..., __ATOMIC_ACQUIRE)`**: Tương đương chỉ lệnh `xchg` trên x86; gán cờ khóa thành `1` và trả về giá trị cũ để kiểm tra xem có chiếm được Spinlock hay không.
- **`__atomic_clear(..., __ATOMIC_RELEASE)`**: Giải phóng khóa về `0` đồng thời thiết lập *Release Memory Barrier*.
- **`__atomic_compare_exchange_n(..., __ATOMIC_SEQ_CST, __ATOMIC_SEQ_CST)`**: Tương đương `LOCK CMPXCHG` trên x86; kiểm tra biến chia sẻ có khớp giá trị kỳ vọng không, nếu khớp thì ghi giá trị mới và trả về `true`, nếu sai thì trả về `false` và tự động nạp giá trị thực tế mới vào biến kỳ vọng để vòng lặp *Lock-Free CAS* thử lại.
- **Chỉ lệnh `pause` (`__builtin_ia32_pause()`)**: Là chỉ lệnh CPU x86 giúp tối ưu hóa pipeline và giảm tải cho bộ dự đoán rẽ nhánh khi luồng đang quay vòng chờ bận (*busy-wait*).
</details>

### Câu Hỏi 11: Vấn đề ABA (The ABA Problem) trong vòng lặp Compare-and-Swap là gì, gây hậu quả gì và cách khắc phục ra sao?

<details>
<summary>Đáp án</summary>

- **Hiện tượng**: Luồng 1 đọc ô nhớ thấy giá trị `A`. Trước khi Luồng 1 gọi CAS, Luồng 2 chen vào đổi ô nhớ thành `B`, rồi lại đổi ngược về `A`. Khi Luồng 1 chạy lệnh CAS, nó thấy ô nhớ vẫn là `A` (khớp giá trị kỳ vọng) nên thực hiện ghi đè thành công dù dữ liệu thực chất đã bị thay đổi qua lại.
- **Hiểm họa**: Trong cấu trúc dữ liệu dùng con trỏ (như *Lock-Free Stack/Queue*), nút `A` có thể đã bị giải phóng (`free(A)`) và cấp phát lại cho mục đích khác, dẫn đến lỗi giải phóng hai lần (*Double Free*), *Use-After-Free* hoặc hỏng cấu trúc heap (*Heap Corruption*).
- **Cách khắc phục**: Dùng kỹ thuật **Đánh dấu phiên bản (Tagged Pointers / Double-Word CAS - `CMPXCHG16B` trên x86_64)** để gắn thêm bộ đếm phiên bản vào con trỏ: `(Pointer, Version)`. Khi giá trị đi từ `(A, 1)` $\rightarrow$ `(B, 2)` $\rightarrow$ `(A, 3)`, lệnh CAS so sánh `(A, 1)` với `(A, 3)` sẽ phát hiện sự thay đổi và từ chối cập nhật.
</details>

### Câu Hỏi 12: Hiện tượng "bão cache line" (Cache Line Bouncing) do tiền tố `LOCK` xảy ra khi nào và khắc phục bằng kỹ thuật gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân & Hiện tượng**: Tiền tố `LOCK` ép giao thức nhất quán cache (*MESI Cache Coherence Protocol*) phải liên tục gửi tín hiệu hủy hiệu lực (*Invalidation*) đến mọi lõi CPU khác đang giữ *cache line* đó. Khi nhiều lõi CPU (ví dụ 64 lõi) cùng liên tục gọi thao tác nguyên tử như `atomic_fetch_add` trên **một biến đếm toàn cục duy nhất**, *cache line* đó liên tục bị "ném qua ném lại" giữa các bộ nhớ đệm L1/L2, làm nghẽn *CPU Interconnect* và khiến hiệu năng đa nhân giảm mạnh.
- **Cách khắc phục**: Chia nhỏ biến đếm theo từng lõi CPU (**Per-CPU Counters**, hoặc **`LongAdder`** trong Java) và chỉ cộng tổng khi cần đọc giá trị.
</details>

### Câu Hỏi 13: Sự khác biệt về mô hình bộ nhớ giữa x86 và ARM gây ra cạm bẫy gì khi chuyển đổi hệ thống đa luồng, và đâu là thực tiễn tốt nhất để phòng tránh?

<details>
<summary>Đáp án</summary>

- **Khác biệt mô hình bộ nhớ**:
  - **x86 (Strong Memory Model / TSO - Total Store Order)**: Duy trì trật tự đọc/ghi rất nghiêm ngặt (đọc không vượt trước đọc, ghi không vượt trước ghi). Vì vậy code C/C++ thiếu Memory Barrier thường vô tình vẫn chạy đúng trên máy chủ Intel/AMD x86.
  - **ARM (Weak Memory Model)**: Như trên Apple Silicon M1/M2/M3 hay AWS Graviton, CPU được phép đảo trật tự hầu hết mọi thao tác đọc/ghi để tối ưu điện năng và xung nhịp.
- **Cạm bẫy**: Một chương trình đa luồng viết thiếu Memory Barrier chạy ổn định nhiều năm trên x86 có thể lập tức phát sinh lỗi sai lệch dữ liệu ngẫu nhiên khi biên dịch và triển khai sang máy chủ ARM.
- **Thực tiễn tốt nhất**: Luôn sử dụng các chuẩn trừu tượng hóa của ngôn ngữ (như **C11/C++11 `std::atomic`** với các cờ `memory_order_acquire`, `memory_order_release`, `memory_order_seq_cst`) thay vì tự viết mã hợp ngữ phụ thuộc kiến trúc phần cứng cụ thể.
</details>
