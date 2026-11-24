# Review: 1_2_3 Process Control Block

### Câu Hỏi 1: Process Control Block (PCB) là gì và đóng vai trò gì trong hệ điều hành đa nhiệm?

<details>
<summary>Đáp án</summary>

**Process Control Block (PCB)** — còn gọi là **Bộ mô tả tiến trình (Process Descriptor)** — là cấu trúc dữ liệu trung tâm nằm trong nhân (kernel) của hệ điều hành đa nhiệm, đại diện cho sự tồn tại của từng tiến trình và là phần tử tạo nên danh sách tiến trình (Process List / Task List).

Vai trò của PCB là lưu trữ toàn bộ siêu dữ liệu (metadata) cần thiết để hệ điều hành có thể quản lý, theo dõi và luân chuyển (switch) nhiều tiến trình trên số lượng nhân CPU hạn chế, kiểm soát vòng đời tiến trình từ lúc được tạo ra (`fork`) cho đến khi kết thúc hoàn toàn (`exit` / `wait`).

</details>

### Câu Hỏi 2: Trong các nhân hệ điều hành xv6, Linux và Windows NT, PCB được hiện thực hóa bằng cấu trúc dữ liệu nào?

<details>
<summary>Đáp án</summary>

- **xv6** (hệ điều hành giảng dạy): cấu trúc `struct proc` viết bằng ngôn ngữ C.
- **Linux Kernel**: cấu trúc `struct task_struct` (được khai báo trong tệp tiêu đề `include/linux/sched.h`).
- **Windows NT**: cấu trúc `EPROCESS` (Executive Process Block) nằm trong không gian nhân.

</details>

### Câu Hỏi 3: Nhóm thông tin định danh tiến trình (Process Identification) trong PCB bao gồm những thành phần chính nào?

<details>
<summary>Đáp án</summary>

Nhóm thông tin định danh tiến trình trong PCB gồm:
- **`PID` (Process Identifier)**: Số nguyên dương duy nhất định danh tiến trình trong toàn hệ thống.
- **`PPID` (Parent Process Identifier)**: Mã `PID` của tiến trình cha đã gọi hàm `fork()` để tạo ra tiến trình này.
- **Thông tin phả hệ & nhóm**: Con trỏ tới tiến trình cha (`struct proc *parent`), danh sách tiến trình con, và mã nhóm tiến trình (**PGID** - Process Group ID).
- **Định danh bảo mật (Credentials)**: User ID (`UID`), Group ID (`GID`) và các cờ phân quyền thực thi (Capabilities).

</details>

### Câu Hỏi 4: PCB theo dõi những trạng thái thực thi cơ bản nào của tiến trình, và vì sao tiến trình ở trạng thái `ZOMBIE` vẫn còn PCB trong Process Table?

<details>
<summary>Đáp án</summary>

Các trạng thái cơ bản của tiến trình gồm:
- **`RUNNING`**: Đang chiếm giữ CPU và thực thi chỉ lệnh mã máy.
- **`READY` / `RUNNABLE`**: Đã sẵn sàng chạy nhưng đang nằm trong hàng đợi chờ CPU Scheduler phân bổ thời gian.
- **`SLEEPING` / `BLOCKED`**: Đang tạm dừng chờ đợi sự kiện phần cứng, dữ liệu I/O từ đĩa/mạng hoặc tín hiệu đồng bộ hóa (kèm theo kênh chờ đợi `chan` / Wait Channel chỉ tới đối tượng hoặc sự kiện đang chờ).
- **`ZOMBIE`**: Tiến trình đã hoàn tất thực thi (`exit`).

**Lý do PCB của tiến trình `ZOMBIE` vẫn được giữ lại**: Hệ điều hành giữ lại PCB trong Process Table để tiến trình cha có thể đọc mã thoát (Exit Status) của tiến trình con thông qua lệnh `wait()`.

</details>

### Câu Hỏi 5: Khi xảy ra Context Switch, những thông tin ngữ cảnh phần cứng CPU nào được lưu lại và chúng được lưu ở đâu?

<details>
<summary>Đáp án</summary>

Khi bộ lập lịch chuyển CPU từ tiến trình này sang tiến trình khác (Context Switch), hệ điều hành lưu bản sao các thanh ghi phần cứng thiết yếu vào cấu trúc `struct context` (hoặc `thread_struct` trong Linux):
- **Program Counter (`PC` / `RIP`)**: Vị trí lệnh mã máy kế tiếp sẽ thực thi khi tiến trình chạy lại.
- **Stack Pointer (`SP` / `RSP`)**: Con trỏ tới đỉnh ngăn xếp người dùng hoặc ngăn xếp nhân.
- **Frame Pointer (`FP` / `RBP`)**: Con trỏ tới khung hàm hiện tại.
- **Các thanh ghi mục đích chung và thanh ghi cờ trạng thái (`RFLAGS`)**.

Ngữ cảnh này được lưu trên **ngăn xếp nhân riêng biệt của tiến trình (`kstack` - per-process kernel stack)** hoặc trực tiếp trong PCB.

</details>

### Câu Hỏi 6: Nhóm thông tin quản lý bộ nhớ trong PCB lưu trữ gì và thanh ghi `CR3` trên kiến trúc x86-64 có vai trò gì khi chuyển tiến trình?

<details>
<summary>Đáp án</summary>

Thông tin quản lý bộ nhớ trong PCB mô tả không gian địa chỉ bộ nhớ ảo của tiến trình, gồm:
- **Con trỏ bảng trang (Page Table Pointer)**: Trong Linux Kernel được quản lý qua `struct mm_struct *mm` (hoặc `active_mm` cho các luồng nhân mượn không gian địa chỉ), chứa con trỏ thư mục bảng trang (`pgd_t *pgd`).
- **Kích thước và các vùng nhớ ảo**: Kích thước không gian bộ nhớ ảo (`sz`), con trỏ vùng nhớ (`mem`), và danh sách các phân đoạn bộ nhớ ảo (VMAs: Text, Data, BSS, Heap, Stack).

**Vai trò của thanh ghi `CR3`**: Mỗi tiến trình có một không gian địa chỉ ảo độc lập. Khi tiến trình được chọn thực thi, địa chỉ vật lý của bảng phân trang cấp cao nhất được nạp vào thanh ghi điều khiển phần cứng `CR3` trên CPU x86-64 để kích hoạt cơ chế dịch địa chỉ của MMU sang đúng bảng phân trang của tiến trình đó.

</details>

### Câu Hỏi 7: Bảng mô tả tệp tin đang mở (Open File Descriptors Table) trong PCB hoạt động như thế nào và các File Descriptor `0`, `1`, `2` đại diện cho gì?

<details>
<summary>Đáp án</summary>

Bảng mô tả tệp tin đang mở (trong xv6 là `struct file *ofile[NOFILE]`, trong Linux là `struct files_struct *files`) là một mảng các con trỏ ánh xạ trực tiếp các số nguyên **File Descriptor (FD)** sang các cấu trúc tệp nội tại của Kernel. Các cấu trúc này lưu vị trí con trỏ đọc/ghi tệp (file offset), chế độ truy cập (read/write) và con trỏ Inode (bao gồm thư mục làm việc hiện tại `struct inode *cwd`).

Ba giá trị FD chuẩn mặc định là:
- **`0`**: `STDIN` (luồng nhập chuẩn).
- **`1`**: `STDOUT` (luồng xuất chuẩn).
- **`2`**: `STDERR` (luồng xuất lỗi chuẩn).

</details>

### Câu Hỏi 8: Trên Linux, `/proc/[pid]/status` và `/proc/[pid]/fd/` cho biết những thông tin gì về PCB? `VmSize` khác gì với `VmRSS`?

<details>
<summary>Đáp án</summary>

Nhân Linux phơi bày dữ liệu của `task_struct` ra không gian người dùng thông qua hệ thống tệp ảo `/proc`:
- **`/proc/[pid]/status`**: Cung cấp thông tin PCB ở định dạng dễ đọc như `State` (trạng thái tiến trình), `Pid`, `PPid` (ví dụ PID 1 có `PPid: 0` là Swapper/Idle task), `FDSize` (số lượng khe cắm FD đang được cấp phát trong `files_struct`), `VmSize`, `VmRSS` và `Threads` (số lượng luồng).
- **`/proc/[pid]/fd/`**: Chứa danh sách các liên kết tượng trưng (symbolic links) được đặt tên theo số nguyên FD, trỏ tới các tệp tin, đường ống (pipe) hoặc socket mạng (ví dụ `socket:[...]`) mà tiến trình đang mở.

**Phân biệt `VmSize` và `VmRSS`**:
- **`VmSize`**: Tổng kích thước không gian bộ nhớ ảo (Virtual Memory Size) mà tiến trình đang chiếm dụng.
- **`VmRSS`**: Kích thước tập làm việc thực tế đang nằm trong RAM vật lý (Resident Set Size).

</details>

### Câu Hỏi 9: Dưới góc độ PCB, lỗi `EMFILE` ("Too many open files") xảy ra khi nào và cách kiểm tra, khắc phục trên Linux ra sao?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Mỗi lần mở tệp (`open()`), mở kết nối cơ sở dữ liệu hoặc nhận kết nối mạng (`accept()`), Kernel cấp phát một khe cắm trong bảng File Descriptor của PCB (`files_struct`). Nếu ứng dụng bị rò rỉ FD (quên đóng tệp/kết nối trong khối xử lý ngoại lệ) khiến số lượng FD vượt quá hạn mức tối đa của tiến trình (`ulimit -n` / `FDSize`), Kernel sẽ từ chối các lời gọi mới và trả về mã lỗi **`EMFILE` (Too many open files)**.
- **Cách kiểm tra nhanh**:
  - Đếm số lượng FD tiến trình đang mở: `ls -1 /proc/<PID>/fd | wc -l`.
  - Xem hạn mức tối đa của tiến trình: `grep "Max open files" /proc/<PID>/limits`.
- **Cách khắc phục**: Đóng tài nguyên đúng cách trong mã nguồn và điều chỉnh hạn mức FD trong `/etc/security/limits.conf` hoặc dùng chỉ thị `LimitNOFILE=65535` cho service trong systemd.

</details>

### Câu Hỏi 10: Vì sao Fork Bomb và việc chạy quá nhiều tiến trình/luồng có thể làm cạn kiệt RAM vật lý của nhân hệ điều hành? Biện pháp phòng chống Fork Bomb là gì?

<details>
<summary>Đáp án</summary>

- **Bản chất cạn kiệt tài nguyên**:
  - Các cấu trúc quản lý trong nhân như PCB (`task_struct`), bảng mô tả tệp (`files_struct`), bảng phân trang (`mm_struct`) và ngăn xếp nhân (`kstack`, thường tốn từ 8 KB đến 16 KB cho mỗi tiến trình) bắt buộc phải nằm thường trực trong RAM vật lý và **không thể chuyển ra vùng swap (unswappable / non-paged kernel memory)**.
  - Khi xảy ra **Fork Bomb** (tạo tiến trình con liên tục vô hạn), Process Table nhanh chóng bị lấp đầy, số PID chạm trần `/proc/sys/kernel/pid_max` và bộ nhớ nhân cạn kiệt hoàn toàn, khiến quản trị viên không thể đăng nhập (kể cả qua SSH) vì `login` hoặc `bash` không thể `fork` thêm tiến trình mới.
  - Ngay cả khi không có Fork Bomb, chạy hàng chục nghìn tiến trình/luồng cũng làm PCB và các cấu trúc đi kèm chiếm hàng trăm MB đến hàng GB RAM không thể swap, thu hẹp không gian RAM cho bộ nhớ đệm ứng dụng (Application Buffer Cache).
- **Biện pháp phòng chống Fork Bomb**: Giới hạn số lượng tiến trình tối đa cho từng user bằng `ulimit -u` hoặc cấu hình thông số `pids.max` trong **cgroups v2** đối với container (Docker/Kubernetes).

</details>
