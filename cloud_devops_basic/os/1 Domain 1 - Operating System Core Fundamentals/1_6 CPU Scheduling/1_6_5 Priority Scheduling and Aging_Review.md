# Review: 1_6_5 Priority Scheduling and Aging

### Câu Hỏi 1: Nguyên lý hoạt động cơ bản của Priority Scheduling là gì và quy ước số học về độ ưu tiên trên hầu hết các hệ điều hành UNIX/Linux được hiểu như thế nào?

<details>
<summary>Đáp án</summary>

- **Nguyên lý hoạt động**: Mỗi tiến trình khi khởi tạo được gắn với một số nguyên biểu diễn mức độ ưu tiên (**Priority Integer**). Bộ điều phối CPU luôn chọn tiến trình có độ ưu tiên cao nhất trong hàng đợi sẵn sàng (**Ready Queue**) để cấp phát CPU.
- **Quy ước số học**: Trong lý thuyết hệ điều hành nói chung không có quy chuẩn thống nhất về việc số lớn hơn hay số nhỏ hơn là ưu tiên cao hơn. Tuy nhiên, trên hầu hết các hệ điều hành dòng UNIX/Linux, **số nguyên càng nhỏ thì độ ưu tiên càng cao** (ví dụ: mức `0` là ưu tiên tối cao, mức `139` là ưu tiên thấp nhất).
</details>

### Câu Hỏi 2: Sự khác biệt giữa Preemptive Priority Scheduling (chiếm quyền) và Non-preemptive Priority Scheduling (không chiếm quyền) là gì?

<details>
<summary>Đáp án</summary>

- **Preemptive Priority Scheduling (Chiếm quyền)**: Nếu có một tiến trình mới xuất hiện trong Ready Queue mang độ ưu tiên cao hơn tiến trình đang chạy trên CPU, hệ điều hành sẽ ngay lập tức ngắt ngang (**preempt**) tiến trình hiện tại và chuyển giao CPU cho tiến trình mới.
- **Non-preemptive Priority Scheduling (Không chiếm quyền)**: Tiến trình mới có độ ưu tiên cao chỉ được xếp lên đầu Ready Queue và phải chờ cho đến khi tiến trình hiện tại hoàn tất CPU burst của nó mới được cấp CPU.
</details>

### Câu Hỏi 3: Hiện tượng Starvation (Bỏ đói tài nguyên / Indefinite Blocking) trong Priority Scheduling thuần túy là gì và xảy ra khi nào?

<details>
<summary>Đáp án</summary>

- **Starvation** là nhược điểm chí mạng của thuật toán điều phối theo độ ưu tiên thuần túy, trong đó một tiến trình có độ ưu tiên thấp (**Low-Priority**) bị kẹt vĩnh viễn trong Ready Queue và không bao giờ có cơ hội được cấp CPU để tiến triển (dù không hề bị Deadlock hay lỗi mã nguồn).
- **Nguyên nhân xảy ra**: Khi hệ thống liên tục tiếp nhận một dòng các tiến trình có độ ưu tiên cao (**High-Priority Stream**), các tiến trình ưu tiên thấp luôn bị đẩy lại phía sau và không thể chạm vào CPU.
</details>

### Câu Hỏi 4: Kỹ thuật Aging (Lão hóa độ ưu tiên) hoạt động như thế nào để giải quyết vấn đề Starvation?

<details>
<summary>Đáp án</summary>

- **Định nghĩa**: **Aging** là kỹ thuật điều chỉnh độ ưu tiên động (**Dynamic Priority Adjustment**), trong đó hệ điều hành định kỳ **tăng dần mức độ ưu tiên của các tiến trình đã phải nằm chờ quá lâu** trong hàng đợi Ready Queue.
- **Cơ chế hoạt động**:
  - Tiến trình khi mới vào hàng đợi mang độ ưu tiên tĩnh ban đầu ($P_{\text{initial}}$).
  - Sau mỗi chu kỳ thời gian cố định $\Delta t$ nằm chờ trong Ready Queue, hệ điều hành tự động tăng độ ưu tiên của nó lên (theo mô hình tổng quát là tăng bậc ưu tiên theo thời gian chờ).
  - Sau khoảng thời gian chờ đủ dài, độ ưu tiên của tiến trình sẽ dần vượt qua các tiến trình mới đến để trở thành tiến trình có độ ưu tiên cao nhất và được cấp CPU.
  - Khi được cấp CPU và chạy xong, độ ưu tiên của nó được thiết lập lại về mức ban đầu.
- **Kết quả**: Đảm bảo tính công bằng (**Fairness**) và triệt tiêu 100% nguy cơ Starvation.
</details>

### Câu Hỏi 5: Hệ thống phân tầng độ ưu tiên 0–139 trong nhân Linux được chia thành những dải nào và đặc điểm của từng dải là gì?

<details>
<summary>Đáp án</summary>

Trong Linux hiện đại, độ ưu tiên được chia thành **140 mức (từ 0 đến 139)** gồm 2 dải chính:

1. **Dải Thời Gian Thực (Real-Time Range: 0 đến 99)**:
   - Dành cho các tiến trình Real-Time sử dụng chính sách `SCHED_FIFO`, `SCHED_RR` (với `rt_priority` từ `1` là thấp đến `99` là cao).
   - Các tiến trình này luôn chiếm quyền (**preempt**) mọi tiến trình người dùng thông thường ngay khi chúng sẵn sàng.
2. **Dải Người Dùng Thông Thường (Normal Tasks: 100 đến 139)**:
   - Dành cho các ứng dụng chạy chính sách `SCHED_OTHER` (được quản lý bởi **CFS - Completely Fair Scheduler** hoặc **EEVDF**).
   - Độ ưu tiên được kiểm soát thông qua giá trị `nice`.
</details>

### Câu Hỏi 6: Giá trị `nice` trên Linux có dải giá trị bao nhiêu, ánh xạ sang `kernel_priority` theo công thức nào và tác động ra sao trong bộ lập lịch CFS?

<details>
<summary>Đáp án</summary>

- **Dải giá trị `nice`**: Từ **`-20`** (ưu tiên người dùng cao nhất) đến **`+19`** (ưu tiên người dùng thấp nhất), giá trị mặc định chuẩn là **`0`**.
  - Giá trị `nice` càng cao (tiến tới `+19`): tiến trình càng "nhường nhịn" CPU $\implies$ độ ưu tiên càng thấp.
  - Giá trị `nice` càng âm (tiến tới `-20`): tiến trình đòi hỏi nhiều CPU hơn $\implies$ độ ưu tiên càng cao (chỉ người dùng `root` mới có quyền gán giá trị âm).
- **Công thức ánh xạ trong nhân Linux**:
  $$\text{kernel\_priority} = 120 + \text{nice\_value}$$
  (Ví dụ: `nice = -20` $\rightarrow 100$; `nice = 0` $\rightarrow 120$; `nice = +19` $\rightarrow 139$).
- **Tác động trong CFS**: Sự chênh lệch `1` mức `nice` tương ứng với hệ số nhân trọng số khoảng **1.25** ($\approx 10\%$ khác biệt về tỷ lệ chia sẻ thời gian CPU giữa hai tiến trình cạnh tranh).
</details>

### Câu Hỏi 7: Trong quản trị Linux CLI, cần dùng những lệnh nào để khởi chạy tiến trình với `nice` tùy chỉnh, thay đổi `nice` của tiến trình đang chạy, kiểm tra `PRI`/`NI` và xem thuộc tính Real-Time?

<details>
<summary>Đáp án</summary>

- **Khởi chạy tiến trình với giá trị `nice` chỉ định**: Dùng `nice -n <giá_trị> <lệnh>` (ví dụ: `nice -n 19 tar -czf backup.tar.gz /var/log/` hoặc `sudo nice -n -10 ./critical_data_analyzer` nếu dùng giá trị âm).
- **Thay đổi độ ưu tiên của tiến trình đang chạy**: Dùng `renice -n <giá_trị> -p <PID>` (ví dụ: `sudo renice -n -5 -p 84521`).
- **Kiểm tra giá trị `nice` (`NI`), độ ưu tiên (`PRI`) và `rtprio`**: Dùng `ps -eo pid,ni,pri,rtprio,comm`.
- **Kiểm tra thuộc tính điều phối Real-Time của tiến trình**: Dùng `chrt -p <PID>`.
</details>

### Câu Hỏi 8: Hiện tượng Đảo ngược độ ưu tiên (Priority Inversion) xảy ra như thế nào (qua sự cố Mars Pathfinder) và giải pháp khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế xảy ra Priority Inversion** (minh họa qua sự cố **Mars Pathfinder 1997** với 3 tác vụ $T_{\text{High}}$, $T_{\text{Medium}}$, $T_{\text{Low}}$):
  1. $T_{\text{Low}}$ giữ một khóa **Mutex**.
  2. $T_{\text{High}}$ cần chiếc Mutex đó nên chuyển sang trạng thái `Blocked` để chờ $T_{\text{Low}}$ nhả khóa.
  3. Lúc này $T_{\text{Medium}}$ thức giấc; vì có độ ưu tiên cao hơn $T_{\text{Low}}$ và không cần Mutex, $T_{\text{Medium}}$ chiếm quyền CPU và chạy liên tục, ngăn không cho $T_{\text{Low}}$ chạy để nhả Mutex.
  - **Hệ quả**: Tác vụ ưu tiên cao nhất ($T_{\text{High}}$) gián tiếp bị bỏ đói bởi tác vụ ưu tiên trung bình ($T_{\text{Medium}}$).
- **Giải pháp khắc phục**: Kích hoạt **Giao thức Thừa Kế Độ Ưu Tiên (Priority Inheritance Protocol)** — khi $T_{\text{High}}$ bị chặn bởi Mutex do $T_{\text{Low}}$ giữ, $T_{\text{Low}}$ sẽ tạm thời được thừa kế mức ưu tiên cao nhất của $T_{\text{High}}$ để chạy nhanh hoàn tất và nhả khóa, ngăn $T_{\text{Medium}}$ chen ngang.
</details>

### Câu Hỏi 9: Vì sao không nên lạm dụng `nice -n -20` hoặc quyền `SYS_NICE` cho container trong Kubernetes, và biện pháp chuẩn mực thay thế là gì?

<details>
<summary>Đáp án</summary>

- **Rủi ro khi lạm dụng**: Nếu một container được cấu hình `nice -n -20` hoặc cấp `securityContext.capabilities: [SYS_NICE]` gặp lỗi rò rỉ vòng lặp (**CPU leak**), nó sẽ chiếm dụng toàn bộ thời gian CPU của Node vật lý. Điều này khiến ngay cả các daemon cốt lõi của Kubernetes như `kubelet` và `containerd` bị đói CPU, dẫn đến trạng thái `NodeNotReady` và có thể làm sập dây chuyền cả cụm cluster.
- **Biện pháp chuẩn mực (Best Practice)**:
  - Tuyệt đối không tùy tiện cấp quyền `SYS_NICE` cho container ứng dụng người dùng.
  - Quản trị tài nguyên và độ ưu tiên trong môi trường Cloud thông qua cơ chế **Linux Control Groups (cgroups)** bằng cách thiết lập `resources.requests.cpu` và `resources.limits.cpu` trong Kubernetes manifest.
</details>
