# Review: 1_7_1 Logical vs Physical Address Space and the MMU

### Câu Hỏi 1: Tại sao khi chuyển từ hệ thống đơn nhiệm (uniprogramming) sang hệ điều hành đa nhiệm (multitasking), việc tách biệt Không gian Địa chỉ Logic và Không gian Địa chỉ Vật lý lại trở nên cần thiết?

<details>
<summary>Đáp án</summary>

Trong kỷ nguyên đơn nhiệm, chương trình truy cập trực tiếp bằng địa chỉ vật lý trên RAM. Khi hệ điều hành đa nhiệm ra đời và cho phép nhiều tiến trình cùng chia sẻ một thanh RAM vật lý, hai thách thức lớn xuất hiện:
1. **Bảo vệ và cách ly dữ liệu**: Làm sao để tiến trình A không thể đọc trộm dữ liệu (như mật khẩu) hoặc ghi đè làm hỏng bộ nhớ của tiến trình B.
2. **Đơn giản hóa cho lập trình viên**: Làm sao để người lập trình không phải bận tâm chương trình của mình sẽ được nạp vào vị trí thực tế nào trong RAM khi chạy.

Kỹ thuật **Trừu tượng hóa Bộ nhớ (Memory Virtualization)** bằng cách tách biệt **Không gian Địa chỉ Logic (Địa chỉ Ảo)** và **Không gian Địa chỉ Vật lý (Địa chỉ Thực)** giúp giải quyết triệt để hai vấn đề này.
</details>

### Câu Hỏi 2: Địa chỉ Logic (Logical / Virtual Address) và Địa chỉ Vật lý (Physical Address) khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- **Địa chỉ Logic (Logical / Virtual Address)**: Là địa chỉ do CPU sinh ra trong quá trình nạp và thực thi lệnh của chương trình (ví dụ: con trỏ lệnh `RIP`, địa chỉ biến trên Stack, con trỏ trả về từ `malloc()`). Tiến trình nhìn thấy một không gian bộ nhớ riêng biệt, liên tục bắt đầu từ `0x0` đến giới hạn kiến trúc (như $2^{32} = 4\text{ GB}$ trên hệ 32-bit, hoặc không gian 48-bit / 57-bit trên hệ 64-bit x86-64) và không biết địa chỉ RAM thực tế mình đang chiếm giữ.
- **Địa chỉ Vật lý (Physical Address)**: Là địa chỉ thực tế xuất hiện trên các chân đường truyền địa chỉ của bus phần cứng (Memory Bus) để kích hoạt các ô nhớ (Memory Cells) bên trong chip RAM, được bộ điều khiển bộ nhớ (Memory Controller) sử dụng để đọc hoặc ghi dữ liệu.
</details>

### Câu Hỏi 3: Ba giai đoạn Ràng buộc Địa chỉ (Address Binding) gồm những gì và tại sao hệ điều hành hiện đại bắt buộc phải dùng Execution Time (Runtime)?

<details>
<summary>Đáp án</summary>

Ba giai đoạn gắn kết địa chỉ gồm:
1. **Compile Time (Thời điểm biên dịch)**: Sinh mã địa chỉ tuyệt đối (Absolute code) khi biết trước vị trí trong RAM. Nếu đổi vị trí nạp phải biên dịch lại toàn bộ, chỉ phù hợp với hệ thống nhúng đơn giản, không khả thi cho OS đa nhiệm hiện đại.
2. **Load Time (Thời điểm nạp)**: Sinh mã có thể tái định vị (Relocatable code), để Bộ nạp (Loader) cộng offset khi nạp vào RAM. Tuy nhiên, nếu tiến trình bị hoán đổi (swap out) ra đĩa rồi nạp lại vào vùng RAM khác, việc tính lại toàn bộ địa chỉ gây tổn hao hiệu năng rất lớn.
3. **Execution Time / Runtime (Thời gian thực thi)**: Giữ nguyên địa chỉ logic trong suốt quá trình chạy và chỉ ánh xạ sang địa chỉ vật lý ngay tại thời điểm CPU thực thi lệnh truy xuất bộ nhớ (bắt buộc phải có phần cứng **MMU** hỗ trợ). Cách này cho phép tiến trình di chuyển linh hoạt tới các vị trí RAM khác nhau (khi swapping/paging) mà không cần sửa đổi mã máy.
</details>

### Câu Hỏi 4: MMU (Memory Management Unit) là gì và nó đảm nhận hai nhiệm vụ cốt lõi nào?

<details>
<summary>Đáp án</summary>

**MMU (Đơn vị Quản lý Bộ nhớ)** là một mạch tích hợp phần cứng nằm trực tiếp bên trong CPU (hoặc kết nối chặt chẽ cùng CPU core). Hai nhiệm vụ cốt lõi của MMU là:
1. **Chuyển đổi địa chỉ tốc độ cao**: Dịch từ Địa chỉ Ảo (Virtual Address) sang Địa chỉ Vật lý (Physical Address) ngay trong chu kỳ xung nhịp phần cứng (ở tốc độ nano giây) mà không làm suy giảm hiệu năng thực thi lệnh.
2. **Thực thi bảo vệ bộ nhớ (Memory Protection)**: Ngăn chặn tiến trình ở chế độ người dùng (User Mode) truy xuất vào vùng nhớ của nhân (Kernel Space) hoặc vùng nhớ của tiến trình khác.
</details>

### Câu Hỏi 5: Trong cơ chế tái định vị động dùng cặp thanh ghi Base và Limit (Base and Bounds), phần cứng CPU/MMU kiểm tra và tính toán địa chỉ logic $L$ như thế nào?

<details>
<summary>Đáp án</summary>

Trong cơ chế này:
- **Thanh ghi Base** lưu địa chỉ vật lý khởi đầu của tiến trình trong RAM.
- **Thanh ghi Limit** quy định kích thước không gian địa chỉ hợp lệ của tiến trình.

Khi tiến trình phát ra một địa chỉ logic $L$, phần cứng thực hiện kiểm tra điều kiện an toàn $0 \le L < \text{Limit}$:
- **Nếu hợp lệ ($L < \text{Limit}$)**: Bộ cộng phần cứng tính $\text{Physical Address} = L + \text{Base}$ rồi đẩy địa chỉ vật lý này lên bus bộ nhớ để truy xuất RAM.
- **Nếu vi phạm ($L \ge \text{Limit}$)**: Phần cứng lập tức chặn truy xuất và kích hoạt ngắt ngoại lệ (Hardware Trap / Addressing Exception). Nhân hệ điều hành bắt lấy ngoại lệ và gửi tín hiệu `SIGSEGV` (Segmentation Fault) để chấm dứt tiến trình vi phạm.
</details>

### Câu Hỏi 6: Việc tách biệt không gian địa chỉ logic và vật lý mang lại 3 lợi ích cốt lõi nào?

<details>
<summary>Đáp án</summary>

1. **Bảo vệ và Cách ly (Protection & Isolation)**: Mỗi tiến trình bị rào chắn trong phạm vi địa chỉ của riêng mình bởi MMU, nên không thể can thiệp vào bộ nhớ của tiến trình khác hay làm sập hệ điều hành.
2. **Mô hình lập trình đơn giản, đồng nhất (Uniform Address Space)**: Lập trình viên và trình biên dịch không cần quan tâm máy có bao nhiêu RAM hay RAM bị phân mảnh thế nào; chương trình luôn có một không gian địa chỉ chuẩn mực bắt đầu từ địa chỉ gốc.
3. **Chia sẻ bộ nhớ an toàn (Memory Sharing)**: Nhiều tiến trình khác nhau có thể dùng chung các trang mã máy chỉ đọc (Read-Only Code Pages) của các thư viện hệ thống dùng chung (như `libc.so`), giúp tiết kiệm dung lượng RAM vật lý.
</details>

### Câu Hỏi 7: Không gian địa chỉ ảo (Virtual Memory Layout) của một tiến trình Linux x86-64 gồm những phân vùng chính nào, và chiều phát triển của Heap với Stack khác nhau ra sao?

<details>
<summary>Đáp án</summary>

Sắp xếp từ vùng địa chỉ thấp đến vùng địa chỉ cao trên Linux x86-64 gồm:
- **Vùng địa chỉ cực thấp (`0x00000000`)**: Vùng cấm không ánh xạ để bẫy con trỏ `NULL`.
- **Text / Code Segment**: Chứa mã máy nhị phân (Read-Only & Executable).
- **Data Segment**: Chứa biến toàn cục và biến tĩnh đã khởi tạo giá trị.
- **BSS Segment**: Chứa biến toàn cục và biến tĩnh chưa khởi tạo (mặc định bằng 0).
- **Heap**: Bộ nhớ cấp phát động (`malloc`, `brk`, `sbrk`), **tăng dần lên trên** (về phía địa chỉ cao hơn).
- **Vùng trống chưa cấp phát (Guard Page)**: Khoảng trống ngăn cách giữa Heap và Stack.
- **Stack**: Ngăn xếp cục bộ (biến local, stack frames), **tăng dần xuống dưới** (về phía địa chỉ thấp hơn).
- **Kernel Space**: Vùng nhớ của nhân hệ điều hành ở vùng địa chỉ cực cao, cấm User Mode truy xuất.
</details>

### Câu Hỏi 8: Trên Linux, có thể dùng lệnh hoặc tệp ảo nào để kiểm tra bản đồ bộ nhớ ảo của một tiến trình đang chạy, và ý nghĩa của quyền `r-xp` so với `rw-p` là gì?

<details>
<summary>Đáp án</summary>

Có thể dùng hai cách để kiểm tra bản đồ bộ nhớ ảo của tiến trình có mã PID tương ứng:
- Đọc tệp ảo từ nhân Linux: `cat /proc/[pid]/maps`
- Dùng công cụ báo cáo chi tiết: `pmap -x [pid]`

Ý nghĩa các quyền hạn (Permissions):
- **`r-xp`** (Read, eXecute, Private): Dành cho phân vùng mã máy (Text/Code), cho phép đọc và thực thi nhưng **cấm ghi**. Nếu tiến trình cố tình ghi vào vùng `r-xp`, MMU sẽ chặn đứng và báo lỗi vi phạm quyền hạn.
- **`rw-p`** (Read, Write, Private): Dành cho các phân vùng dữ liệu (Data, BSS, Heap, Stack), cho phép đọc và ghi.
</details>

### Câu Hỏi 9: Tại sao truy xuất con trỏ hoang (Wild Pointer) hoặc con trỏ `NULL` lại gây lỗi `SIGSEGV`, và vì sao hệ điều hành cố tình không ánh xạ vùng địa chỉ `0x0`?

<details>
<summary>Đáp án</summary>

- Lỗi `SIGSEGV` (Signal 11 - Segmentation Fault) xảy ra khi chương trình cố truy xuất một địa chỉ logic chưa được ánh xạ trong bảng của MMU hoặc vi phạm quyền bảo vệ (như ghi vào vùng chỉ đọc).
- Hệ điều hành hiện đại cố tình **không bao giờ ánh xạ** vài kilobyte đầu tiên của không gian địa chỉ ảo (từ `0x00000000` đến `0x0000FFFF`). Nhờ vậy, bất kỳ thao tác truy xuất con trỏ `NULL` nào (`*ptr = 0` khi `ptr == NULL`) cũng kích hoạt bẫy MMU ngay lập tức và kết liễu tiến trình, giúp lập trình viên phát hiện lỗi logic ngay tức thì thay vì âm thầm làm hỏng bộ nhớ.
</details>

### Câu Hỏi 10: Hiện tượng cạn kiệt Không gian Địa chỉ Ảo trên hệ 32-bit xảy ra như thế nào, và kỹ thuật ASLR bảo vệ tiến trình trong môi trường sản xuất ra sao?

<details>
<summary>Đáp án</summary>

- **Cạn kiệt Không gian Địa chỉ Ảo trên hệ 32-bit**: Tiến trình 32-bit (như JVM 32-bit, Node.js 32-bit) chỉ có tối đa $2^{32} = 4\text{ GB}$ địa chỉ logic, và bị chia cho User Space (khoảng $2\text{ GB}$ hoặc $3\text{ GB}$) với phần còn lại cho Kernel Space. Do đó, ngay cả khi máy chủ vật lý có $64\text{ GB}$ RAM, tiến trình 32-bit vẫn có thể gặp lỗi `OutOfMemoryError` khi tổng dung lượng Stack và Heap chạm ngưỡng giới hạn ảo (khoảng $3\text{ GB}$). Thực tiễn tốt nhất là triển khai ứng dụng trên nền tảng 64-bit (x86-64 / ARM64).
- **Bảo mật ASLR (Address Space Layout Randomization)**: Khi bật ASLR trên Linux (`/proc/sys/kernel/randomize_va_space = 2`), mỗi lần chương trình khởi chạy, địa chỉ khởi đầu của Stack, Heap và các thư viện liên kết động (`.so`) được di dời ngẫu nhiên trong không gian ảo. Điều này ngăn tin tặc dự đoán chính xác địa chỉ cố định của hàm để thực hiện các cuộc tấn công khai thác tràn bộ đệm (Buffer Overflow / Return-Oriented Programming).
</details>
