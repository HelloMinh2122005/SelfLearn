# Review: 1_2_5 Zombie vs Orphan Processes

### Câu Hỏi 1: Khi một tiến trình con hoàn thành công việc và gọi `exit()` hoặc `_exit(status)`, Kernel giải phóng ngay lập tức những tài nguyên nào và giữ lại những thông tin gì?

<details>
<summary>Đáp án</summary>

Ngay khi tiến trình con gọi `exit()` hoặc `_exit(status)`:
- **Tài nguyên được Kernel giải phóng lập tức**:
  - Toàn bộ không gian địa chỉ bộ nhớ ảo (Text, Data, BSS, Heap, Stack) được thu hồi và trả lại cho bộ nhớ RAM vật lý.
  - Toàn bộ các tệp tin và kết nối socket đang mở (`files_struct`) được đóng lại.
- **Thông tin được giữ lại trong mục PCB tối thiểu (Minimal PCB Entry)** trên bảng tiến trình (Process Table / Task List):
  - Mã định danh tiến trình (`PID`).
  - Trạng thái kết thúc (Termination Status / Exit Code).
  - Thông tin thống kê tiêu thụ tài nguyên CPU/Memory (`rusage`).

</details>

### Câu Hỏi 2: Tại sao Kernel phải giữ lại mục PCB tối thiểu sau khi tiến trình con đã kết thúc, và cơ chế thu hoạch (Reaping) hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- **Mục đích giữ lại PCB tối thiểu**: Để cho phép tiến trình cha có thể đọc được kết quả thực thi và lý do kết thúc của tiến trình con (ví dụ: con kết thúc thành công với mã `0`, hay bị chết vì tín hiệu `SIGSEGV`).
- **Cơ chế thu hoạch (Reaping)**: Tiến trình cha phải triệu gọi lời gọi hệ thống `wait()` hoặc `waitpid()`. Lời gọi này đọc mã trạng thái của con, sau đó Kernel mới chính thức xóa bỏ hoàn toàn mục PCB của tiến trình con khỏi Process Table và giải phóng mã `PID` về kho để tái sử dụng.

</details>

### Câu Hỏi 3: Tiến trình Zombie (Defunct Process) là gì và làm sao để nhận biết nó qua kết quả của lệnh `ps`?

<details>
<summary>Đáp án</summary>

- **Định nghĩa**: Tiến trình Zombie là tiến trình con đã hoàn tất thực thi (đã gọi `exit()`), nhưng tiến trình cha chưa thực hiện lời gọi hệ thống `wait()` để thu hoạch mã trạng thái.
- **Cách nhận biết qua lệnh `ps`**: Trong bảng tiến trình, cột trạng thái (`S`) hiển thị chữ cái `Z` (hoặc cột `STAT` hiển thị `Z+`), kèm theo hậu tố chú thích `<defunct>` ở cột `COMMAND`.

</details>

### Câu Hỏi 4: Tiến trình Zombie có tiêu tốn CPU hay RAM ứng dụng không? Vì sao hiện tượng Zombie Leak vẫn có thể làm sập hệ thống?

<details>
<summary>Đáp án</summary>

- **Mức độ tiêu thụ tài nguyên**: Tiến trình Zombie **hoàn toàn không tiêu tốn chu kỳ CPU** (vì không còn chỉ lệnh để thực thi) và **không chiếm dụng bộ nhớ RAM ứng dụng** (không gian địa chỉ đã bị Kernel giải phóng khi gọi `exit()`).
- **Nguy cơ từ Zombie Leak**: Chừng nào tiến trình cha chưa gọi `wait()`, mục PCB của mỗi Zombie vẫn chiếm giữ một khe cắm (slot) trong bảng Process Table của Kernel và giữ chặt một mã số `PID`. Nếu tiến trình cha liên tục sinh ra nhiều tiến trình con mà quên gọi `wait()`, số lượng Zombie tích tụ chạm ngưỡng giới hạn tối đa của hệ thống (`/proc/sys/kernel/pid_max`) sẽ làm cạn kiệt toàn bộ kho PID. Lúc này, hệ điều hành không thể tạo thêm tiến trình mới (`fork()` luôn trả về lỗi `-EAGAIN`), khiến hệ thống rơi vào trạng thái tê liệt.

</details>

### Câu Hỏi 5: Tiến trình Mồ Côi (Orphan Process) là gì? Cơ chế Nhận nuôi (Reparenting) hoạt động như thế nào theo mô hình truyền thống và mô hình hiện đại (từ Linux 3.4+)?

<details>
<summary>Đáp án</summary>

- **Định nghĩa**: Tiến trình Mồ Côi (Orphan Process) là tiến trình vẫn đang hoạt động bình thường (đang chạy tính toán trên CPU hoặc đang ngủ chờ I/O), nhưng tiến trình cha của nó đã kết thúc hoặc bị tiêu diệt trước (`parent terminated prematurely`).
- **Cơ chế Nhận nuôi (Reparenting)**: Vì một tiến trình không thể tồn tại mà không có cha trong cây phân cấp, Kernel sẽ tự động gán cha mới cho nó:
  - **Mô hình truyền thống**: Tiến trình mồ côi được chuyển quyền làm con (reparented) cho tiến trình gốc tối cao của hệ thống là `init` (trên SysVinit) hoặc `systemd` (PID 1).
  - **Mô hình hiện đại (từ Linux 3.4+)**: Kernel bổ sung tính năng **Subreaper** qua lời gọi `prctl(PR_SET_CHILD_SUBREAPER)`. Tiến trình tổ tiên còn sống gần nhất đã đăng ký cờ Subreaper (ví dụ: Session Manager, Container Shim, hoặc tiến trình quản lý phiên dịch vụ) sẽ đứng ra nhận nuôi tiến trình mồ côi thay vì đẩy thẳng lên PID 1.

</details>

### Câu Hỏi 6: Tại sao tiến trình Orphan không gây hại và không bao giờ trở thành Zombie vĩnh viễn?

<details>
<summary>Đáp án</summary>

- Tiến trình nhận nuôi mới (`systemd` PID 1 hoặc Subreaper) được thiết kế chuyên biệt để liên tục duy trì vòng lặp sự kiện gọi `wait()` / `waitpid()` nhằm lắng nghe tín hiệu `SIGCHLD`.
- Khi tiến trình mồ côi hoàn thành công việc và gọi `exit()` sau này, cha nuôi mới sẽ lập tức thu hoạch mã thoát ngay tức thì, nên tiến trình mồ côi không bao giờ bị đọng lại thành Zombie vĩnh viễn.

</details>

### Câu Hỏi 7: Trong hai bài thực hành `demo_zombie.c` và `demo_orphan.c`, trạng thái của tiến trình con thay đổi như thế nào sau khi tiến trình cha kết thúc?

<details>
<summary>Đáp án</summary>

- **Trong `demo_zombie.c`** (con gọi `_exit(42)` ngay, cha ngủ 10 giây và không gọi `wait()`): Trong 10 giây cha ngủ, tiến trình con ở trạng thái Zombie (`Z` / `Z+` và `<defunct>`). Khi hết 10 giây và tiến trình cha kết thúc, tiến trình con Zombie lập tức được `systemd` nhận nuôi và gọi `wait()` dọn sạch, biến mất hoàn toàn khỏi bảng `ps`.
- **Trong `demo_orphan.c`** (cha gọi `exit(0)` ngay, con ngủ 3 giây rồi gọi `getppid()`): Trước khi cha kết thúc, `getppid()` trả về PID của tiến trình cha ban đầu. Sau khi cha kết thúc và con thức dậy sau 3 giây, `getppid()` trả về `1` (tức `systemd` PID 1 hoặc Subreaper của phiên làm việc) vì Kernel đã thực hiện Reparenting.

</details>

### Câu Hỏi 8: Tại sao lệnh `kill -9 <PID_Zombie>` hoàn toàn không có tác dụng đối với một tiến trình Zombie?

<details>
<summary>Đáp án</summary>

- Lệnh `kill -9` gửi tín hiệu `SIGKILL` để yêu cầu Kernel kết thúc một tiến trình **đang sống**.
- Tiến trình Zombie vốn dĩ đã chết từ trước (đã gọi `exit()`), không còn không gian bộ nhớ và không còn luồng thực thi để tiếp nhận bất kỳ tín hiệu nào. Do đó, lệnh `kill -9` tác động trực tiếp lên PID của Zombie là hoàn toàn vô tác dụng.

</details>

### Câu Hỏi 9: Các bước xử lý chuẩn xác để dọn dẹp một tiến trình Zombie đang tồn đọng trên hệ thống là gì?

<details>
<summary>Đáp án</summary>

1. **Bước 1**: Gửi tín hiệu `SIGCHLD` đến tiến trình cha (`kill -s SIGCHLD <PID_Cha>`) để nhắc nhở tiến trình cha gọi `wait()` thu hoạch con.
2. **Bước 2**: Nếu tiến trình cha bị lỗi treo cứng (hung/stuck) và không phản hồi tín hiệu, giải pháp duy nhất là tiêu diệt chính tiến trình cha (`kill -9 <PID_Cha>`). Khi tiến trình cha chết, các Zombie con của nó sẽ bị mồ côi, được `systemd` (PID 1) hoặc Subreaper nhận nuôi và tự động gọi `wait()` dọn sạch.

</details>

### Câu Hỏi 10: Trong Docker hoặc Kubernetes Container, tại sao không nên chạy trực tiếp ứng dụng (như `node`, `python`) ở vị trí PID 1, và giải pháp Best Practice là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân sự cố**: Trong một PID Namespace của container, tiến trình chạy ở vị trí **PID 1** có trách nhiệm bắt buộc phải nhận nuôi các tiến trình mồ côi, thu hoạch (reap) các tiến trình Zombie và chuyển tiếp tín hiệu kết thúc (`SIGTERM`/`SIGINT`). Các ứng dụng thông thường như Node.js hay Python không được thiết kế vòng lặp gọi `wait()` cho các subprocess con mồ côi, khiến Zombie tích tụ dần. Khi số lượng Zombie chạm ngưỡng giới hạn PID của container (`--pids-limit` trong Docker hoặc `podPidsLimit` trong Kubernetes Kubelet), container từ chối tạo mọi tiến trình mới và làm sập dịch vụ với lỗi `fork: Resource temporarily unavailable`.
- **Giải pháp Best Practice**:
  - Sử dụng một Init System siêu nhỏ chuyên dụng làm lớp bọc PID 1 trong Dockerfile, chẳng hạn như `tini` hoặc `dumb-init` (ví dụ: `ENTRYPOINT ["/usr/bin/tini", "--"]` kết hợp `CMD ["node", "app.js"]`).
  - Hoặc thêm cờ `--init` khi khởi chạy Docker container: `docker run --init my-app:latest`.

</details>
