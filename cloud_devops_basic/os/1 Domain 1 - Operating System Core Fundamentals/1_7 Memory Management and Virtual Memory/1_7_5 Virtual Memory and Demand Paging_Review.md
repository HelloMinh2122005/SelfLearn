# Review: 1_7_5 Virtual Memory and Demand Paging

### Câu Hỏi 1: Bộ Nhớ Ảo (Virtual Memory) là gì và dựa trên sự thật thực nghiệm nào để một chương trình lớn hơn dung lượng RAM vật lý (ví dụ 32 GB trên máy 8 GB RAM) vẫn chạy được?

<details>
<summary>Đáp án</summary>

- **Bản chất của Bộ Nhớ Ảo**: Là kỹ thuật cho phép tách rời hoàn toàn không gian địa chỉ logic của lập trình viên khỏi không gian bộ nhớ vật lý thực tế của phần cứng. Hệ điều hành tạo cho mỗi tiến trình ảo tưởng rằng nó sở hữu một không gian RAM lớn, sạch sẽ và liên tục, nhờ đó dung lượng bộ nhớ khả dụng không còn bị giới hạn bởi kích thước thanh RAM vật lý.
- **Cơ sở thực nghiệm**: Tại bất kỳ thời điểm thực thi nào, một tiến trình chỉ thực sự cần đến một phần rất nhỏ mã nguồn và dữ liệu của nó (chẳng hạn các hàm xử lý lỗi hiếm khi được gọi, phần khởi tạo chỉ chạy một lần lúc đầu, hoặc các mảng lớn nhưng chỉ được duyệt tuần tự từng phần). Vì vậy, không cần nạp toàn bộ chương trình vào RAM ngay từ đầu.
</details>

### Câu Hỏi 2: Cơ chế Nạp Trang Theo Yêu Cầu (Demand Paging / Lazy Pager) khác gì với Pre-paging và hoạt động ra sao khi tiến trình mới khởi chạy?

<details>
<summary>Đáp án</summary>

- **Khác biệt với Pre-paging**:
  - *Pre-paging*: Nạp toàn bộ các trang của tiến trình vào RAM ngay khi chương trình được gọi.
  - *Demand Paging (Lazy Paging)*: Áp dụng chiến lược lười biếng tối đa — một trang ảo **chỉ được nạp vào RAM khi và chỉ khi có một lệnh CPU thực sự tham chiếu tới nó**.
- **Cách hoạt động lúc khởi chạy**: Khi tiến trình bắt đầu chạy, nhân hệ điều hành chỉ nạp một vài trang đầu tiên chứa hàm `main()` hoặc mã khởi động. Toàn bộ các trang còn lại vẫn ở trên đĩa và được gán cờ `Present bit = 0` trong Bảng Trang (Page Table).
</details>

### Câu Hỏi 3: Ba lợi ích chính của cơ chế Demand Paging là gì?

<details>
<summary>Đáp án</summary>

Demand Paging mang lại 3 lợi ích vượt trội:
1. **Thời gian khởi động tiến trình cực nhanh**: Không mất thời gian đọc hàng Gigabyte dữ liệu từ ổ cứng lên RAM trước khi chạy.
2. **Tiết kiệm dung lượng RAM tối đa**: Cho phép hệ thống tăng độ đa chương (Degree of Multiprogramming), chạy được hàng trăm tiến trình cùng lúc.
3. **Giảm thiểu áp lực băng thông I/O** giữa RAM và ổ cứng.
</details>

### Câu Hỏi 4: Sự kiện Page Fault xảy ra khi nào và phần cứng xử lý bước đầu như thế nào?

<details>
<summary>Đáp án</summary>

- **Điều kiện xảy ra**: Khi tiến trình cố gắng đọc hoặc ghi vào một trang ảo nhưng trang đó chưa có mặt trên RAM vật lý (`Present bit P = 0` trong phần tử Bảng Trang).
- **Xử lý ban đầu của phần cứng**:
  1. MMU phát hiện `Present bit P = 0` khi tra cứu Bảng Trang.
  2. MMU kích hoạt Bẫy Phần Cứng (Hardware Trap) **Page Fault** (`#PF`, Vector 14) để chuyển CPU sang Kernel Mode, đồng thời lưu địa chỉ gây lỗi vào thanh ghi `CR2` của CPU.
</details>

### Câu Hỏi 5: Trình bày tóm tắt chu trình 6 bước xử lý một Page Fault của hệ điều hành, bao gồm trường hợp địa chỉ bất hợp pháp và trường hợp RAM đầy?

<details>
<summary>Đáp án</summary>

Chu trình 6 bước xử lý Page Fault gồm:
1. **Phát hiện lỗi**: CPU phát lệnh truy xuất địa chỉ ảo, MMU kiểm tra Bảng Trang thấy `Present bit P = 0`.
2. **Kích hoạt bẫy phần cứng**: MMU phát tín hiệu Hardware Trap (`#PF`) chuyển sang Kernel Mode; địa chỉ lỗi được lưu vào thanh ghi `CR2`.
3. **Kiểm tra tính hợp lệ (`vm_area_struct`)**: Nhân OS kiểm tra cấu trúc quản lý bộ nhớ của tiến trình. Nếu địa chỉ bất hợp pháp (nằm ngoài vùng được cấp phát hoặc sai quyền truy xuất), OS bắn tín hiệu `SIGSEGV` để kết liễu tiến trình; nếu hợp lệ thì tiếp tục xử lý Page Fault.
4. **Tìm khung RAM trống**: Nhân OS xin một Khung RAM trống (Free Page Frame) từ Free List (hoặc Buddy Allocator). Nếu RAM đã đầy 100%, OS kích hoạt Thuật toán thay thế trang (Page Replacement) để chọn một trang nạn nhân (Victim Page) và đẩy ra swap disk (nếu trang bị Dirty).
5. **Đọc dữ liệu từ đĩa**: Nhân OS lập lịch I/O đọc nội dung trang từ ổ đĩa (file nhị phân hoặc swap) vào Khung RAM vừa cấp. Trong lúc chờ I/O, tiến trình bị chuyển sang trạng thái Blocked / Waiting để nhường CPU cho tiến trình khác.
6. **Cập nhật Bảng Trang và chạy lại lệnh**: Khi I/O xong và phát ngắt phần cứng, nhân OS ghi số hiệu Khung RAM (PFN) vào phần tử Bảng Trang (PTE), bật `Present bit P = 1`, đưa tiến trình về trạng thái Ready và khởi động lại chính xác lệnh máy tính đã gây ra Page Fault ban đầu.
</details>

### Câu Hỏi 6: Tại sao sau khi nạp xong trang vào RAM ở bước 6, hệ điều hành phải khởi động lại chính xác lệnh máy tính đã gây ra Page Fault?

<details>
<summary>Đáp án</summary>

- Ở lần thực thi đầu tiên, lệnh máy tính (ví dụ `MOV EAX, [Addr]`) đã bị ngắt giữa chừng vì trang chứa dữ liệu chưa có trên RAM (`P = 0`), nên thao tác đọc/ghi của lệnh chưa thể hoàn tất.
- Sau khi trang được nạp vào Khung RAM và Bảng Trang được cập nhật (`P = 1`, có PFN), việc khởi động lại chính xác lệnh đó giúp MMU dịch thành công địa chỉ ảo sang địa chỉ vật lý, để lệnh hoàn tất việc truy xuất dữ liệu một cách minh bạch đối với chương trình.
</details>

### Câu Hỏi 7: Phân biệt Minor Page Fault (Lỗi Nhẹ) và Major Page Fault (Lỗi Nặng) về bản chất, hoàn cảnh xảy ra, chi phí thời gian và chỉ số thống kê trên Linux?

<details>
<summary>Đáp án</summary>

| Tiêu chí | Minor Page Fault (Soft Fault) | Major Page Fault (Hard Fault) |
| :--- | :--- | :--- |
| **Bản chất** | Trang dữ liệu **đã nằm sẵn trên RAM vật lý**, chỉ là Bảng Trang của tiến trình chưa cập nhật liên kết. | Trang dữ liệu **chưa có trong RAM**, bắt buộc phải phát lệnh I/O đọc từ ổ đĩa (HDD/SSD/Swap). |
| **Hoàn cảnh xảy ra** | Cấp phát bộ nhớ ẩn danh mới (`malloc`, `brk`, `mmap`) khi chạm vào trang lần đầu; trang thuộc Shared Library đã được tiến trình khác nạp sẵn vào RAM; hoặc trang đang nằm trong Linux Page Cache. | Đọc trang mã lệnh lần đầu tiên từ file thực thi trên ổ cứng; hoặc nạp lại trang trước đó đã bị đẩy (swapped out) ra phân vùng swap. |
| **Chi phí thời gian** | Rất nhanh ($< 1\ \mu\text{s}$), chỉ cập nhật cấu trúc dữ liệu trong kernel và thanh ghi MMU. | Rất tốn kém ($1\text{ ms} \to 10\text{ ms}$), bị nghẽn bởi tốc độ đọc của ổ đĩa. |
| **Chỉ số Linux** | `ru_minflt` trong `getrusage(2)` hoặc `minflt/s` trong `pidstat -r`. | `ru_majflt` trong `getrusage(2)` hoặc `majflt/s` trong `pidstat -r`. |
</details>

### Câu Hỏi 8: Trong chương trình thực nghiệm `page_fault_demo.c`, vì sao ngay sau khi gọi `mmap()` cấp phát 4 MB bộ nhớ ảo thì số Page Fault tăng `+0`, nhưng khi vòng lặp ghi vào từng trang 4 KB lại phát sinh đúng `+1024` Minor Page Faults?

<details>
<summary>Đáp án</summary>

- **Ngay sau `mmap()` (`MAP_PRIVATE | MAP_ANONYMOUS`)**: Hệ điều hành áp dụng cơ chế cấp phát lười biếng (Lazy Allocation / Demand Paging) nên chỉ đăng ký vùng địa chỉ ảo 4 MB mà **chưa cấp phát bất kỳ byte RAM vật lý nào**, do đó số Minor và Major Page Faults mới tăng thêm đều bằng `0`.
- **Khi ghi vào từng trang**: Bộ nhớ 4 MB với kích thước mỗi trang `PAGE_SIZE = 4096` byte (4 KB) gồm tổng cộng `1024` trang. Khi tiến trình chạm (touch) và ghi ký tự `'A'` vào byte đầu tiên của từng trang thứ `i`, mỗi trang lần đầu bị truy xuất đều có `P = 0` và chưa liên kết khung RAM, nên kích hoạt đúng 1 Minor Page Fault (không cần đọc từ đĩa vì là bộ nhớ ẩn danh mới). Tổng cộng 1024 trang tạo ra đúng `+1024` Minor Page Faults và `+0` Major Page Faults.
</details>

### Câu Hỏi 9: Khi chạy lệnh `pidstat -r 1` trên Linux, nếu thấy tiến trình `nginx` có `minflt/s = 1250` và `majflt/s = 0`, trong khi tiến trình `postgres` có `majflt/s = 45.00`, kỹ sư DevOps nên diễn giải hai tín hiệu này như thế nào?

<details>
<summary>Đáp án</summary>

- **Đối với `nginx` (`minflt/s = 1250`, `majflt/s = 0`)**: Hệ thống hoạt động bình thường và khỏe mạnh. Nginx đang cấp phát bộ nhớ động phục vụ các kết nối HTTP mới trên RAM mà không cần đọc từ ổ đĩa.
- **Đối với `postgres` (`majflt/s = 45.00`)**: Đây là **dấu hiệu nguy cơ nghẽn cổ chai đĩa**. Postgres đang liên tục phải đọc các trang dữ liệu từ ổ cứng hoặc swap vào RAM, cho thấy dung lượng `shared_buffers` trong RAM (hoặc RAM cho tập dữ liệu hoạt động) không đủ để chứa dữ liệu đang sử dụng.
</details>

### Câu Hỏi 10: Công thức tính Thời gian truy xuất hiệu dụng (Effective Access Time - EAT) là gì và vì sao tỷ lệ Page Fault rất nhỏ cũng làm hiệu năng truy xuất bộ nhớ suy giảm nghiêm trọng?

<details>
<summary>Đáp án</summary>

- **Công thức EAT**:
  $$\text{EAT} = (1 - p) \times \text{Memory Access Time} + p \times \text{Page Fault Service Time}$$
  Trong đó $p$ ($0 \le p \le 1$) là tỷ lệ xảy ra lỗi thiếu trang.
- **Nguyên nhân làm giảm hiệu năng mạnh**: Thời gian phục vụ một Major Page Fault từ đĩa (khoảng vài millisecond, ví dụ $8\text{ ms} = 8.000.000\text{ ns}$) lớn hơn hàng chục nghìn lần so với thời gian đọc RAM vật lý (khoảng $100\text{ ns}$). Do đó, trong ví dụ của bài học, dù $p$ chỉ bằng $0.1\%$ ($0.001$), $\text{EAT}$ đã tăng từ $100\text{ ns}$ lên $8099.9\text{ ns}$ — tức tốc độ truy cập bộ nhớ bị kéo tụt hơn 80 lần.
- **Quy tắc sản xuất**: Tỷ lệ Major Page Fault trong hệ thống đám mây cần được giữ ở mức cực thấp ($p < 0.00001$).
</details>

### Câu Hỏi 11: Giới hạn `vm.max_map_count` trong nhân Linux có ý nghĩa gì, giá trị mặc định là bao nhiêu và gây ra lỗi gì cho các ứng dụng như Elasticsearch?

<details>
<summary>Đáp án</summary>

- **Ý nghĩa và giá trị mặc định**: `vm.max_map_count` là giới hạn số lượng vùng nhớ ảo tối đa mà một tiến trình được phép ánh xạ (`mmap`). Giá trị mặc định trong nhân Linux là `65530`.
- **Sự cố thực tế**: Các hệ thống như Elasticsearch / Lucene sử dụng `mmap` để ánh xạ hàng nghìn tệp chỉ mục tìm kiếm trực tiếp vào bộ nhớ ảo. Khi số lượng chỉ mục tăng vượt ngưỡng `65530`, tiến trình sẽ sụp đổ với lỗi `OutOfMemoryError: Map failed` hoặc từ chối khởi động với thông báo `vm.max_map_count [65530] is too low, increase to at least [262144]`.
- **Cách khắc phục**: Tăng giới hạn qua `sysctl` (ví dụ cấu hình `vm.max_map_count=262144` trong `/etc/sysctl.conf` và chạy `sudo sysctl -p`).
</details>

### Câu Hỏi 12: Với các ứng dụng đòi hỏi độ trễ cực thấp (như hệ thống giao dịch tài chính hoặc cơ sở dữ liệu In-Memory Redis), Linux cung cấp những cơ chế khóa RAM (Memory Locking) nào để tránh Page Fault?

<details>
<summary>Đáp án</summary>

Để ép buộc hệ điều hành nạp sẵn và ghim chặt dữ liệu vào RAM vật lý, không cho phép xảy ra Page Fault hay bị swap ra đĩa giữa lúc xử lý, lập trình viên có thể dùng:
1. Lời gọi hệ thống `mlock(addr, length)` hoặc `mlockall(MCL_CURRENT | MCL_FUTURE)` để khóa các trang nhớ trong RAM vật lý.
2. Cờ `MAP_POPULATE` khi gọi `mmap()`, ép buộc kernel nạp trước (pre-fault) toàn bộ các trang nhớ ngay tại thời điểm tạo ánh xạ.
</details>
