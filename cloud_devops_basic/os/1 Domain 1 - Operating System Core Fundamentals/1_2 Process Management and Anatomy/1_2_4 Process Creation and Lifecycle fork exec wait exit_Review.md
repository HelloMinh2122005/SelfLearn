# Review: 1_2_4 Process Creation and Lifecycle fork exec wait exit

### Câu Hỏi 1: Bộ tứ lời gọi hệ thống (system calls) `fork()`, `exec()`, `wait()`, và `exit()` trong Unix/Linux đảm nhiệm những vai trò cơ bản nào?

<details>
<summary>Đáp án</summary>

Theo bài học, vai trò của từng lời gọi hệ thống trong bộ tứ như sau:
1. **`fork()`**: Nhân bản tiến trình hiện tại (tiến trình cha) để tạo ra một tiến trình con mới.
2. **`exec()`**: Nạp một chương trình mới và ghi đè toàn bộ không gian bộ nhớ của tiến trình hiện tại (nhưng vẫn giữ nguyên PID).
3. **`wait()`** (hoặc `waitpid()`): Tạm dừng tiến trình cha cho đến khi tiến trình con kết thúc để thu thập trạng thái thoát và giải phóng tài nguyên quản trị của con.
4. **`exit()`**: Chấm dứt tiến trình, giải phóng bộ nhớ ảo, đóng các tệp đang mở và giữ lại exit code tạm thời trong PCB chờ cha thu thập.
</details>

### Câu Hỏi 2: Khi `fork()` được gọi, tiến trình con thừa hưởng những gì từ tiến trình cha và giá trị trả về của `fork()` khác nhau thế nào?

<details>
<summary>Đáp án</summary>

- **Những gì tiến trình con thừa hưởng**: Tiến trình con là bản sao gần như y hệt của tiến trình cha, thừa hưởng bản sao các biến số, con trỏ lệnh, ngăn xếp (stack), đống nhớ (heap) và bảng mô tả tệp (file descriptor table).
- **Giá trị trả về** (`fork()` được gọi một lần nhưng trả về hai lần ở hai không gian tiến trình khác nhau):
  - Trong **tiến trình con**: Trả về **`0`**.
  - Trong **tiến trình cha**: Trả về **PID (Process ID) của tiến trình con** vừa tạo.
  - Nếu **lỗi** (không đủ tài nguyên tạo tiến trình): Trả về **`-1`** cho tiến trình cha.
</details>

### Câu Hỏi 3: Khi một lệnh thuộc họ `exec()` (như `execve`, `execvp`) chạy thành công, tiến trình có được cấp PID mới không và tại sao mã lệnh phía sau `exec()` không bao giờ chạy?

<details>
<summary>Đáp án</summary>

- **Về PID**: `exec()` **không tạo ra tiến trình mới** và **không cấp phát PID mới**. Chương trình mới được nạp vẫn tiếp tục chạy với đúng số PID nguyên thủy của tiến trình gọi `exec()`.
- **Về việc không bao giờ trả về**: Khi `exec()` thành công, hệ điều hành **ghi đè hoàn toàn** các phân vùng bộ nhớ hiện tại của tiến trình (`Code/Text`, `Data`, `BSS`, `Heap`, `Stack`) bằng mã lệnh và dữ liệu của chương trình mới. Vì mã lệnh cũ (kể cả phần sau lời gọi `exec()`) đã bị xóa sạch khỏi bộ nhớ, các dòng code phía sau `exec()` chỉ được thực thi nếu quá trình nạp tệp nhị phân thất bại (như tệp không tồn tại hoặc thiếu quyền thực thi).
</details>

### Câu Hỏi 4: Lời gọi `wait()` và `waitpid()` thực hiện hai nhiệm vụ tối quan trọng nào, và `waitpid()` linh hoạt hơn `wait()` ở điểm nào?

<details>
<summary>Đáp án</summary>

- **Hai nhiệm vụ tối quan trọng của `wait()`**:
  1. Thu thập mã trạng thái thoát (**Exit Status**) của tiến trình con để tiến trình cha biết con kết thúc thành công hay thất bại.
  2. Báo hiệu cho kernel giải phóng hoàn toàn cấu trúc quản trị PCB (`task_struct`) của tiến trình con khỏi bảng tiến trình hệ thống, ngăn chặn tiến trình con trở thành **Zombie**.
- **Sự linh hoạt của `waitpid(pid, &status, options)`**: Cho phép tiến trình cha chờ đích danh một tiến trình con cụ thể theo `pid`, hoặc kiểm tra trạng thái mà không bị tạm dừng (non-blocking) thông qua cờ `WNOHANG`.
</details>

### Câu Hỏi 5: Khi tiến trình gọi `exit()` (hoặc `return` từ hàm `main()`), hệ điều hành thực hiện những bước gì?

<details>
<summary>Đáp án</summary>

Khi tiến trình kết thúc bằng `exit()` hoặc `return` từ `main()`, hệ điều hành thực hiện:
1. Thu hồi toàn bộ bộ nhớ ảo, giải phóng các trang RAM vật lý của tiến trình.
2. Đóng tất cả các tệp tin đang mở của tiến trình.
3. Lưu lại tạm thời trạng thái thoát (Exit Code) trong cấu trúc PCB (`task_struct`) để chờ tiến trình cha gọi `wait()`/`waitpid()` đến thu thập.
</details>

### Câu Hỏi 6: Tại sao Unix tách rời việc tạo tiến trình và nạp chương trình thành hai bước `fork()` và `exec()` thay vì gộp làm một?

<details>
<summary>Đáp án</summary>

Việc tách rời tạo ra một **khoảng thời gian vàng (Golden Window)** ở tiến trình con: sau khi tiến trình con đã sinh ra độc lập nhưng trước khi gọi `exec()`. Nhờ khoảng thời gian này, chương trình cha (đặc biệt là **Unix Shell**) có thể tùy biến môi trường thực thi cho tiến trình con một cách linh hoạt mà không làm phức tạp hóa hạt nhân kernel—ví dụ như điều hướng đầu vào/ra (I/O Redirection), đấu nối đường ống (`pipe`/`dup2`), thiết lập biến môi trường, hoặc đổi thư mục làm việc (`chdir()`).
</details>

### Câu Hỏi 7: Unix Shell thực hiện I/O Redirection (ví dụ `ls > output.txt`) và Pipeline (`cmd1 | cmd2`) dựa trên `fork()` và `exec()` như thế nào?

<details>
<summary>Đáp án</summary>

- **I/O Redirection (`ls > output.txt`)**:
  1. Shell gọi `fork()` để tạo tiến trình con.
  2. Trong khoảng thời gian trước `exec()`, tiến trình con đóng luồng chuẩn `stdout` (`close(1)`), rồi mở tệp `output.txt`. Vì Unix luôn cấp file descriptor nhỏ nhất còn trống, tệp `output.txt` tự động nhận descriptor số `1`.
  3. Tiến trình con gọi `execvp("ls", ...)`. Lệnh `ls` ghi ra descriptor `1` như bình thường và dữ liệu đi thẳng vào `output.txt` mà mã nguồn `ls` không cần biết gì về việc điều hướng.
- **Unix Pipelines (`cmd1 | cmd2`)**: Shell tạo đường ống bằng `pipe()` trước khi `fork()`, sau đó ở mỗi tiến trình con dùng `dup2()` để nối đầu ra của `cmd1` vào đầu vào của `cmd2` trước khi gọi `exec()`.
</details>

### Câu Hỏi 8: Cơ chế Copy-on-Write (CoW) trong `fork()` của Linux giải quyết vấn đề gì và vận hành theo quy trình ra sao?

<details>
<summary>Đáp án</summary>

- **Vấn đề giải quyết**: Tránh tốn kém hiệu năng và bộ nhớ khi phải sao chép toàn bộ RAM từ cha sang con ngay lúc `fork()` (nhất là khi con thường gọi `exec()` ngay sau đó để ghi đè toàn bộ bộ nhớ).
- **Quy trình vận hành**:
  1. Khi `fork()` được gọi, kernel không sao chép các khung trang RAM vật lý, mà chỉ nhân bản **bảng phân trang (page tables)** và tạo cấu trúc `task_struct` mới cho con.
  2. Bảng phân trang của cha và con cùng trỏ tới các trang RAM vật lý cũ và được đánh dấu quyền **chỉ đọc (read-only)**.
  3. Khi chỉ đọc dữ liệu, cha và con dùng chung RAM mà không tốn thêm bộ nhớ.
  4. Khi cha hoặc con thực hiện thao tác **ghi (write)**, phần cứng MMU phát hiện vi phạm quyền read-only và kích hoạt ngoại lệ **Page Fault**.
  5. Kernel xử lý Page Fault bằng cách cấp phát khung trang vật lý mới, sao chép nội dung trang cũ sang, cập nhật bảng phân trang của tiến trình đang ghi thành quyền đọc/ghi (read-write) rồi cho phép ghi tiếp.
</details>

### Câu Hỏi 9: Hai macro POSIX `WIFEXITED(wstatus)` và `WEXITSTATUS(wstatus)` dùng để làm gì khi xử lý kết quả từ `wait()`/`waitpid()`?

<details>
<summary>Đáp án</summary>

- **`WIFEXITED(wstatus)`**: Trả về giá trị khác không (`true`) nếu tiến trình con kết thúc một cách bình thường (qua `exit(3)`, `_exit(2)`, hoặc `return` từ `main()`).
- **`WEXITSTATUS(wstatus)`**: Khi `WIFEXITED(wstatus)` là `true`, macro này trích xuất **8 bit thấp nhất** của mã thoát mà tiến trình con đã truyền vào (giá trị từ `0` đến `255`).
</details>

### Câu Hỏi 10: Tại sao trong nhánh tiến trình con sau `fork()`, nếu gọi `exec()` thất bại thì nên dùng `_exit(2)` thay vì `exit(3)`?

<details>
<summary>Đáp án</summary>

- Hàm thư viện `exit(3)` của C tự động xả các bộ đệm I/O trong user-space (`fflush()`) và chạy các hàm dọn dẹp đã đăng ký với `atexit()`.
- Vì tiến trình con sau `fork()` thừa hưởng bản sao bộ đệm `stdio` từ cha, nếu con gọi `exit(3)`, cả con và cha (khi kết thúc sau đó) có thể cùng xả bộ đệm này, dẫn đến hiện tượng **dữ liệu bị ghi trùng lặp hai lần (Double Flush)**.
- Dùng lời gọi hệ thống **`_exit(2)`** sẽ yêu cầu kernel thu hồi tiến trình con ngay lập tức mà không xả bộ đệm `stdio` dùng chung của tiến trình cha.
</details>

### Câu Hỏi 11: Hiện tượng rò rỉ tiến trình Zombie (Zombie Leak) xảy ra khi nào và gây hậu quả gì cho hệ thống Linux?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Tiến trình cha tạo con bằng `fork()` nhưng quên không gọi `wait()` hoặc `waitpid()` để thu dọn khi con kết thúc, khiến các tiến trình con rơi vào trạng thái **Zombie (`Z`)**.
- **Hậu quả**: Dù không tiêu tốn RAM hay CPU, mỗi Zombie vẫn giữ một mục trong bảng tiến trình của kernel và chiếm một số **PID**. Vì số lượng PID trên Linux là hữu hạn (quy định trong `/proc/sys/kernel/pid_max`, mặc định thường là 32,768 hoặc 4,194,304), khi bảng PID bị cạn kiệt, hệ thống sẽ từ chối tạo tiến trình mới với lỗi `fork: Resource temporarily unavailable`, làm tê liệt máy chủ và các dịch vụ khác như SSH.
</details>

### Câu Hỏi 12: "Fork Bomb" (`:(){ :|:& };:`) phá hoại hệ thống bằng cách nào và DevOps có những biện pháp nào để phòng chống? Khi nào nên dùng `posix_spawn(3)` hoặc `vfork(2)`?

<details>
<summary>Đáp án</summary>

- **Bản chất Fork Bomb**: Định nghĩa một hàm tự gọi chính nó và đẩy chạy ngầm liên tục theo cấp số nhân, nhanh chóng vắt kiệt bảng PID và bảng phân trang MMU của máy chủ.
- **Giải pháp phòng chống**:
  - Giới hạn số tiến trình tối đa cho mỗi user bằng tham số `nproc` trong `/etc/security/limits.conf` (ví dụ: `appuser hard nproc 2048`).
  - Trong Docker / Kubernetes: Đặt giới hạn PIDs thông qua cờ `--pids-limit` (Docker) hoặc chỉ thị `pids.max` trong Linux cgroups v2 để tránh một container làm sập cả máy chủ vật lý (Node).
- **Khi nào dùng `posix_spawn(3)` / `vfork(2)`**: Khi ứng dụng chỉ muốn khởi chạy một chương trình ngoài mà **không cần tùy biến phức tạp** (như đổi hướng I/O hay biến môi trường) giữa `fork` và `exec`, giúp tránh chi phí nhân bản bảng phân trang và tăng tốc độ khởi tạo.
</details>
