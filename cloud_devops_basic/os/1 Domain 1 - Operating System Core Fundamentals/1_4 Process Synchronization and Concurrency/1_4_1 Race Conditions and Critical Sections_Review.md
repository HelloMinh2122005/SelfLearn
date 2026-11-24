# Review: 1_4_1 Race Conditions and Critical Sections

### Câu Hỏi 1: Trong lập trình đồng thời (*concurrent programming*), các luồng (*threads*) trong cùng một tiến trình chia sẻ những vùng bộ nhớ nào, và điều này mang lại lợi ích cũng như rủi ro gì?

<details>
<summary>Đáp án</summary>

Các luồng chạy bên trong cùng một tiến trình chia sẻ chung không gian bộ nhớ ảo gồm **Data, BSS và Heap**.
- **Lợi ích**: Cho phép các luồng trao đổi dữ liệu với tốc độ cực nhanh.
- **Rủi ro**: Nếu nhiều luồng cùng đọc và ghi tự do vào vùng nhớ chia sẻ mà không có cơ chế khóa bảo vệ, chương trình sẽ gặp hiểm họa **Điều kiện tranh định (Race Condition)**, dẫn đến sai lệch hoặc mất mát dữ liệu.

</details>

---

### Câu Hỏi 2: **Điều kiện tranh định (Race Condition)** là gì?

<details>
<summary>Đáp án</summary>

**Điều kiện tranh định (Race Condition)** là một khiếm khuyết phần mềm xảy ra khi nhiều luồng thực thi đồng thời cùng truy cập và thao tác trên một dữ liệu hoặc tài nguyên dùng chung, khiến kết quả cuối cùng của chương trình phụ thuộc vào thời điểm và trật tự thực thi ngẫu nhiên, không thể đoán trước (*non-deterministic*) của bộ lập lịch CPU.

</details>

---

### Câu Hỏi 3: **Miền găng (Critical Section)** và **Loại trừ tương hỗ (Mutual Exclusion)** là gì, và mối quan hệ giữa chúng với Race Condition như thế nào?

<details>
<summary>Đáp án</summary>

- **Miền găng (Critical Section)**: Là một đoạn mã nguồn có hành vi truy xuất vào biến hoặc cấu trúc dữ liệu khả biến dùng chung (*shared mutable state*). Tại bất kỳ một thời điểm vật lý nào, không được phép có nhiều hơn một luồng cùng thực thi bên trong miền găng đó.
- **Loại trừ tương hỗ (Mutual Exclusion)**: Là thuộc tính đảm bảo rằng nếu một luồng (Luồng A) đang thực thi bên trong miền găng, mọi luồng khác đều bị ngăn chặn và buộc phải chờ bên ngoài cho đến khi Luồng A rời khỏi miền găng an toàn.
- **Mối quan hệ**: Miền găng là vùng mã cần được kiểm soát truy cập; **Race Condition** là hậu quả phát sinh khi tính chất loại trừ tương hỗ của miền găng bị vi phạm (miền găng không được bảo vệ bởi cơ chế đồng bộ hóa).

</details>

---

### Câu Hỏi 4: Vì sao thao tác `counter++` trong ngôn ngữ bậc cao như C không phải là một thao tác nguyên tử (*atomic operation*) ở tầng vi kiến trúc CPU?

<details>
<summary>Đáp án</summary>

Ở tầng vi kiến trúc phần cứng (như x86_64), CPU không thể trực tiếp thực hiện phép toán cộng trên ô nhớ RAM mà không nạp dữ liệu vào thanh ghi. Do đó, trình biên dịch phân rã `counter++` thành **3 chỉ lệnh hợp ngữ độc lập**:
1. **Load (`mov`)**: Nạp giá trị hiện tại của biến từ RAM vào thanh ghi CPU (ví dụ `EAX` hoặc `RAX`).
2. **Modify (`add`)**: Tăng giá trị trong thanh ghi lên 1 thông qua khối ALU.
3. **Store (`mov`)**: Ghi ngược giá trị mới từ thanh ghi trở lại ô nhớ RAM.

</details>

---

### Câu Hỏi 5: Hiện tượng **Mất mát cập nhật (Lost Update Anomaly)** xảy ra như thế nào khi hai luồng cùng tăng một biến toàn cục `counter = 0` bằng lệnh `counter++` mà không có cơ chế đồng bộ?

<details>
<summary>Đáp án</summary>

1. Thread 1 nạp giá trị `0` từ RAM vào thanh ghi và cộng lên `1`, nhưng **chưa kịp ghi về RAM**.
2. Lúc này xảy ra ngắt bộ định thời (*Timer Interrupt*), hệ điều hành chuyển ngữ cảnh (*Context Switch*) sang Thread 2.
3. Thread 2 đọc giá trị trên RAM (vẫn là `0`), cộng lên `1` và ghi giá trị `1` vào RAM.
4. Khi CPU chuyển ngữ cảnh quay lại Thread 1, Thread 1 tiếp tục lệnh lưu giá trị `1` trong thanh ghi của mình ghi đè lên RAM.
5. **Hậu quả**: Hai luồng thực hiện hai phép cộng độc lập nhưng `counter` cuối cùng chỉ bằng **1 thay vì 2** — phép cập nhật của Thread 2 đã bị ghi đè và mất hoàn toàn.

</details>

---

### Câu Hỏi 6: Khóa **Mutex (`pthread_mutex_t`)** của chuẩn POSIX hoạt động như thế nào để bảo vệ miền găng?

<details>
<summary>Đáp án</summary>

- **Trước khi vào miền găng**: Luồng bắt buộc gọi `pthread_mutex_lock(&mutex)`. Nếu khóa đang tự do, luồng chiếm quyền sở hữu khóa và đi tiếp vào miền găng. Nếu khóa đang bị luồng khác nắm giữ, luồng gọi sẽ bị chặn và đưa vào hàng đợi chờ.
- **Sau khi rời miền găng**: Khi đã thao tác xong trên dữ liệu chia sẻ, luồng bắt buộc gọi `pthread_mutex_unlock(&mutex)` để giải phóng khóa, cho phép luồng tiếp theo trong hàng đợi chiếm khóa và thực thi.

</details>

---

### Câu Hỏi 7: Trong hoạt động đồng bộ hóa luồng, khi nào hệ thống cần sự can thiệp của **Kernel Mode**?

<details>
<summary>Đáp án</summary>

Các cơ chế đồng bộ hóa giữa các luồng có thể diễn ra ở **User Space**, nhưng khi xảy ra **tranh chấp khóa** (có luồng bị chặn phải chờ đợi khóa được giải phóng), hệ thống cần sự can thiệp của **Kernel Mode**.

</details>

---

### Câu Hỏi 8: Trong mã nguồn thực nghiệm `race_condition_demo.c`, vì sao biến `unsafe_counter` được khai báo với từ khóa `volatile` khi biên dịch bằng cờ `-O2`?

<details>
<summary>Đáp án</summary>

Từ khóa `volatile` bắt buộc trình biên dịch GCC phải phát sinh các chỉ lệnh đọc/ghi RAM thực tế trên mỗi lần lặp của vòng lặp, ngăn chặn trình tối ưu hóa (`-O2`) gộp cả vòng lặp thành một lệnh cộng duy nhất. Nhờ vậy, chương trình mới tái hiện trung thực chuỗi 3 chỉ lệnh `mov/add/mov` và điều kiện tranh định **Lost Update**.

</details>

---

### Câu Hỏi 9: Cạm bẫy **Tối ưu hóa trình biên dịch (Compiler Optimization Bugs)** xảy ra như thế nào khi dùng một biến cờ thông thường (như `bool stop_flag = false`) để điều khiển vòng lặp giữa các luồng, và cách khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy**: Khi bật tối ưu hóa `-O2` hoặc `-O3`, trình biên dịch thấy `stop_flag` không bị sửa đổi bên trong vòng lặp của luồng hiện tại nên chỉ nạp giá trị của biến vào thanh ghi một lần duy nhất và không bao giờ đọc lại từ RAM nữa. Điều này biến vòng lặp `while (!stop_flag)` thành vòng lặp vô tận dù luồng khác đã đổi giá trị biến trong RAM.
- **Cách khắc phục**: Không dựa vào việc đọc biến thông thường để đồng bộ luồng; phải sử dụng các thao tác nguyên tử (*Atomic*) hoặc khóa Mutex để thiết lập rào cản bộ nhớ (*Memory Barrier*), buộc trình biên dịch và CPU luôn đọc dữ liệu mới nhất từ RAM.

</details>

---

### Câu Hỏi 10: Hiện tượng **Tranh chấp khóa quá mức (Lock Contention)** là gì, nguyên nhân nào gây ra nó, và làm thế nào để khắc phục?

<details>
<summary>Đáp án</summary>

- **Hiện tượng & Nguyên nhân**: Khi miền găng được thiết kế quá rộng (**Coarse-Grained Locking** — ví dụ bọc cả việc giải mã JSON, tính toán nặng, gọi cơ sở dữ liệu hay I/O vào chung một khóa Mutex), các lõi CPU khác phải xếp hàng chờ luồng đang giữ khóa, làm thông lượng (*Throughput*) tụt giảm nghiêm trọng dù mở rộng nhiều lõi CPU.
- **Cách khắc phục**:
  - **Thu hẹp miền găng (Fine-Grained Locking)**: Chỉ đặt khóa quanh đúng vài dòng lệnh cập nhật dữ liệu chia sẻ; tuyệt đối không thực hiện I/O mạng, đọc đĩa hay tác vụ tốn thời gian bên trong miền găng.
  - Áp dụng cấu trúc dữ liệu không khóa (*Lock-Free*) hoặc phân vùng dữ liệu theo từng luồng (*Sharding / Thread-Local State*).

</details>

---

### Câu Hỏi 11: **Bế tắc do khóa lồng nhau (Deadlock via Nested Locks)** xảy ra trong tình huống nào và nguyên tắc nào giúp ngăn chặn nó?

<details>
<summary>Đáp án</summary>

- **Tình huống xảy ra**: Luồng A đã chiếm Khóa 1 và đang chờ chiếm Khóa 2, trong khi cùng lúc đó Luồng B đã chiếm Khóa 2 và đang chờ chiếm Khóa 1. Cả hai luồng đều chờ nhau vô thời hạn, khiến ứng dụng bị đóng băng vĩnh viễn.
- **Nguyên tắc phòng tránh**: Tuân thủ quy tắc **Trật tự Khóa Toàn cầu (Global Lock Ordering)** — mọi luồng trong toàn bộ hệ thống bắt buộc phải chiếm các khóa theo cùng một thứ tự định sẵn (ví dụ: luôn chiếm Khóa 1 trước, sau đó mới chiếm Khóa 2).

</details>
