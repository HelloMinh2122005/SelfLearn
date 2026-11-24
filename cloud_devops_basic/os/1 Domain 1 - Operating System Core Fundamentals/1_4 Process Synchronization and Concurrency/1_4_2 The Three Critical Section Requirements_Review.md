# Review: 1_4_2 The Three Critical Section Requirements

### Câu Hỏi 1: Miền găng (Critical Section - CS) là gì và hiện tượng gì sẽ xảy ra nếu nhiều luồng hoặc tiến trình cùng thực thi bên trong miền găng tại một thời điểm?

<details>
<summary>Đáp án</summary>

**Miền găng (Critical Section - CS)** là đoạn mã truy cập và thao tác trên tài nguyên dùng chung khả biến (shared mutable state).

Nếu nhiều luồng hoặc tiến trình cùng bước vào miền găng tại một thời điểm, hiện tượng xung đột dữ liệu (**Race Condition**) sẽ xảy ra, khiến các luồng đồng thời ghi đè lên bộ nhớ chung và làm phá hủy tính toàn vẹn của hệ thống.
</details>

### Câu Hỏi 2: Ba Tiêu Chuẩn Vàng của Edsger W. Dijkstra (EWD 123, 1965) dành cho một cơ chế đồng bộ miền găng đúng đắn gồm những tiêu chuẩn nào?

<details>
<summary>Đáp án</summary>

Mọi thuật toán hoặc cơ chế khóa đồng bộ (Locking mechanism) muốn được công nhận là đúng đắn phải thỏa mãn trọn vẹn 3 tiêu chuẩn sau:
1. **Mutual Exclusion (Độc quyền tương hỗ)**: Tại bất kỳ thời điểm nào, chỉ có tối đa 1 tiến trình được phép thực thi bên trong miền găng của nó.
2. **Progress (Tính tiến triển)**: Khi miền găng trống và có tiến trình muốn vào, chỉ những tiến trình đang muốn vào mới được tham gia quyết định chọn ai vào tiếp, và quyết định không được phép bị trì hoãn vô tận.
3. **Bounded Waiting (Chờ đợi có giới hạn)**: Sau khi một tiến trình đã đăng ký yêu cầu vào miền găng, phải có một giới hạn chặn trên (bound) đối với số lần các tiến trình khác được phép chen vào miền găng trước nó.
</details>

### Câu Hỏi 3: Trong 3 tiêu chuẩn của Dijkstra, tiêu chuẩn nào thuộc nhóm Safety Property, tiêu chuẩn nào thuộc nhóm Liveness Property / Fairness, và hậu quả khi vi phạm từng tiêu chuẩn là gì?

<details>
<summary>Đáp án</summary>

- **Mutual Exclusion** là tiêu chuẩn an toàn (**Safety Property** — *"Nothing bad happens"*). Nếu bị vi phạm, **Race Condition** sẽ xảy ra, làm dữ liệu dùng chung bị ghi đè và hỏng hóc tức thì.
- **Progress** là tiêu chuẩn vận hành sống động (**Liveness Property** — *"Something good eventually happens"*). Nếu bị vi phạm, hệ thống có thể bị "đóng băng" dù tài nguyên đang rảnh rỗi, rơi vào **Deadlock** (bế tắc vĩnh viễn) hoặc **Livelock** (nhường nhau vô tận).
- **Bounded Waiting** bảo vệ tính công bằng (**Fairness**). Nếu bị vi phạm, tiến trình có thể phải chờ đợi vô hạn và rơi vào tình trạng **Starvation** (chết đói tài nguyên).
</details>

### Câu Hỏi 4: Tiêu chuẩn Progress (Tính tiến triển) đặt ra những yêu cầu cụ thể nào khi miền găng đang trống và có tiến trình muốn vào?

<details>
<summary>Đáp án</summary>

Khi không có tiến trình nào đang ở trong miền găng và có một hoặc nhiều tiến trình đang có nhu cầu bước vào, tiêu chuẩn **Progress** yêu cầu 3 điều:
1. Chỉ những tiến trình đang thực sự có nhu cầu vào miền găng mới được quyền tham gia vào quá trình quyết định xem ai sẽ là người kế tiếp được vào.
2. Những tiến trình đang chạy ở ngoài miền găng (non-critical section) hoặc đã dừng lại (halted) tuyệt đối không được cản trở các tiến trình khác.
3. Quá trình lựa chọn không được phép kéo dài vô tận (không rơi vào Deadlock hoặc Livelock).
</details>

### Câu Hỏi 5: Giải pháp Luân phiên nghiêm ngặt (Strict Alternation) sử dụng biến `int turn = 0;` thỏa mãn tiêu chuẩn nào và vi phạm tiêu chuẩn nào?

<details>
<summary>Đáp án</summary>

- **Thỏa mãn Mutual Exclusion**: Tại một thời điểm, biến `turn` chỉ mang một giá trị (`0` hoặc `1`), nên chỉ tiến trình có `turn` tương ứng mới được bước vào miền găng.
- **Vi phạm Progress**: Nếu Tiến trình 0 hoàn thành lượt của mình, đặt `turn = 1`, rồi chuyển sang làm việc khác ngoài miền găng và không muốn quay lại; sau đó Tiến trình 1 vào xong, đặt `turn = 0`, rồi muốn vào lại miền găng lần thứ hai liên tiếp thì nó sẽ bị kẹt cứng ở vòng lặp `while (turn != 1)`. Như vậy, Tiến trình 0 (đang không có nhu cầu vào miền găng) đã chặn đứng Tiến trình 1 bước vào một miền găng đang hoàn toàn trống.
</details>

### Câu Hỏi 6: Trong giải pháp dùng cờ trạng thái đơn giản `bool flag[2]`, Biến thể A (kiểm tra cờ đối phương trước rồi mới đặt cờ của mình) và Biến thể B (đặt cờ của mình trước rồi mới kiểm tra cờ đối phương) mắc phải lỗi gì?

<details>
<summary>Đáp án</summary>

- **Biến thể A (Kiểm tra `while (flag[other]);` rồi mới đặt `flag[self] = true;`)**: **Vi phạm Mutual Exclusion**. Nếu cả hai tiến trình kiểm tra cờ đối phương tại cùng một thời điểm, cả hai đều thấy `false`, cùng vượt qua vòng lặp, cùng đặt cờ `true` và cùng bước vào miền găng, gây ra Race Condition.
- **Biến thể B (Đặt `flag[self] = true;` rồi mới kiểm tra `while (flag[other]);`)**: **Vi phạm Progress (Deadlock / Livelock)**. Nếu cả hai tiến trình cùng đặt cờ `true` cùng lúc, cả hai đều rơi vào vòng lặp `while` nhìn cờ của nhau và chờ đối phương rút cờ, dẫn đến bế tắc vĩnh viễn dù miền găng đang trống.
</details>

### Câu Hỏi 7: Trong Thuật toán Peterson (1981), hai biến dùng chung `flag[i]` và `turn` có vai trò kỹ thuật gì và trình tự các bước trong `enter_critical_section` diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

- **`flag[i]`** (cờ ý định — intent flag): Thể hiện tiến trình `i` có đang muốn vào miền găng hay không (`flag[i] = true` nghĩa là muốn vào).
- **`turn`** (biến nhường lượt — polite turn): Phân định ai được ưu tiên khi có tranh chấp đồng thời (`turn = other` nghĩa là lịch sự nhường quyền cho đối phương).

Trình tự 3 bước trong `enter_critical_section(int self)` với `other = 1 - self`:
1. Tuyên bố ý định muốn vào: `flag[self] = true;`
2. Lịch sự nhường lượt cho đối phương: `turn = other;`
3. Chờ chừng nào đối phương vẫn muốn vào **và** đang giữ lượt: `while (flag[other] && turn == other);`

Khi rời miền găng (`leave_critical_section`), tiến trình đặt `flag[self] = false;` để rút cờ.
</details>

### Câu Hỏi 8: Thuật toán Peterson đảm bảo cả 3 tiêu chuẩn Mutual Exclusion, Progress và Bounded Waiting cho 2 tiến trình như thế nào?

<details>
<summary>Đáp án</summary>

1. **Mutual Exclusion**: Để cả hai tiến trình cùng vào miền găng, điều kiện `while (flag[other] && turn == other)` của cả hai phải cùng sai. Tuy nhiên, biến `turn` tại một thời điểm chỉ nhận duy nhất một giá trị (`0` hoặc `1`). Tiến trình nào thực hiện gán `turn = other` sau cùng sẽ bị chặn lại ở vòng lặp `while`.
2. **Progress**: Nếu tiến trình còn lại không muốn vào (`flag[other] == false`), tiến trình đang yêu cầu sẽ vượt qua vòng lặp `while` ngay lập tức mà không bị cản trở.
3. **Bounded Waiting**: Khi Tiến trình 0 đang chờ, Tiến trình 1 rời miền găng và đặt `flag[1] = false`. Nếu Tiến trình 1 muốn vào lại ngay lập tức, nó bắt buộc phải gán `turn = 0` (nhường lượt cho Tiến trình 0). Nhờ đó, Tiến trình 0 chắc chắn được vào sau tối đa 1 lượt của Tiến trình 1.
</details>

### Câu Hỏi 9: Tại sao Thuật toán Peterson thuần túy có thể bị sập (vi phạm Mutual Exclusion) trên các CPU đa nhân hiện đại, và cần giải pháp gì để khắc phục?

<details>
<summary>Đáp án</summary>

Thuật toán Peterson được chứng minh đúng trên giả định mô hình bộ nhớ nhất quán tuần tự (**Sequential Consistency**). Tuy nhiên, các CPU hiện đại (như x86-64, ARM, Apple Silicon) và các trình biên dịch tối ưu hóa (GCC, Clang) thường thực hiện **Tái sắp xếp bộ nhớ ngoài trật tự (Out-of-Order Execution / Memory Reordering)**.

Do đó, lệnh `turn = other` có thể bị đẩy lên thực thi trước lệnh `flag[self] = true`, khiến cả hai luồng cùng thấy cờ đối phương là `false` và cùng vào miền găng (vi phạm **Mutual Exclusion**).

**Cách khắc phục**: Trên hệ thống đa nhân hiện đại, cần sử dụng các chỉ lệnh nguyên tử phần cứng (**Hardware Atomic Instructions** như `lock cmpxchg`, Test-and-Set) kết hợp với rào cản bộ nhớ (**Memory Barriers / Fences**, ví dụ `__sync_synchronize()` trong mã minh họa C) để ngăn CPU và trình biên dịch đảo thứ tự thực thi lệnh.
</details>

### Câu Hỏi 10: Trong môi trường sản xuất (Production), việc sử dụng các khóa bất công (Unfair Locks / Non-FIFO Locks) có thể gây ra vấn đề gì liên quan đến 3 tiêu chuẩn của Dijkstra?

<details>
<summary>Đáp án</summary>

Nhiều cơ chế Spinlock hoặc Mutex không có hàng đợi thứ tự (**Non-FIFO Locks**) giúp đạt thông lượng thô cao, nhưng khi hàng trăm luồng cùng tranh chấp một khóa, các luồng chạy trên các core CPU ở gần bộ nhớ đệm (Cache-locality) có thể liên tục giành được khóa.

Trong khi đó, các luồng chạy trên core xa hoặc có mức ưu tiên thấp có thể bị bỏ quên và không bao giờ giành được khóa. Điều này **vi phạm tiêu chuẩn Bounded Waiting**, dẫn đến hiện tượng **Starvation** (đói tài nguyên) và gây ra các lỗi Timeout bí ẩn trên các dịch vụ như thanh toán hoặc xử lý đơn hàng.
</details>
