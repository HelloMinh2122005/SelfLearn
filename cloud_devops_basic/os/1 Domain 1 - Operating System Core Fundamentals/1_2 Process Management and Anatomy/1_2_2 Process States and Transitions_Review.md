# Review: 1_2_2 Process States and Transitions

### Câu Hỏi 1: Hệ điều hành sử dụng Mô hình Trạng thái Tiến trình (Process State Model) nhằm mục đích gì?

<details>
<summary>Đáp án</summary>

Trong hệ điều hành đa nhiệm (Multitasking Operating System), bộ vi xử lý (CPU) phải được chia sẻ luân phiên giữa hàng trăm hoặc hàng nghìn tiến trình khác nhau. Hệ điều hành theo dõi và quản lý vòng đời từng tiến trình thông qua **Mô hình Trạng thái Tiến trình (Process State Model)** để:
- Quản lý và điều phối tiến trình một cách hiệu quả.
- Không lãng phí chu kỳ xử lý của CPU (ví dụ: không để CPU ngồi chờ một tiến trình đang đợi thao tác I/O chậm chạp).

</details>

---

### Câu Hỏi 2: Ba trạng thái cốt lõi của tiến trình là gì? Sự khác biệt chính giữa trạng thái `Ready` và trạng thái `Blocked / Waiting` là gì?

<details>
<summary>Đáp án</summary>

Theo giáo trình *OSTEP* (Chương 4), một tiến trình luôn tồn tại ở một trong **ba trạng thái cơ bản**:
1. **Running (Đang thực thi)**: Tiến trình đang trực tiếp chiếm giữ một nhân CPU (CPU Core) và thực thi các chỉ lệnh mã máy.
2. **Ready (Sẵn sàng)**: Tiến trình đã có đủ tài nguyên cần thiết trong bộ nhớ (mã lệnh, dữ liệu, ngăn xếp) và hoàn toàn sẵn sàng chạy, đang nằm trong **Ready Queue / Run Queue** chờ bộ lập lịch (CPU Scheduler) cấp phát thời gian CPU.
3. **Blocked / Waiting (Bị chặn / Chờ)**: Tiến trình đang phải chờ một sự kiện bên ngoài hoặc thao tác ngoại vi hoàn tất (như đọc tệp từ ổ đĩa, nhận gói tin mạng, hoặc chờ trong lệnh `sleep()`).

**Sự khác biệt chính**: Tiến trình ở trạng thái **Ready** có thể chạy ngay lập tức ngay khi có CPU rảnh; ngược lại, tiến trình ở trạng thái **Blocked** **không thể tiếp tục thực thi ngay cả khi CPU đang hoàn toàn rảnh rỗi**, vì nó đang thiếu dữ liệu hoặc sự kiện đang chờ.

</details>

---

### Câu Hỏi 3: Hai trạng thái phụ trợ trong vòng đời tiến trình (`New / Embryo` và `Final / Terminated / Zombie`) có đặc điểm gì?

<details>
<summary>Đáp án</summary>

Hai trạng thái phụ trợ xác định thời điểm bắt đầu và kết thúc của tiến trình:
- **New / Embryo (Khởi tạo)**: Trạng thái ban đầu khi hệ điều hành đang kiến tạo tiến trình (cấp phát cấu trúc quản trị Process Control Block - **PCB**, phân bổ không gian địa chỉ). Ở trạng thái này, tiến trình chưa sẵn sàng để chạy.
- **Final / Terminated / Zombie (Kết thúc / Xác sống)**: Tiến trình đã hoàn thành thực thi mã lệnh hoặc bị hệ thống hủy bỏ. Phần lớn tài nguyên bộ nhớ đã được thu hồi, nhưng bản ghi **PCB** vẫn được giữ lại trong bảng tiến trình của kernel để chờ tiến trình cha đọc mã thoát (Exit Status) thông qua lời gọi hệ thống `wait()`.

</details>

---

### Câu Hỏi 4: Các bước chuyển dịch giữa `Ready` và `Running` (`Ready → Running` và `Running → Ready`) diễn ra khi nào?

<details>
<summary>Đáp án</summary>

- **Ready → Running (Scheduled / Dispatch)**: Diễn ra khi bộ lập lịch (CPU Scheduler) chọn một tiến trình từ Ready Queue và trao quyền kiểm soát CPU cho nó (nạp ngữ cảnh thanh ghi, thiết lập con trỏ lệnh PC).
- **Running → Ready (Descheduled / Preempted)**: Xảy ra trong hai trường hợp:
  1. Tiến trình dùng hết định mức thời gian CPU được cấp (**Time-slice Expiration**) trong cơ chế chia sẻ thời gian (Time-sharing).
  2. Một tiến trình khác có mức ưu tiên cao hơn xuất hiện và chiếm quyền kiểm soát CPU (**Preemption**).

</details>

---

### Câu Hỏi 5: Khi tiến trình đang `Running` thực hiện lời gọi I/O (như `read()`, `write()`, `connect()`), trạng thái của nó thay đổi như thế nào? Sau khi I/O hoàn tất, tiến trình có được chuyển thẳng về `Running` không?

<details>
<summary>Đáp án</summary>

- **Khi gọi I/O (`Running → Blocked`)**: Hệ điều hành lập tức chuyển tiến trình sang trạng thái **Blocked** và tháo dỡ nó khỏi CPU để nhường core cho một tiến trình **Ready** khác, đảm bảo CPU không bị ngồi chờ thiết bị I/O chậm chạp.
- **Khi I/O hoàn tất (`Blocked → Ready`)**: Thiết bị ngoại vi nạp dữ liệu xong sẽ kích hoạt ngắt phần cứng (**Hardware Interrupt**). Bộ xử lý ngắt trong kernel đưa tiến trình trở lại **Ready Queue**.
- **Không chuyển thẳng sang `Running`**: Tại thời điểm I/O xong, CPU có thể đang thực thi tiến trình khác, nên tiến trình bắt buộc phải quay về **Ready** để xếp hàng chờ CPU Scheduler cấp phát lượt chạy tiếp theo.

</details>

---

### Câu Hỏi 6: Làm thế nào để một tiến trình chuyển sang trạng thái `Stopped` hoặc `Zombie`, và làm sao để thoát khỏi hai trạng thái này?

<details>
<summary>Đáp án</summary>

- **Trạng thái `Stopped`**:
  - Chuyển vào (`Running → Stopped`): Khi tiến trình nhận tín hiệu tạm dừng như `SIGSTOP` hoặc `SIGTSTP` (ví dụ người dùng nhấn `Ctrl + Z`).
  - Thoát ra (`Stopped → Ready`): Khi tiến trình nhận tín hiệu tiếp tục **`SIGCONT`**.
- **Trạng thái `Zombie` (`Terminated`)**:
  - Chuyển vào (`Running → Zombie`): Khi tiến trình kết thúc thực thi bằng `exit()` hoặc bị hủy bởi tín hiệu tiêu diệt (như `SIGKILL`, `SIGSEGV`).
  - Thoát ra (`Zombie → [*]`): Khi tiến trình cha gọi **`wait()`** để thu thập mã thoát và kernel thu dọn hoàn toàn bản ghi PCB (`task_struct`).

</details>

---

### Câu Hỏi 7: Trên Linux, các mã trạng thái cơ bản `R`, `S`, `D`, `Z`, `T`, `t`, `I` trong cột `S`/`STAT` của lệnh `ps` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- **`R` (Running / Runnable)**: Tiến trình đang chạy trực tiếp trên CPU hoặc đang nằm trong hàng đợi chờ chạy (Run Queue). *(Lưu ý: Linux gộp cả hai trạng thái lý thuyết `Ready` và `Running` vào chung một mã `R`)*.
- **`S` (Interruptible Sleep)**: Tiến trình đang ngủ chờ sự kiện hoặc I/O hoàn tất; có thể bị đánh thức/ngắt bởi một tín hiệu UNIX (Signal).
- **`D` (Uninterruptible Sleep)**: Tiến trình đang ngủ sâu không thể ngắt (thường chờ I/O phần cứng hoặc truy cập hệ thống tệp trực tiếp); bỏ qua mọi tín hiệu, không thể bị tiêu diệt ngay cả bằng `kill -9`.
- **`Z` (Zombie / Defunct)**: Tiến trình đã kết thúc nhưng tiến trình cha chưa gọi `wait()` để thu hồi mã thoát.
- **`T` (Stopped by job control signal)**: Tạm dừng bởi tín hiệu kiểm soát công việc (`SIGTSTP` qua `Ctrl + Z`, hoặc `SIGSTOP`).
- **`t` (Stopped by debugger)**: Tạm dừng trong quá trình gỡ lỗi theo dõi luồng (`gdb` / `ptrace` tracing).
- **`I` (Idle kernel thread)**: Luồng nhân ở trạng thái nhàn rỗi, không tiêu tốn tài nguyên tải CPU.

</details>

---

### Câu Hỏi 8: Các ký tự cờ bổ trợ chuẩn BSD (`<`, `N`, `s`, `l`, `+`) trong cột `STAT` của lệnh `ps` biểu thị điều gì?

<details>
<summary>Đáp án</summary>

Các ký tự bổ sung phía sau chữ cái trạng thái chính trong cột `STAT` (khi chạy `ps aux` hoặc `ps -o stat`) gồm:
- **`<`**: Mức ưu tiên cao (**High Priority**, giá trị nice âm, được ưu tiên cấp CPU nhiều hơn).
- **`N`**: Mức ưu tiên thấp (**Low Priority / Nice**, giá trị nice dương, nhường CPU cho tiến trình khác).
- **`s`**: Tiến trình là người dẫn đầu phiên làm việc (**Session Leader**, ví dụ: `systemd` hoặc `bash` đăng nhập).
- **`l`**: Tiến trình đa luồng (**Multi-threaded**, sở hữu nhiều luồng bên trong, tạo bởi `clone()` với `CLONE_THREAD`).
- **`+`**: Nằm trong nhóm tiến trình tiền cảnh (**Foreground Process Group**) của terminal điều khiển.

Ví dụ: `STAT = Ssl` nghĩa là tiến trình đang ngủ có thể ngắt (`S`), là Session Leader (`s`) và chạy đa luồng (`l`).

</details>

---

### Câu Hỏi 9: Tệp `/proc/[pid]/status` (và `/proc/self/status`) trên Linux cung cấp thông tin gì, và có lợi thế nào so với việc đọc ký tự đơn lẻ của `ps`?

<details>
<summary>Đáp án</summary>

Mỗi tiến trình trên Linux có một thư mục đại diện trong hệ thống tệp ảo `procfs` tại `/proc/[pid]`, trong đó `/proc/[pid]/status` lưu thông tin quản trị dưới dạng văn bản có cấu trúc (như `Name:`, `State:`, `Pid:`, `PPid:`, `Threads:`). Liên kết `/proc/self/status` trỏ trực tiếp đến tiến trình đang đọc tệp đó.

**Lợi thế**: Trường `State:` hiển thị đầy đủ tên trạng thái tường minh (human-readable label) như `R (running)`, `S (sleeping)`, `D (disk sleep)`, `Z (zombie)`, giúp các kịch bản tự động hóa (scripting) phân tích dễ dàng mà không cần tự giải mã từng ký tự đơn lẻ.

</details>

---

### Câu Hỏi 10: Tại sao trạng thái `D` (Uninterruptible Sleep) thường gây sự cố nghiêm trọng trên môi trường Production, và cách xử lý là gì?

<details>
<summary>Đáp án</summary>

- **Bản chất kỹ thuật**: Trạng thái `D` bảo vệ dữ liệu khi tiến trình đang trao đổi trực tiếp với phần cứng (ví dụ ghi sector lên ổ đĩa); nếu bị gián đoạn giữa chừng bởi tín hiệu, cấu trúc dữ liệu kernel hoặc tệp tin có thể bị hỏng. Do đó Linux cấm gửi mọi tín hiệu đến tiến trình ở trạng thái `D`.
- **Cạm bẫy Production**: Khi phân vùng **NFS Mount** mất kết nối mạng đột ngột hoặc ổ đĩa **SAN/SSD** gặp lỗi phần cứng (bad block), mọi tiến trình đọc/ghi vào đó sẽ kẹt cứng vĩnh viễn ở trạng thái `D`.
- **Hậu quả**: Lệnh `kill -9 <PID>` hoàn toàn **vô tác dụng** vì kernel bỏ qua cả tín hiệu `SIGKILL`.
- **Cách xử lý**: Chỉ có thể giải thoát tiến trình kẹt `D` bằng cách khắc phục sự cố phần cứng / phục hồi mạng cho NFS, hoặc buộc phải khởi động lại máy chủ (**reboot**).

</details>

---

### Câu Hỏi 11: Chỉ số Load Average trên Linux được tính dựa trên các trạng thái tiến trình nào, và kỹ sư thường mắc nhầm lẫn gì khi chỉ số này tăng cao?

<details>
<summary>Đáp án</summary>

Trên Linux, chỉ số **Load Average** tính tổng số tiến trình ở cả hai trạng thái: **`R` (Running/Runnable)** lẫn **`D` (Uninterruptible Sleep)**.

**Nhầm lẫn thường gặp**: Nhiều kỹ sư lầm tưởng Load Average tăng vọt chắc chắn là do quá tải CPU; nhưng thực tế, nguyên nhân có thể do hàng loạt tiến trình đang bị kẹt ở trạng thái `D` (chờ I/O phần cứng hoặc NFS lỗi) trong khi CPU vẫn nhàn rỗi.

</details>

---

### Câu Hỏi 12: Hiện tượng "CPU Starvation" xảy ra khi nào, gây ra hệ quả gì, và kỹ sư DevOps giám sát bằng cách nào?

<details>
<summary>Đáp án</summary>

- **Khi nào xảy ra**: Khi số lượng tiến trình ở trạng thái `R` (trong Run Queue) vượt quá xa số lượng nhân CPU vật lý (ví dụ: máy chủ 4 CPU Core nhưng có 80 tiến trình `R`).
- **Hệ quả**: Các tiến trình bị đói chu kỳ xử lý (**CPU Starvation**). Bộ lập lịch phải chuyển đổi ngữ cảnh liên tục với tần suất cực cao (**High Context Switches**); thời gian CPU lưu và nạp lại thanh ghi có thể vượt quá thời gian chạy mã ứng dụng hữu ích, làm toàn bộ hệ thống bị nghẽn (**Thrashing / Slowdown**).
- **Cách giám sát & khắc phục**: Dùng lệnh `vmstat 1` và theo dõi cột đầu tiên **`r`**. Nếu `r` thường xuyên lớn hơn số CPU core, cần **scale up** thêm CPU hoặc tối ưu hóa mã nguồn theo hướng xử lý bất đồng bộ (**Non-blocking I/O**).

</details>
