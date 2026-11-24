# Review: 1_1_2 Dual-Mode Operation User Mode vs Kernel Mode

### Câu Hỏi 1: Nguyên lý Limited Direct Execution (LDE) giải quyết bài toán gì, và tại sao phải kết hợp cả "thực thi trực tiếp" lẫn "giới hạn phần cứng"?

<details>
<summary>Đáp án</summary>

- **Bài toán hiệu năng**: Để hệ thống đạt tốc độ tính toán tối đa, mã máy của tiến trình người dùng cần được thực thi trực tiếp trên phần cứng CPU (*native execution*) thay vì phải chạy qua các tầng giả lập hay thông dịch trung gian chậm chạp.
- **Lý do phải kết hợp giới hạn phần cứng**: Nếu để chương trình chạy trực tiếp mà không có giới hạn kiểm soát từ phần cứng và hệ điều hành, hệ điều hành sẽ mất quyền kiểm soát cỗ máy. Do đó, kiến trúc máy tính kết hợp thực thi trực tiếp (để đạt tốc độ) với giới hạn phần cứng (để giữ quyền kiểm soát an toàn).
</details>

### Câu Hỏi 2: Nếu một tiến trình được chạy trực tiếp hoàn toàn trên CPU mà không có bất kỳ rào cản kiểm soát nào, những rủi ro nào sẽ xảy ra và hệ điều hành sẽ bị ảnh hưởng ra sao?

<details>
<summary>Đáp án</summary>

Nếu không có rào cản kiểm soát từ hệ điều hành, hệ thống sẽ đối mặt với 3 thảm họa chính:
1. Một tiến trình bị lỗi hoặc cố tình chạy vòng lặp vô tận sẽ độc chiếm CPU vĩnh viễn, ngăn mọi tiến trình khác hoặc chính hệ điều hành có cơ hội can thiệp.
2. Một chương trình bất kỳ có thể tự do đọc và ghi đè vào không gian bộ nhớ của các chương trình khác hoặc ghi đè trực tiếp lên mã nguồn của chính hệ điều hành.
3. Tiến trình có thể tự do phát lệnh đọc/ghi I/O trực tiếp tới đĩa cứng, card mạng hoặc phần cứng thô, làm tê liệt toàn bộ cơ chế phân quyền và bảo vệ.

Khi mất quyền kiểm soát như vậy, hệ điều hành bị hạ cấp xuống chỉ còn đóng vai trò như *"một thư viện tiện ích"* (*"just a library"*), không còn là một hệ điều hành thực thụ.
</details>

### Câu Hỏi 3: Sự khác biệt cốt lõi giữa User Mode và Kernel Mode về đối tượng thực thi và phạm vi quyền hạn là gì?

<details>
<summary>Đáp án</summary>

- **User Mode (Chế độ người dùng - Unprivileged Mode)**:
  - **Đối tượng thực thi**: Các chương trình ứng dụng thông thường (trình duyệt web, ứng dụng web backend, trình biên dịch, công cụ dòng lệnh).
  - **Quyền hạn**: Bị phần cứng giới hạn nghiêm ngặt; bị cấm thực hiện các thao tác đặc quyền (*privileged operations*) như phát lệnh I/O trực tiếp tới đĩa cứng/card mạng, sửa đổi bảng phân trang bộ nhớ, hoặc thực thi các chỉ lệnh thay đổi trạng thái phần cứng CPU (như tắt ngắt).
- **Kernel Mode (Chế độ nhân / giám sát - Privileged / Supervisor Mode)**:
  - **Đối tượng thực thi**: Nhân hệ điều hành (OS Kernel).
  - **Quyền hạn**: Sở hữu toàn quyền đối với phần cứng máy tính—được thực thi toàn bộ tập lệnh CPU, truy cập toàn bộ không gian địa chỉ bộ nhớ vật lý, thao tác trực tiếp với các thanh ghi điều khiển hệ thống của CPU và toàn bộ thiết bị ngoại vi I/O.
</details>

### Câu Hỏi 4: Trong thực tế trên kiến trúc x86 và x86-64, mức đặc quyền hiện tại của CPU được lưu trữ ở đâu và khác gì so với mô hình "Mode Bit" trong sách giáo khoa?

<details>
<summary>Đáp án</summary>

- **Mô hình trừu tượng trong sách giáo khoa**: Mô tả giản lược rằng CPU có một *"Mode Bit"* đơn lẻ nằm trong thanh ghi trạng thái (PSW - Processor Status Word), với quy ước `1` là User Mode và `0` là Kernel Mode.
- **Thực tế trên x86 và x86-64**: Phần cứng **không** có "Mode Bit" đơn lẻ trong thanh ghi trạng thái `EFLAGS` / `RFLAGS`. Thay vào đó, quyền hạn thực thi được quản lý qua trường **CPL (Current Privilege Level)** gồm 2 bit, lưu ở **2 bit thấp nhất của thanh ghi đoạn mã `%cs` (Code Segment Register)**.
</details>

### Câu Hỏi 5: Các giá trị của trường CPL trong thanh ghi `%cs` biểu thị chế độ hoạt động nào, và Linux Kernel kiểm tra tiến trình có đang ở User Mode bằng cách nào?

<details>
<summary>Đáp án</summary>

- **Giá trị của CPL (2 bit thấp nhất của `%cs`)**:
  - `00b` (giá trị `0`): Mức đặc quyền tối cao — **Ring 0** (Kernel Mode).
  - `11b` (giá trị `3`): Mức đặc quyền tối thiểu — **Ring 3** (User Mode).
- **Cách Linux Kernel kiểm tra**: Trong mã nguồn Linux cho kiến trúc x86 (`arch/x86/include/asm/segment.h` và `ptrace.h`), kernel dùng mặt nạ `SEGMENT_RPL_MASK` (`0x3`) qua hàm `user_mode(regs)` với biểu thức `!!(regs->cs & 3)`. Nếu 2 bit cuối của `%cs` khác `0` (bằng `3`), tiến trình đang chạy ở User Mode (Ring 3).
</details>

### Câu Hỏi 6: Để chuyển đổi chế độ hoạt động trên kiến trúc x86-64, vì sao không thể chỉ lật một bit trong thanh ghi cờ `RFLAGS`?

<details>
<summary>Đáp án</summary>

Vì trên kiến trúc x86-64 không tồn tại bit nào tên là "Mode Bit" trong thanh ghi cờ `RFLAGS`. Quyền hạn thực thi được xác định bởi trường 2-bit **CPL** nằm trong thanh ghi đoạn mã **`%cs`**, nên để chuyển đổi chế độ hoạt động, CPU bắt buộc phải nạp lại thanh ghi `%cs` thông qua các chỉ lệnh chuyển đổi đặc thù (như `SYSCALL`/`SYSENTER` để vào Kernel Mode và `SYSRET`/`SYSRETQ`/`IRETQ` để trở về User Mode).
</details>

### Câu Hỏi 7: Trong thiết kế lịch sử của kiến trúc x86, 4 vòng bảo vệ (Ring 0 đến Ring 3) được định nghĩa cho những thành phần nào?

<details>
<summary>Đáp án</summary>

Kiến trúc x86 định nghĩa 4 vòng bảo vệ theo thứ tự quyền hạn giảm dần từ Ring 0 đến Ring 3:
- **Ring 0**: Kernel Mode (mức đặc quyền cao nhất).
- **Ring 1**: Được thiết kế cho các dịch vụ cốt lõi của hệ điều hành.
- **Ring 2**: Được thiết kế cho các trình điều khiển thiết bị (Device Drivers).
- **Ring 3**: User Mode (mức đặc quyền thấp nhất, dành cho ứng dụng người dùng).
</details>

### Câu Hỏi 8: Vì sao các hệ điều hành hiện đại như Linux và Windows bỏ qua Ring 1 và Ring 2, chỉ sử dụng mô hình 2 mức (Ring 0 và Ring 3)?

<details>
<summary>Đáp án</summary>

Quyết định này xuất phát từ 3 lý do kỹ thuật căn bản:
1. **Tính tương thích đa kiến trúc (Portability)**: Nhiều kiến trúc RISC phổ biến (như ARM, MIPS, RISC-V) trong thiết kế ban đầu chỉ cung cấp 2 mức đặc quyền (User Mode và Supervisor/Privileged Mode). Chuẩn hóa trên mô hình 2 mức giúp nhân Linux và Windows dễ biên dịch và chạy thống nhất trên nhiều nền tảng phần cứng.
2. **Giới hạn của cơ chế phân trang phần cứng MMU**: Trong bảng phân trang x86, MMU chỉ cung cấp **1 bit duy nhất** là cờ **U/S (User/Supervisor Bit)**. Bit này chỉ phân biệt giữa User (Ring 3) và Supervisor (Ring 0, 1, 2), nên phần cứng bộ nhớ không thể bảo vệ riêng biệt cho Ring 1 và Ring 2.
3. **Tối ưu hóa các lệnh chuyển đổi nhanh (Fast Syscalls)**: Các chỉ lệnh hiện đại như `SYSCALL`/`SYSRET` trên x86-64 được tối ưu phần cứng để nhảy trực tiếp giữa Ring 3 và Ring 0 mà không hỗ trợ các vòng trung gian.
</details>

### Câu Hỏi 9: Trên thực tế ở Linux và Windows hiện đại, các trình điều khiển thiết bị (Device Drivers) được chạy ở vòng bảo vệ nào?

<details>
<summary>Đáp án</summary>

Device Drivers **không** chạy ở Ring 1 hay Ring 2 như thiết kế lý thuyết ban đầu của x86. Trên cả Linux và Windows, driver hoặc chạy trực tiếp trong **Kernel Mode (Ring 0)**, hoặc được đưa hoàn toàn ra ngoài **User Space (Ring 3)** trong các kiến trúc user-space drivers (như Windows UMDF hoặc DPDK trên Linux).
</details>

### Câu Hỏi 10: Chỉ lệnh đặc quyền (Privileged Instructions) là gì và gồm những nhóm lệnh tiêu biểu nào trên x86-64?

<details>
<summary>Đáp án</summary>

**Chỉ lệnh đặc quyền** (*Privileged Instructions*) là tập hợp các chỉ lệnh máy nhạy cảm được phần cứng quy định chỉ được phép thực thi khi CPU ở trạng thái `CPL = 0` (Ring 0 / Kernel Mode). Trong bài học, các nhóm lệnh tiêu biểu gồm:
- **Quản lý trạng thái CPU & Ngắt**: `HLT` (tạm dừng CPU), `CLI` (vô hiệu hóa ngắt phần cứng), `STI` (cho phép ngắt).
- **Quản lý bảng quản trị hệ thống**: `LIDT` (nạp bảng vector ngắt), `LGDT` (nạp Global Descriptor Table Register), `LTR` (nạp Task Register).
- **Quản lý bộ nhớ ảo & Phân trang**: `MOV CR0, ...`, `MOV CR3, ...` (trong đó thanh ghi `CR3` chứa địa chỉ cơ sở bảng phân trang bộ nhớ của tiến trình).
</details>

### Câu Hỏi 11: Tiến trình ở User Mode muốn thực hiện các tác vụ cần quyền phần cứng (như đọc/ghi file, gửi gói tin mạng) một cách hợp lệ thì phải thực hiện qua cơ chế nào?

<details>
<summary>Đáp án</summary>

Tiến trình không được phép thao tác trực tiếp với phần cứng mà phải gửi yêu cầu thông qua cơ chế **Lời gọi hệ thống (System Call / Trap)** — ví dụ trên x86-64 sử dụng chỉ lệnh `SYSCALL` hoặc `SYSENTER` để chuyển sang `CPL = 0` một cách an toàn qua Handler định sẵn của Kernel. Kernel sẽ kiểm tra tính hợp lệ, thực thi thay cho tiến trình rồi dùng `SYSRET` hoặc `IRETQ` để trả kết quả và phục hồi `CPL = 3` về User Mode.
</details>

### Câu Hỏi 12: Khi một tiến trình ở User Mode (Ring 3) cố tình thực thi một chỉ lệnh đặc quyền (như `HLT` hoặc `CLI`), phần cứng CPU và Linux Kernel sẽ xử lý như thế nào?

<details>
<summary>Đáp án</summary>

Quá trình xử lý diễn ra qua 3 bước:
1. **Phát hiện tại phần cứng**: Bộ giải mã lệnh kiểm tra trường CPL ở 2 bit thấp của thanh ghi `%cs`. Vì `CPL = 3` (khác `0`), CPU từ chối thực thi chỉ lệnh đặc quyền đó.
2. **Kích hoạt ngoại lệ phần cứng**: CPU lập tức dừng luồng thực thi thông thường, lưu trạng thái thanh ghi của tiến trình vào ngăn xếp kernel và kích hoạt ngoại lệ **General Protection Fault (`#GP`, Vector ngắt số 13)**, đồng thời ép nhảy vào IDT Handler trong Kernel (`exc_general_protection` trong `arch/x86/kernel/traps.c`).
3. **Phản ứng của Linux Kernel**: Kernel gọi `user_mode(regs)` kiểm tra ngữ cảnh. Vì lỗi phát sinh từ Ring 3 (`regs->cs & 3 != 0`), kernel gọi `gp_user_force_sig_segv()` để gửi tín hiệu **`SIGSEGV` (Signal 11)** tiêu diệt tiến trình vi phạm ngay lập tức (hiển thị lỗi `Segmentation fault (core dumped)`).
</details>

### Câu Hỏi 13: Tại sao quan niệm cho rằng lỗi `SIGSEGV` (Segmentation fault) chỉ xuất hiện khi truy cập sai vùng nhớ lại là một hiểu lầm phổ biến?

<details>
<summary>Đáp án</summary>

Ngoài nguyên nhân truy cập sai vùng nhớ (như dereference con trỏ `NULL` hoặc truy cập ngoài phạm vi mảng), trên Linux x86-64 khi mã ứng dụng ở User Mode cố tình thực thi một chỉ lệnh đặc quyền (như `HLT`, `CLI`, `LIDT`), CPU sẽ phát sinh ngoại lệ phần cứng **`#GP` (General Protection Fault)** và nhân Linux quy đổi ngoại lệ `#GP` từ không gian người dùng thành tín hiệu **`SIGSEGV`** để tiêu diệt tiến trình. Vì vậy, `SIGSEGV` cũng có thể bắt nguồn từ hành vi vi phạm đặc quyền chỉ lệnh.
</details>
