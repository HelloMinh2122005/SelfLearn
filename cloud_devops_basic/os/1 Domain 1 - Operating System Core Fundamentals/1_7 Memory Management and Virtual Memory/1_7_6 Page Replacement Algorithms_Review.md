# Review: 1_7_6 Page Replacement Algorithms

### Câu Hỏi 1: Khi nào hệ điều hành phải thực hiện thuật toán thay thế trang (Page Replacement), và khái niệm Trang nạn nhân (Victim Page) có nghĩa là gì?

<details>
<summary>Đáp án</summary>

Trong cơ chế nạp trang theo yêu cầu (**Demand Paging**), khi tiến trình truy cập vào một trang chưa có trong RAM, phần cứng phát sinh **Page Fault** để nạp trang đó từ ổ cứng (**Swap Space / Page File**) vào RAM.

Khi toàn bộ các khung trang vật lý (**Physical Frames**) trong RAM đã bị lấp đầy $100\%$, hệ điều hành bắt buộc phải chọn ra một trang đang nằm trong RAM để trục xuất (**Evict**) ra ổ cứng nhằm dọn chỗ trống cho trang mới:
- **Trang nạn nhân (Victim Page)**: Là trang đang nằm trong RAM bị chọn để trục xuất ra ngoài.
- **Thuật toán thay thế trang (Page Replacement Algorithm)**: Là giải thuật quyết định trang nào sẽ trở thành trang nạn nhân.
</details>

### Câu Hỏi 2: Quy trình 5 bước thay thế trang khi RAM đầy diễn ra như thế nào, và Dirty Bit (Modified Bit) đóng vai trò gì trong bước trục xuất?

<details>
<summary>Đáp án</summary>

Khi xảy ra Page Fault lúc RAM đã đầy, bộ điều phối bộ nhớ ảo (**Paging Sub-system**) thực hiện 5 bước sau:
1. Thực thi thuật toán thay thế trang (FIFO / LRU / Clock) để lựa chọn **Victim Frame Y**.
2. Kiểm tra **Dirty Bit (Modified Bit)** của Trang Y:
   - Nếu `Dirty Bit = 1` (trang đã bị ghi dữ liệu): **Bắt buộc phải ghi dữ liệu xuống Disk / Swap** trước khi giải phóng để tránh mất dữ liệu.
   - Nếu `Dirty Bit = 0` (trang chỉ đọc / chưa bị thay đổi): **Hủy trực tiếp** mà không cần ghi xuống ổ cứng, giúp tiết kiệm thao tác I/O.
3. Cập nhật **Page Table**: Đánh dấu Trang Y là **Invalid (`V = 0`)**.
4. Đọc Trang X mới từ Disk nạp vào Frame Y vừa giải phóng.
5. Cập nhật **Page Table** cho Trang X là **Valid (`V = 1`)** và khởi động lại lệnh đang bị gián đoạn.
</details>

### Câu Hỏi 3: Thuật toán thay thế trang FIFO (First-In, First-Out) hoạt động theo nguyên lý nào và có những hạn chế nghiêm trọng gì?

<details>
<summary>Đáp án</summary>

- **Nguyên lý**: FIFO gắn nhãn thời điểm nạp cho mỗi trang trong RAM và quản lý các khung trang bằng một hàng đợi đơn giản. Trang nào được nạp vào bộ nhớ **sớm nhất (cũ nhất)** sẽ bị chọn làm nạn nhân đầu tiên khi cần chỗ trống.
- **Hạn chế nghiêm trọng**:
  - Một trang được nạp từ sớm có thể là biến dùng chung toàn cục hoặc hàm thư viện được gọi liên tục; việc trục xuất nó chỉ vì nạp sớm sẽ gây ra **Page Fault lặp đi lặp lại** ngay sau đó.
  - FIFO không phải là thuật toán dạng ngăn xếp nên có thể gặp phải **Dị thường Belady (Belady's Anomaly)**.
</details>

### Câu Hỏi 4: Thuật toán Tối ưu (Optimal Algorithm - OPT / MIN) hoạt động dựa trên quy tắc gì? Vì sao không thể triển khai OPT trong thực tế nhưng các nhà nghiên cứu vẫn mô phỏng nó?

<details>
<summary>Đáp án</summary>

- **Nguyên lý (László Bélády, 1966)**: OPT trục xuất trang **sẽ lâu được sử dụng nhất trong tương lai**, giúp đảm bảo số lần Page Fault là **thấp nhất tuyệt đối** cho bất kỳ chuỗi truy cập bộ nhớ nào.
- **Tính khả thi**: **Bất khả thi trong thực tế** trên các hệ điều hành thông thường (như Windows hay Linux), vì tại thời điểm thực thi (runtime), hạt nhân không thể nhìn thấu tương lai để biết tiến trình sẽ gọi trang nào tiếp theo.
- **Giá trị sử dụng**: Trong phòng thí nghiệm, OPT được mô phỏng trên các tập dữ liệu vết (trace logs) thu thập sẵn để làm **"Thước đo chuẩn vàng" (Benchmark)** / giới hạn lý thuyết tối đa. Một thuật toán thực tế (như LRU hay Clock) càng đạt số lỗi trang tiệm cận gần OPT thì càng hiệu quả.
</details>

### Câu Hỏi 5: Thuật toán LRU (Least Recently Used) hoạt động theo nguyên lý nào và tại sao các CPU x86-64 không triển khai LRU thuần túy 100% ở phần cứng?

<details>
<summary>Đáp án</summary>

- **Nguyên lý**: Dựa trên **Nguyên lý cục bộ thời gian (Temporal Locality)**, LRU sử dụng quá khứ gần để dự đoán tương lai: trang nào **đã lâu nhất không được CPU đụng tới** sẽ bị coi là ít có khả năng được dùng lại và bị chọn làm nạn nhân. Hiệu năng của LRU tiệm cận rất sát với OPT.
- **Lý do không triển khai thuần túy trên phần cứng**: Để hiện thực LRU chuẩn xác $100\%$, mỗi lần đọc hoặc ghi bộ nhớ đều phải cập nhật một bộ đếm thời gian 64-bit (**Counter**) hoặc di chuyển một nút trong danh sách liên kết kép (**Doubly-Linked Stack**). Chi phí đồng bộ hóa phần cứng trên mỗi chu kỳ xung nhịp như vậy là quá đắt đỏ, nên các CPU x86-64 không hỗ trợ LRU thuần túy.
</details>

### Câu Hỏi 6: Thuật toán Chiếc đồng hồ (Clock / Second-Chance Algorithm) xấp xỉ LRU như thế nào thông qua Reference Bit (`R`)?

<details>
<summary>Đáp án</summary>

**Clock Algorithm** là giải pháp xấp xỉ phần cứng thực tế và phổ biến nhất của LRU, sử dụng một hàng đợi vòng tròn (**Circular Queue / Circular Buffer**) cùng một con trỏ gọi là **kim đồng hồ (Clock Hand)**.

Cơ chế hoạt động dựa trên **Reference Bit (Accessed Bit `R`)** trong **Page Table Entry (PTE)** (do CPU tự động bật lên `1` mỗi khi trang đó được đọc hoặc ghi):
- Khi cần tìm nạn nhân, kim đồng hồ quét qua từng khung trang:
  - Nếu `R = 1`: Trang đã được dùng gần đây $\to$ Hệ thống xóa bit về `R = 0` (trao **"cơ hội thứ hai"**) và bước kim sang trang kế tiếp.
  - Nếu `R = 0`: Trang đã không được dùng kể từ vòng quét trước $\to$ **Chọn ngay làm nạn nhân** để trục xuất, nạp trang mới vào Frame đó, đặt `R = 1` và bước kim sang Frame kế tiếp.
</details>

### Câu Hỏi 7: Dị thường Belady (Belady's Anomaly) là gì và nguyên nhân nào dẫn đến hiện tượng này trong bài toán thực nghiệm của FIFO?

<details>
<summary>Đáp án</summary>

- **Khái niệm**: Phát hiện bởi László Bélády (1969), **Dị thường Belady** là hiện tượng nghịch lý xảy ra ở thuật toán **FIFO**: khi ta **tăng số lượng khung trang vật lý (Frames)** thì số lượng **Page Fault lại tăng lên** thay vì giảm đi hoặc giữ nguyên.
- **Chứng minh và nguyên nhân từ bài tập thực nghiệm**: Với chuỗi 12 tham chiếu `1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5`:
  - Khi dùng 3 Frames: xảy ra **9 Page Faults**.
  - Khi tăng lên 4 Frames: xảy ra **10 Page Faults**.
  - *Nguyên nhân*: Ở kịch bản 4 Frames, dù trang 1 và 2 được **Hit** ở bước 5 và 6, hàng đợi FIFO không hề làm mới vị trí của chúng. Do đó đến bước 7, trang 1 trở thành "cũ nhất" và bị trục xuất oan uổng, kéo theo phản ứng dây chuyền khiến toàn bộ các bước từ 8 đến 12 đều bị Page Fault.
</details>

### Câu Hỏi 8: Thuật toán dạng ngăn xếp (Stack Algorithm) là gì? Vì sao lớp thuật toán này miễn nhiễm hoàn toàn với Dị thường Belady?

<details>
<summary>Đáp án</summary>

- **Định nghĩa**: Một thuật toán thay thế trang được gọi là **Stack Algorithm** nếu tại mọi thời điểm $t$, nó thỏa mãn tính chất bao hàm: tập hợp các trang lưu trong $n$ khung trang luôn là tập con của tập hợp các trang lưu trong $(n + 1)$ khung trang:
  $$M_t(n) \subseteq M_t(n + 1)$$
- **Lý do miễn nhiễm với Dị thường Belady**: Khi cấp thêm 1 Frame, bộ nhớ mới luôn bao trọn toàn bộ các trang của bộ nhớ cũ. Vì vậy, bất kỳ truy cập trúng (**Page Hit**) nào ở bộ nhớ $n$ khung trang chắc chắn cũng sẽ trúng ở bộ nhớ $(n + 1)$ khung trang, đảm bảo số Page Fault không bao giờ tăng khi tăng số lượng Frame.
- **Phân loại**: **OPT** và **LRU** là các Stack Algorithms nên **miễn nhiễm $100\%$** với Dị thường Belady; ngược lại **FIFO** không phải là Stack Algorithm.
</details>

### Câu Hỏi 9: Qua bài tập so sánh trên chuỗi chuẩn 20 tham chiếu với 3 khung trang, hiệu năng (số Page Fault và Hit Rate) giữa OPT, LRU và FIFO xếp hạng như thế nào?

<details>
<summary>Đáp án</summary>

Trên chuỗi 20 tham chiếu `7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1` với **3 khung trang**:
1. **OPT (Tốt nhất tuyệt đối)**: **9 Page Faults**, 11 Hits $\to$ Hit Rate = **55%**.
2. **LRU (Tiệm cận sát OPT)**: **12 Page Faults**, 8 Hits $\to$ Hit Rate = **40%**.
3. **FIFO (Kém nhất)**: **15 Page Faults**, 5 Hits $\to$ Hit Rate = **25%**.
</details>

### Câu Hỏi 10: Trong thực tế sản xuất, Linux Kernel quản lý và thu hồi trang nhớ theo chiến lược hai danh sách (Two-List Strategy) như thế nào, và làm sao quan sát thông số này qua CLI?

<details>
<summary>Đáp án</summary>

Nhân Linux không dùng một danh sách Clock đơn lẻ mà dùng biến thể **Two-List Strategy** với hai danh sách liên kết kép:
- **`active_list`**: Chứa các trang bộ nhớ đang được truy cập rất thường xuyên.
- **`inactive_list`**: Chứa các trang ứng viên tiềm năng để thu hồi (**Reclaim / Evict**).

**Cơ chế thanh lọc và thu hồi**:
- Trang mới nạp sẽ được đưa vào `inactive_list`.
- Nếu trang đó được tham chiếu thêm một lần nữa khi đang nằm trong `inactive_list`, nó được "thăng hạng" chuyển sang `active_list`.
- Khi RAM cạn kiệt, tiến trình kernel **`kswapd`** chỉ quét và đẩy các trang ở đuôi của `inactive_list` ra swap, qua đó bảo vệ an toàn các trang quan trọng trong `active_list`.

**Quan sát trên Linux CLI**:
```bash
grep -E "Active|Inactive" /proc/meminfo
```
</details>
