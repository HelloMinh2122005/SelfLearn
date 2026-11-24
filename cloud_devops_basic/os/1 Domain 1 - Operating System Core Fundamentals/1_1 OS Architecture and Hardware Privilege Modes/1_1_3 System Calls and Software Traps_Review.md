# Review: 1_1_3 System Calls and Software Traps

### Câu Hỏi 1: Vì sao các chương trình người dùng (User Programs) không thể tự thực hiện các tác vụ như tương tác thiết bị I/O hay cấp phát bộ nhớ vật lý mà phải thông qua System Call và Software Trap?

<details>
<summary>Đáp án</summary>

- Để đảm bảo tính ổn định và an toàn, CPU áp dụng mô hình phân tách đặc quyền **Dual-Mode**: **Ring 3 (User Mode)** và **Ring 0 (Kernel Mode)**.
- Các chương trình người dùng chạy ở chế độ không đặc quyền (User Mode) và bị tước bỏ quyền thực thi trực tiếp các chỉ lệnh nhạy cảm như tương tác với thiết bị I/O, cấp phát bộ nhớ vật lý hay quản lý ngắt.
- Khi cần thực hiện các tác vụ này, chương trình bắt buộc phải yêu cầu nhân hệ điều hành (Kernel) thực hiện giúp thông qua **Lời gọi hệ thống (System Call - Syscall)** và cơ chế **Bẫy phần mềm (Software Trap)**.
</details>

### Câu Hỏi 2: Sự khác biệt cốt lõi giữa một lời gọi hàm thông thường (Procedure Call) và một lời gọi hệ thống (System Call) là gì?

<details>
<summary>Đáp án</summary>

1. **Cơ chế chuyển giao**: Procedure Call dùng lệnh `call` của CPU để nhảy trực tiếp tới một địa chỉ bộ nhớ; System Call dùng chỉ lệnh bẫy phần cứng (như `syscall`) để kích hoạt chuyển giao vào Kernel.
2. **Mức đặc quyền CPU**: Procedure Call giữ nguyên ở User Mode (Ring 3); System Call nâng mức đặc quyền lên Kernel Mode (Ring 0).
3. **Không gian địa chỉ**: Procedure Call chạy trong cùng không gian địa chỉ ảo của tiến trình người dùng; System Call chuyển giao sang không gian Kernel.
4. **Kiểm soát điểm vào**: Với Procedure Call, tiến trình tự do quyết định địa chỉ nhảy tới; với System Call, điểm vào được cố định nghiêm ngặt qua **Trap Table** (nếu cố tình dùng `call` nhảy vào vùng nhớ Kernel, CPU sẽ phát sinh lỗi vi phạm bảo vệ phần cứng và kết thúc tiến trình bằng tín hiệu `SIGSEGV`).
5. **Ngăn xếp (Stack) sử dụng**: Procedure Call dùng **User Stack**; System Call dùng **Per-process Kernel Stack**.
</details>

### Câu Hỏi 3: Các hàm như `read()`, `write()`, `open()` trong ngôn ngữ C đóng vai trò gì trong cơ chế System Call?

<details>
<summary>Đáp án</summary>

- Về mặt cú pháp, chúng trông giống một lời gọi hàm thông thường, nhưng thực chất chúng là các **hàm bọc (wrapper function)** của thư viện C chuẩn (`glibc` / `musl`).
- Bên trong, hàm wrapper thực hiện: chuẩn bị các tham số, đặt số hiệu syscall tương ứng vào thanh ghi quy định, và kích hoạt một **chỉ lệnh bẫy phần cứng đặc biệt** (`syscall`) để chuyển quyền điều khiển vào Kernel.
</details>

### Câu Hỏi 4: Software Trap là gì, Bảng bẫy (Trap Table / IDT) được khởi tạo khi nào và tại sao thiết kế này ngăn chặn được việc người dùng thực thi mã tùy ý trong Kernel?

<details>
<summary>Đáp án</summary>

- **Software Trap** là cơ chế chuyển giao quyền điều khiển đồng bộ do chính luồng lệnh đang thực thi của tiến trình kích hoạt, với sự trợ giúp của phần cứng CPU để đồng thời chuyển con trỏ lệnh vào Kernel và nâng mức đặc quyền từ User Mode lên Kernel Mode.
- **Thời điểm khởi tạo (Boot Time Initialization)**: Kernel thiết lập **Trap Table / Interrupt Descriptor Table (IDT)** (và thanh ghi `IA32_LSTAR` cho lệnh `syscall` trên x86-64) duy nhất một lần lúc hệ thống khởi động, khi CPU đang chạy ở chế độ đặc quyền tối cao (Kernel Mode / Ring 0), để nạp địa chỉ các **Trap Handlers** vào phần cứng.
- **Tại sao không cho User tự `JMP` / `CALL` thẳng vào Kernel**: Nếu cho phép chương trình người dùng tự chọn địa chỉ nhảy khi vào Kernel, kẻ tấn công có thể nhảy thẳng vào giữa hàm để bỏ qua đoạn kiểm tra quyền ở đầu hàm Kernel, hoặc điều hướng CPU nhảy tới một vùng RAM chứa mã độc và thực thi nó với toàn quyền Ring 0.
- **Cách Trap Table / IDT hoạt động qua 2 giai đoạn**:
  1. **Lúc boot (Ring 0)**: Kernel thiết lập danh sách cố định ánh xạ từng số hiệu ngắt/bẫy tới đúng địa chỉ dòng đầu tiên của hàm xử lý tương ứng (như `divide_error`, `page_fault`, `entry_SYSCALL_64`...) rồi dùng lệnh đặc quyền (`lidt` cho IDT, `wrmsr` cho `IA32_LSTAR`) nạp vào phần cứng CPU.
  2. **Lúc chạy (Ring 3)**: Tiến trình người dùng không có quyền sửa bảng này và cũng không được truyền địa chỉ nhảy; nó chỉ được phép gửi một con số yêu cầu (số hiệu syscall/trap). Phần cứng CPU tự tra bảng đã khóa sẵn và ép con trỏ lệnh nhảy đúng vào dòng đầu tiên của Trap Handler đã đăng ký.
- **Tính bảo vệ**: Vì mã người dùng ở Ring 3 không thể sửa đổi bảng tra cứu phần cứng lẫn tự chỉ định đích nhảy, mọi lối vào Kernel đều bị đóng khung tại các điểm đầu vào (entry points) hợp lệ duy nhất do Kernel định nghĩa trước.
- **Ví dụ đời thường**: Cơ chế này giống bảng tổng đài đấu dây cứng từ lúc xây tòa nhà — khách ở ngoài chỉ được bấm các nút số có sẵn (ví dụ phím `1` gặp lễ tân, phím `2` gọi bảo vệ), hoàn toàn không thể tự cạy hộp điện để đấu lại dây hay đi thẳng vào buồng điều khiển.
</details>

### Câu Hỏi 5: Khi xảy ra Software Trap và khi kết thúc xử lý trong Kernel, hệ thống lưu trữ và khôi phục ngữ cảnh thanh ghi như thế nào?

<details>
<summary>Đáp án</summary>

1. **Khi vào bẫy (Trap)**: Phần cứng CPU và mã stub đầu vào của Kernel tự động đẩy toàn bộ trạng thái thanh ghi của người dùng (Registers, Flags, Program Counter / `RIP`, con trỏ ngăn xếp `RSP`) vào **ngăn xếp Kernel riêng biệt của từng tiến trình (per-process kernel stack)**.
2. **Khi quay về (Return-from-trap)**: Kernel gọi chỉ lệnh quay về đặc biệt (trên x86-64 là `sysretq` hoặc `iretq`). Lệnh này thực hiện đồng thời và nguyên tử:
   - Khôi phục các thanh ghi, cờ trạng thái và Program Counter từ Kernel Stack (riêng `sysretq` khôi phục `RIP` từ `RCX` và `RFLAGS` từ `R11`).
   - Hạ mức đặc quyền của CPU từ Kernel Mode (Ring 0) trở lại User Mode (Ring 3) để tiếp tục chạy câu lệnh kế tiếp của chương trình người dùng.
</details>

### Câu Hỏi 6: Cơ chế Fast System Call trên kiến trúc x86-64 Linux (`syscall` / `sysretq`) cải tiến gì so với lệnh ngắt `int 0x80` trên kiến trúc 32-bit cũ?

<details>
<summary>Đáp án</summary>

- Trên kiến trúc 32-bit cũ, `int 0x80` buộc CPU phải truy cập bộ nhớ RAM để tra cứu bảng IDT, gây tốn nhiều chu kỳ xung nhịp.
- Trên **x86-64 Linux**, cặp lệnh `syscall` và `sysretq` sử dụng các thanh ghi chuyên dụng **Model-Specific Registers (MSRs)** (`IA32_STAR`, `IA32_LSTAR`, `IA32_FMASK`) đã được Kernel nạp sẵn lúc khởi động.
- Nhờ đó, CPU loại bỏ hoàn toàn việc tra cứu bảng IDT trong RAM: khi gặp lệnh `syscall`, CPU nhảy tức thì đến địa chỉ entry point của Kernel (`entry_SYSCALL_64`) đang lưu trong thanh ghi **`IA32_LSTAR`**.
</details>

### Câu Hỏi 7: Theo quy ước gọi System Call (Syscall Calling Convention) trên Linux x86-64, số hiệu syscall, các tham số và giá trị trả về được đặt vào những thanh ghi nào?

<details>
<summary>Đáp án</summary>

Theo đặc tả ABI của Linux x86-64 (`man 2 syscall`):
- **Số hiệu System Call**: nạp vào thanh ghi **`RAX`** (ví dụ: `0` là `SYS_read`, `1` là `SYS_write`, `60` là `SYS_exit`).
- **Tối đa 6 tham số truyền vào** theo đúng thứ tự:
  1. Tham số 1: **`RDI`**
  2. Tham số 2: **`RSI`**
  3. Tham số 3: **`RDX`**
  4. Tham số 4: **`R10`**
  5. Tham số 5: **`R8`**
  6. Tham số 6: **`R9`**
- **Giá trị trả về** (kết quả hoặc mã lỗi âm như `-EFAULT`, `-EACCES`, `-EINVAL`): Kernel lưu vào thanh ghi **`RAX`**.
</details>

### Câu Hỏi 8: Vì sao trên Linux x86-64, tham số thứ 4 của System Call phải truyền qua `R10` thay vì `RCX` như trong quy ước gọi hàm C thông thường (System V AMD64 ABI)?

<details>
<summary>Đáp án</summary>

- Khi chỉ lệnh phần cứng `syscall` được thực thi, CPU tự động sử dụng thanh ghi **`RCX`** để lưu địa chỉ con trỏ lệnh kế tiếp (`RIP`) của chương trình người dùng và sử dụng thanh ghi **`R11`** để lưu thanh ghi cờ (`RFLAGS`), nhằm phục vụ cho việc quay về bằng lệnh `sysretq`.
- Vì `RCX` và `R11` bị phần cứng ghi đè (**clobbered**), Linux Syscall ABI bắt buộc phải dùng **`R10`** thay cho `RCX` để truyền tham số thứ 4 cho Kernel.
</details>

### Câu Hỏi 9: Khi viết Inline Assembly gọi trực tiếp `syscall` trên x86-64, điều gì xảy ra nếu quên khai báo `"rcx"` và `"r11"` trong danh sách clobber, và công cụ `strace` giúp quan sát system call như thế nào?

<details>
<summary>Đáp án</summary>

- **Quên khai báo clobber `"rcx"`, `"r11"`**: Trình biên dịch (GCC/Clang) sẽ mặc định rằng giá trị trong `RCX` và `R11` không đổi sau khối assembly. Khi phần cứng CPU tự ý ghi đè `RIP` vào `RCX` và `RFLAGS` vào `R11`, các biến cục bộ hoặc con trỏ được trình biên dịch lưu trên hai thanh ghi này sẽ bị hỏng âm thầm (**silent data corruption**), gây crash ngẫu nhiên rất khó gỡ lỗi.
- **Công cụ `strace`**: Là tiện ích chẩn đoán trên Linux cho phép chặn bắt và hiển thị mọi system call mà tiến trình thực hiện cùng các tham số và giá trị trả về (ví dụ chạy `strace -e trace=write ./demo_syscall` sẽ in ra từng lời gọi `write(...) = <số bytes>`).
</details>

### Câu Hỏi 10: Dù Kernel chạy ở Ring 0 có quyền truy cập hầu hết bộ nhớ vật lý, tại sao Kernel tuyệt đối không được giải tham chiếu trực tiếp con trỏ do User Space truyền vào?

<details>
<summary>Đáp án</summary>

- Nếu User Space truyền một con trỏ không hợp lệ (ví dụ trỏ vào vùng nhớ của Kernel hoặc vùng nhớ chưa được cấp phát/map) mà Kernel giải tham chiếu trực tiếp, hệ thống có thể bị hoảng loạn (**Kernel Panic**) hoặc rò rỉ dữ liệu.
- Do đó, Linux Kernel bắt buộc phải sử dụng các hàm giao tiếp an toàn như **`copy_from_user()`** và **`copy_to_user()`**. Các hàm này kiểm tra ranh giới xem con trỏ có thực sự thuộc User Space và có quyền truy cập hợp lệ không; nếu không hợp lệ, chúng chặn lại và trả về mã lỗi **`-EFAULT`**.
</details>

### Câu Hỏi 11: Nguyên nhân nào tạo ra chi phí của System Call (Syscall Overhead) và có những thực tiễn nào giúp giảm chi phí này trong các hệ thống I/O hiệu năng cao?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân gây chi phí** (tốn vài chục đến hàng trăm nanoseconds mỗi lần gọi): CPU phải chuyển đổi mức đặc quyền (Ring 3 sang Ring 0), hoán đổi con trỏ ngăn xếp, lưu/phục hồi hàng loạt thanh ghi, và có thể làm mất hiệu lực một phần bộ nhớ đệm CPU (**CPU cache / branch predictor**).
- **Ba thực tiễn giảm chi phí**:
  1. **Sử dụng Buffered I/O** (như `fgets` / `fwrite` trong thư viện chuẩn) thay vì gọi `read()` / `write()` từng byte đơn lẻ.
  2. **Sử dụng `vDSO` (Virtual Dynamic Shared Object)** cho các syscall chỉ đọc thông tin như `gettimeofday()` hoặc `clock_gettime()`, cho phép đọc trực tiếp ở User Space mà không cần kích hoạt trap vào Kernel.
  3. **Sử dụng `io_uring`** trên Linux để giao tiếp I/O qua hàng đợi vòng chia sẻ (**Shared Ring Buffers**), giúp gửi hàng nghìn yêu cầu I/O mà không tốn thêm lời gọi syscall nào.
</details>

### Câu Hỏi 12: Một tiến trình đang chạy ở Ring 3 làm sao để tác động/thay đổi đến phần cứng, và CPU cùng hệ điều hành phải kiểm tra những bước cụ thể nào trước khi cho phép thực thi ở Ring 0?

<details>
<summary>Đáp án</summary>

- **Nguyên tắc cốt lõi**: Một tiến trình đang chạy ở **Ring 3 (User Mode)** **không bao giờ có thể tự biến chính mình thành Ring 0** để chạy mã nguồn tùy ý của nó với đặc quyền phần cứng. Thay vào đó, nó bắt buộc phải yêu cầu hệ điều hành làm hộ thông qua **System Call** (sử dụng chỉ lệnh `syscall` / cơ chế **Software Trap**), để CPU tạm thời chuyển sang **Ring 0 (Kernel Mode)** và thực thi **mã nguồn tin cậy của Kernel** thay mặt cho tiến trình.

- **Các bước kiểm tra cụ thể theo trình tự của CPU và Kernel**:
  1. **Bước 1 — Chuyển cổng phần cứng cố định (Hardware Trap Gate)**: Khi tiến trình gọi `syscall`, phần cứng CPU không cho phép nhảy tới địa chỉ tùy ý mà ép nhảy đúng vào điểm đầu vào cố định của Kernel (`entry_SYSCALL_64`, địa chỉ được nạp sẵn từ lúc boot trong thanh ghi MSR **`IA32_LSTAR`** trên x86-64). Đồng thời CPU lưu `RIP` vào `RCX`, lưu `RFLAGS` vào `R11`, nâng mức đặc quyền **`CPL`** từ `3` lên `0` và chuyển sang sử dụng **per-process Kernel Stack** riêng.
  2. **Bước 2 — Kiểm tra số hiệu Syscall (`sys_call_table` bounds check)**: Kernel kiểm tra số hiệu syscall truyền trong thanh ghi **`RAX`** xem có hợp lệ và nằm trong phạm vi bảng **`sys_call_table`** hay không; nếu vượt quá giới hạn hoặc không tồn tại, Kernel từ chối và trả về mã lỗi **`-ENOSYS`**.
  3. **Bước 3 — Kiểm tra bộ lọc Syscall (nếu được bật, ví dụ `seccomp`)**: Nếu tiến trình đang chạy trong sandbox hoặc container có áp dụng chính sách lọc (như **seccomp-BPF**), Kernel kiểm tra xem tiến trình có bị cấm gọi syscall này hay không trước khi đi tiếp.
  4. **Bước 4 — Kiểm tra tính hợp lệ của tham số & con trỏ (`copy_from_user` / `copy_to_user`)**: Kernel không bao giờ giải tham chiếu trực tiếp con trỏ từ User Space mà dùng `copy_from_user()` / `copy_to_user()` để xác minh mọi con trỏ và vùng đệm truyền vào đều nằm hợp lệ trong không gian **User Space**, không trỏ vào vùng nhớ của Kernel hoặc vùng nhớ chưa được map (nếu sai sẽ trả về **`-EFAULT`**).
  5. **Bước 5 — Kiểm tra phân quyền (Credentials / Capabilities / MAC)**: Kernel đối chiếu danh tính và quyền hạn của tiến trình, bao gồm **UID** (ví dụ `root` với UID `0` so với user thường), **Linux Capabilities** (như `CAP_SYS_ADMIN`, `CAP_NET_ADMIN`...), quyền trên file/thiết bị đích, cũng như các chính sách **MAC (Mandatory Access Control)** như **SELinux / AppArmor**; nếu không đủ quyền, Kernel chặn lại và trả về **`-EPERM`** hoặc **`-EACCES`**.
  6. **Bước 6 — Thực thi phần cứng & Quay về Ring 3**: Chỉ sau khi vượt qua đầy đủ các bước kiểm tra trên, Kernel mới gọi driver hoặc thực thi các chỉ lệnh đặc quyền để tác động lên phần cứng, ghi kết quả vào `RAX`, khôi phục ngữ cảnh từ Kernel Stack rồi thực thi lệnh **`sysretq`** để hạ mức đặc quyền CPU trở lại **Ring 3 (`CPL = 3`)**.

- **Luồng hợp lệ từ đầu đến cuối (Happy Path — ví dụ tiến trình ghi dữ liệu ra ổ đĩa / tương tác phần cứng)**:
  1. Tiến trình ở Ring 3 gọi hàm thư viện (như `write()` trong `libc`), nạp mã syscall vào `RAX` và tham số vào `RDI`, `RSI`, `RDX`.
  2. Thực thi chỉ lệnh `syscall` -> CPU lưu `RIP`/`RFLAGS`, hạ `CPL = 0` (Ring 0), đổi sang Kernel Stack và nhảy vào `IA32_LSTAR`.
  3. Kernel lần lượt xác nhận: mã syscall hợp lệ, không bị `seccomp` chặn, vùng đệm user hợp lệ qua `copy_from_user()`, và tiến trình có đủ quyền (UID/Capabilities/file descriptor hợp lệ).
  4. Kernel điều khiển driver thiết bị (ổ đĩa/mạng) ghi dữ liệu xuống phần cứng.
  5. Kernel đặt giá trị trả về (số byte đã ghi) vào `RAX` và gọi `sysretq` -> CPU nâng `CPL = 3` (Ring 3), khôi phục ngữ cảnh User Stack/thanh ghi và tiến trình tiếp tục chạy dòng lệnh kế tiếp bình thường.
</details>
