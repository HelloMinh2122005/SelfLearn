# Review: 1_2_1 Process Concept and Memory Anatomy

### Câu Hỏi 1: Sự khác biệt bản chất giữa Chương trình (Program) và Tiến trình (Process) là gì?

<details>
<summary>Đáp án</summary>

- **Chương trình (Program)** là một **thực thể tĩnh (passive entity)**: chỉ là tập hợp các chỉ lệnh mã máy và dữ liệu được biên dịch sẵn, nằm trên ổ đĩa lưu trữ dài hạn (như tệp ELF `/bin/ls` trên Linux hoặc tệp PE `.exe` trên Windows) và không tự tiêu tốn chu kỳ CPU hay bộ nhớ RAM.
- **Tiến trình (Process)** là một **thực thể động (active entity)**: theo giáo trình OSTEP, tiến trình là *"một chương trình đang trong quá trình thực thi"* (*a program in execution*). Khi được kích hoạt, hệ điều hành đọc tệp nhị phân từ ổ đĩa, nạp mã lệnh và dữ liệu vào RAM, phân bổ tài nguyên hệ thống và điều phối CPU để thực thi.
</details>

### Câu Hỏi 2: Trạng thái máy (Machine State) của một tiến trình bao gồm những thành phần chính nào?

<details>
<summary>Đáp án</summary>

Trạng thái máy (Machine State) của một tiến trình gồm 3 thành phần chính:
1. **Không gian địa chỉ bộ nhớ (Memory Address Space)**: Toàn bộ các byte bộ nhớ mà tiến trình được quyền truy cập, bao gồm mã lệnh và các cấu trúc dữ liệu đang đọc/ghi.
2. **Tập thanh ghi phần cứng của CPU (CPU Registers)**:
   - **Program Counter (`PC` / `RIP` trên x86-64)**: Lưu địa chỉ của câu lệnh mã máy kế tiếp sẽ được nạp và thực thi.
   - **Stack Pointer (`SP` / `RSP`)** và **Frame Pointer (`FP` / `RBP`)**: Quản lý đỉnh ngăn xếp và khung ngăn xếp của các hàm đang chạy.
   - **Các thanh ghi mục đích chung (General-Purpose Registers)**: Lưu giá trị tính toán tức thời, tham số hàm và cờ trạng thái xử lý (`RFLAGS`).
3. **Thông tin vào/ra (I/O Information)**: Danh sách các tài nguyên lưu trữ và mạng đang mở, quản lý qua **bảng mô tả tệp (Open File Descriptors - FDs)** gồm `stdin` (0), `stdout` (1), `stderr` (2) cùng các tệp tin hoặc socket mạng khác.
</details>

### Câu Hỏi 3: Trong kiến trúc x86-64 Linux, không gian địa chỉ bộ nhớ ảo của một tiến trình người dùng được tổ chức như thế nào và gồm những phân vùng chính nào?

<details>
<summary>Đáp án</summary>

Nhờ cơ chế trừu tượng hóa bộ nhớ ảo (Virtual Memory), mỗi tiến trình vận hành trong một không gian địa chỉ ảo biệt lập (lên tới **128 TB** cho không gian người dùng trên kiến trúc x86-64, từ `0x000000000000` đến `0x7FFFFFFFFFFF` ở Ring 3), tách biệt hoàn toàn với không gian nhân hệ điều hành (Kernel Space - Ring 0, chỉ truy cập khi có Software Trap / Syscall).

Hệ điều hành và bộ quản lý bộ nhớ phần cứng (MMU) chia không gian người dùng thành các phân vùng logic (Segments / VMAs) từ vùng địa chỉ thấp lên vùng địa chỉ cao theo thứ tự:
1. **Null Pointer Trap Page (`0x0`)**: Trang không ánh xạ để bẫy lỗi giải tham chiếu con trỏ NULL.
2. **Text / Code Segment**: Chứa chỉ lệnh mã máy đã biên dịch.
3. **Data Segment (Initialized Data)**: Chứa biến toàn cục/tĩnh đã khởi tạo giá trị khác 0.
4. **BSS Segment (Uninitialized Data)**: Chứa biến toàn cục/tĩnh chưa khởi tạo hoặc bằng 0.
5. **Heap Segment**: Cấp phát bộ nhớ động tại runtime (nở lên trên).
6. **Free Space**: Vùng đệm địa chỉ ảo chưa cấp phát nằm giữa Heap và Stack.
7. **Guard Page**: Trang bảo vệ nằm dưới đáy Stack để bẫy lỗi Stack Overflow.
8. **Stack Segment**: Lưu khung hàm, biến cục bộ và địa chỉ trở về (nằm ở vùng cao và nở xuống dưới).
</details>

### Câu Hỏi 4: Phân đoạn Text / Code Segment lưu trữ nội dung gì, có quyền truy cập nào và tại sao hệ thống nghiêm cấm quyền ghi vào phân đoạn này?

<details>
<summary>Đáp án</summary>

- **Vị trí và nội dung**: Text Segment nằm ở vùng địa chỉ thấp nhất của không gian bộ nhớ người dùng, chứa toàn bộ các chỉ lệnh mã máy nhị phân mà CPU nạp vào để thực thi.
- **Quyền truy cập**: Được thiết lập ở chế độ **Chỉ đọc và Thực thi (`r-x`)**, nghiêm cấm quyền ghi (`w`).
- **Lý do cấm quyền ghi**:
  1. Ngăn chặn chương trình tự ý sửa đổi mã lệnh của chính mình (Self-modifying code) hoặc bị mã độc ghi đè shellcode.
  2. Do là vùng chỉ đọc, nhiều tiến trình chạy cùng một chương trình (ví dụ cùng chạy `/bin/ls`) có thể chia sẻ chung một cách an toàn các khung trang bộ nhớ vật lý này trong RAM, trong khi dữ liệu riêng (Data, Heap, Stack) vẫn được cô lập hoàn toàn.
</details>

### Câu Hỏi 5: Phân đoạn Data và phân đoạn BSS khác nhau ở điểm nào? Tại sao việc khai báo một mảng toàn cục lớn gán giá trị 0 lại không làm phình kích thước tệp nhị phân trên ổ đĩa?

<details>
<summary>Đáp án</summary>

- **Phân đoạn Data (Initialized Data)**: Nằm ngay trên Text, có quyền Đọc và Ghi (`rw-`), kích thước cố định lúc biên dịch. Nó lưu các biến toàn cục và biến tĩnh **đã được gán giá trị khởi tạo khác 0 cụ thể** (ví dụ: `int max_retries = 5;`). Các giá trị này phải được lưu trực tiếp trong tệp nhị phân trên đĩa.
- **Phân đoạn BSS (Block Started by Symbol - Uninitialized Data)**: Nằm ngay trên Data, có quyền Đọc và Ghi (`rw-`), kích thước cố định. Nó lưu các biến toàn cục và biến tĩnh **chưa được gán giá trị cụ thể hoặc được khởi tạo bằng 0** (ví dụ: `int global_counter;` hoặc `static int cache[1024] = {0};`).
- **Lý do tệp nhị phân không bị phình to**: Để tối ưu dung lượng lưu trữ trên đĩa, định dạng ELF không ghi hàng triệu số 0 vào tệp thực thi mà chỉ ghi lại kích thước cần cấp phát cho vùng BSS. Khi nạp chương trình vào RAM, Kernel mới tự động cấp phát và ánh xạ các trang bộ nhớ đã điền sẵn số 0 (Zero-initialized memory) cho phân đoạn này.
</details>

### Câu Hỏi 6: Phân đoạn Heap được sử dụng để làm gì, phát triển theo hướng nào và thay đổi kích thước bằng các cơ chế nào?

<details>
<summary>Đáp án</summary>

- **Mục đích**: Heap nằm ngay phía trên đỉnh của BSS (quyền `rw-`), được dùng để **cấp phát bộ nhớ động tại thời gian chạy (runtime)** theo yêu cầu của ứng dụng (qua `malloc()`, `calloc()`, `realloc()`, `free()` trong C hoặc `new`/`delete` trong C++).
- **Hướng phát triển**: Bắt đầu từ vùng địa chỉ thấp và **nở dần lên trên về phía vùng địa chỉ cao hơn (grows upward)**.
- **Cơ chế điều chỉnh kích thước**: Hệ điều hành điều chỉnh kích thước Heap một cách linh hoạt thông qua các lời gọi hệ thống như `brk()`, `sbrk()` hoặc ánh xạ vùng nhớ ẩn danh `mmap()`.
</details>

### Câu Hỏi 7: Phân đoạn Stack hoạt động theo hướng nào và một Stack Frame chứa những thông tin gì khi một hàm được gọi?

<details>
<summary>Đáp án</summary>

- **Vị trí và hướng phát triển**: Stack nằm tại vùng địa chỉ cao nhất của không gian người dùng (quyền `rw-`) và **nở dần xuống dưới về phía các địa chỉ thấp hơn (grows downward)** — ngược chiều với Heap.
- **Thành phần của một Stack Frame**: Mỗi khi một hàm được gọi, hệ thống đẩy một Stack Frame vào Stack gồm:
  1. Các tham số truyền vào hàm (Function Arguments).
  2. Địa chỉ trở về (Return Address / `RIP`) để CPU biết câu lệnh tiếp theo sau khi hàm kết thúc.
  3. Con trỏ khung hàm trước đó (Saved Frame Pointer / `RBP`).
  4. Toàn bộ các biến cục bộ (Local / Automatic Variables) khai báo trong phạm vi hàm.
- **Khi hàm kết thúc**: Toàn bộ Stack Frame của hàm đó tự động được thu hồi (popped) bằng cách dịch chuyển con trỏ `RSP`.
</details>

### Câu Hỏi 8: Khoảng trống tự do (Free Space) và Trang bảo vệ ngăn xếp (Guard Page) đóng vai trò gì trong không gian địa chỉ ảo?

<details>
<summary>Đáp án</summary>

- **Khoảng trống tự do (Free Space)**: Là vùng địa chỉ ảo chưa ánh xạ tới khung trang vật lý, nằm giữa đỉnh Heap và đáy Stack. Nó đóng vai trò như vùng đệm giúp cả Heap và Stack có không gian mở rộng tự do mà không xâm lấn đè lên nhau.
- **Trang bảo vệ ngăn xếp (Guard Page)**: Là một hoặc nhiều trang bộ nhớ nằm ngay tại biên giới phía dưới vùng Stack với thuộc tính **Không có quyền truy cập (No Access / `---p`)**. Nếu Stack mở rộng quá mức và chạm vào Guard Page, phần cứng MMU sẽ phát hiện truy cập trái phép, kích hoạt bẫy ngắt trang (Page Fault) và hệ điều hành sẽ kết thúc tiến trình ngay lập tức bằng tín hiệu `SIGSEGV`, ngăn không cho Stack ghi đè phá hủy dữ liệu ở vùng Heap bên dưới.
</details>

### Câu Hỏi 9: Lệnh `size` trên Linux dùng để làm gì và các cột `text`, `data`, `bss`, `dec`, `hex` trong kết quả đầu ra có ý nghĩa như thế nào?

<details>
<summary>Đáp án</summary>

Lệnh `size` (thuộc bộ công cụ GNU Binary Utilities - binutils) dùng để kiểm tra và liệt kê kích thước chính xác của các phân đoạn tĩnh bên trong một tệp nhị phân định dạng ELF (ví dụ: `size /bin/ls`).

Ý nghĩa từng cột:
- **`text`**: Kích thước của phân đoạn mã máy thực thi và các hằng số chỉ đọc (tính bằng byte).
- **`data`**: Kích thước phân đoạn chứa các biến toàn cục và tĩnh đã gán giá trị khởi tạo cụ thể.
- **`bss`**: Kích thước vùng nhớ hệ điều hành cần dành sẵn cho các biến toàn cục và tĩnh chưa khởi tạo hoặc bằng 0 (sẽ được điền số 0 khi nạp vào RAM).
- **`dec`** và **`hex`**: Tổng dung lượng của 3 phân đoạn tĩnh (`text + data + bss`) biểu diễn lần lượt dưới dạng thập phân (decimal) và thập lục phân (hexadecimal).
</details>

### Câu Hỏi 10: Tệp ảo `/proc/[pid]/maps` cung cấp thông tin gì, gồm những trường dữ liệu nào và ký tự `p` trong quyền hạn `r-xp` hoặc `rw-p` mang ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- **Chức năng**: `/proc/[pid]/maps` (hoặc `/proc/self/maps` cho chính tiến trình hiện tại) hiển thị chi tiết tất cả các vùng bộ nhớ ảo (Virtual Memory Areas - VMAs) đang được ánh xạ của tiến trình cùng quyền truy cập tương ứng.
- **Các trường thông tin trên một dòng**:
  1. **Dải địa chỉ ảo**: Điểm bắt đầu và kết thúc của vùng nhớ.
  2. **Quyền hạn truy cập (`perms`)**: `r` (Read), `w` (Write), `x` (Execute), `p` (Private) hoặc `s` (Shared).
  3. **Offset**: Độ lệch vị trí tính từ đầu tệp nhị phân gốc.
  4. **Device & Inode**: Định danh thiết bị lưu trữ và chỉ số Inode của tệp thực thi.
  5. **Pathname**: Đường dẫn tệp được ánh xạ hoặc nhãn đặc biệt của Kernel như `[heap]`, `[stack]`.
- **Ý nghĩa của ký tự `p` (Private)**: Áp dụng cơ chế **Copy-on-Write (CoW)** (phân biệt với `s` - Shared). Khi tạo tiến trình con bằng `fork()`, cả tiến trình cha và con ban đầu dùng chung khung trang vật lý ở chế độ chỉ đọc; chỉ khi một bên thực hiện thao tác ghi, Kernel mới tạo bản sao vật lý riêng cho bên ghi để đảm bảo cô lập bộ nhớ mà không lãng phí RAM.
</details>

### Câu Hỏi 11: Hãy phân biệt nguyên nhân và hậu quả giữa Tràn ngăn xếp (Stack Overflow) và Cạn kiệt vùng nhớ động (Heap Exhaustion / OOM)?

<details>
<summary>Đáp án</summary>

- **Tràn ngăn xếp (Stack Overflow)**:
  - **Nguyên nhân**: Luồng thực thi hàm vượt quá giới hạn tối đa của Stack (được giới hạn qua `ulimit -s`, mặc định thường là 8 MB trên Linux), thường do đệ quy vô hạn hoặc khai báo biến/mảng cục bộ quá lớn trên Stack.
  - **Hậu quả**: Đỉnh Stack chạm vào Guard Page, MMU kích hoạt Page Fault và Kernel kết thúc ngay tiến trình với tín hiệu `SIGSEGV` (Segmentation Fault). Tiến trình sập tức thì mà không làm tiêu tốn cạn kiệt RAM của toàn bộ máy chủ.
- **Cạn kiệt vùng nhớ động (Heap Exhaustion / OOM)**:
  - **Nguyên nhân**: Ứng dụng liên tục cấp phát bộ nhớ trên Heap (`malloc()`) nhưng quên giải phóng (`free()`), gây ra **Memory Leak (Rò rỉ bộ nhớ)**, hoặc dữ liệu trong RAM vượt quá tổng RAM vật lý và Swap của máy chủ.
  - **Hậu quả**: Toàn máy rơi vào trạng thái cạn kiệt tài nguyên (Memory Pressure). Kernel kích hoạt cơ chế **OOM Killer** để rà soát điểm số phạt (`oom_score`) và tiêu diệt tiến trình ngốn nhiều bộ nhớ nhất nhằm bảo vệ hệ thống.
</details>

### Câu Hỏi 12: Lỗi Tràn bộ đệm trên ngăn xếp (Stack-based Buffer Overflow) gây ra rủi ro bảo mật gì và cơ chế ASLR giúp giảm thiểu rủi ro này như thế nào?

<details>
<summary>Đáp án</summary>

- **Rủi ro của Stack-based Buffer Overflow**: Trên Stack Frame, các biến cục bộ nằm tuần tự ngay phía trên địa chỉ trở về (Return Address / Saved `RIP`). Nếu lập trình viên dùng các hàm không kiểm tra độ dài dữ liệu (như `gets()`, `strcpy()`, `sprintf()`), kẻ tấn công có thể gửi dữ liệu vượt quá kích thước mảng đệm để ghi đè lên Return Address. Khi hàm thực thi lệnh `ret`, CPU sẽ nhảy tới địa chỉ mã độc thay vì quay về luồng hợp lệ (kỹ thuật Stack Smashing / ROP Chain).
- **Vai trò của ASLR (Address Space Layout Randomization)**: Trong hệ điều hành hiện đại, ASLR tự động tạo độ lệch ngẫu nhiên (random offset) cho vị trí bắt đầu của các vùng nhớ ảo như Stack, Heap và các thư viện liên kết động (`.so`) mỗi lần tiến trình khởi chạy lại. Nhờ đó, kẻ tấn công không thể đoán trước địa chỉ cố định của Stack hay các hàm hệ thống để khai thác lỗi tràn bộ đệm.
</details>
