# Review: 1_5_7 Deadlock vs Livelock vs Starvation

### Câu Hỏi 1: Ba hiện tượng lỗi tiến triển (Liveness Hazards) gồm Deadlock, Livelock và Starvation có điểm chung gì và khác nhau thế nào về bản chất trạng thái?

<details>
<summary>Đáp án</summary>

Điểm chung của cả ba hiện tượng là đều khiến công việc của ứng dụng hoặc tiến trình không thể hoàn thành tác vụ (đóng băng hoặc đình trệ). Tuy nhiên, bản chất trạng thái của chúng hoàn toàn khác nhau:
- **Deadlock (Bế tắc) — Tĩnh (Static):** Các tiến trình/luồng bị phong tỏa hoàn toàn và không nhúc nhích.
- **Livelock (Khóa sống) — Động (Dynamic):** Các luồng liên tục vận động và đổi trạng thái để phản ứng với nhau nhưng hoàn toàn vô ích (Zero Progress).
- **Starvation (Đói tài nguyên) — Bất công (Unfairness):** Tiến trình nạn nhân bị bỏ quên vì cơ chế điều phối (Scheduler hoặc Lock) liên tục thiên vị các tiến trình khác.
</details>

### Câu Hỏi 2: So sánh trạng thái tiến trình và mức tiêu thụ CPU giữa Deadlock, Livelock và Starvation?

<details>
<summary>Đáp án</summary>

- **Deadlock:** Tiến trình ở trạng thái `Blocked` / `Waiting` / `Sleeping` (được hạt nhân đưa vào hàng đợi chờ). Mức tiêu thụ CPU xấp xỉ **0.0%** vì tiến trình đang ngủ và không tiêu tốn chu kỳ lệnh.
- **Livelock:** Tiến trình ở trạng thái `Running` (liên tục đổi trạng thái trong vòng lặp vô hạn). Mức tiêu thụ CPU **gần 100%** trên các lõi liên quan vì CPU quay vòng xử lý logic thử lại.
- **Starvation:** Tiến trình nạn nhân ở trạng thái `Ready` (sẵn sàng thực thi bất kỳ lúc nào nhưng không được cấp phát CPU hoặc khóa). Mức tiêu thụ CPU là **0%** đối với tiến trình nạn nhân, trong khi toàn hệ thống vẫn tiêu thụ CPU bình thường cho các tiến trình khác.
</details>

### Câu Hỏi 3: Về mặt tiến triển chung của toàn bộ hệ thống (System Progress), Starvation khác với Deadlock và Livelock ở điểm nào?

<details>
<summary>Đáp án</summary>

- **Deadlock và Livelock:** Không có tiến triển (`Không`). Toàn bộ nhóm luồng nằm trong chu trình phụ thuộc (Deadlock) hoặc đang va chạm thử lại (Livelock) đều đứng im hoặc không thể hoàn tất công việc.
- **Starvation:** Toàn hệ thống **vẫn có tiến triển tốt (`Có`)** và liên tục hoàn thành công việc của các tiến trình có độ ưu tiên cao hoặc được ưu tiên cấp phát tài nguyên. Chỉ riêng một hoặc một vài tiến trình nạn nhân bị gạt ra ngoài lề và đứng im vĩnh viễn.
</details>

### Câu Hỏi 4: Nguyên nhân gốc rễ của Deadlock là gì và trong Linux Kernel các tiến trình bị Deadlock thường rơi vào trạng thái ngủ nào?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân gốc rễ:** Hệ thống hội tụ đủ 4 điều kiện Coffman, tạo thành một chu trình phụ thuộc tài nguyên khép kín (Circular Wait) — ví dụ tiến trình $P_1$ giữ $R_1$ và đợi $R_2$, trong khi $P_2$ giữ $R_2$ và đợi $R_1$.
- **Trạng thái trong Linux Kernel:** Thông qua các system call như `futex`, các tiến trình bị Deadlock sẽ bị đưa vào trạng thái ngủ ngắt được (`TASK_INTERRUPTIBLE`) hoặc ngủ không ngắt được (`TASK_UNINTERRUPTIBLE`), khiến mức tiêu thụ CPU rơi về ~0% và dừng mọi thao tác I/O.
</details>

### Câu Hỏi 5: Livelock thường xảy ra như thế nào khi lập trình viên sử dụng các hàm non-blocking (như `pthread_mutex_trylock`) để tránh Deadlock?

<details>
<summary>Đáp án</summary>

Khi lập trình viên dùng hàm non-blocking như `pthread_mutex_trylock` với logic: nếu không chiếm được khóa thứ hai thì chủ động nhả khóa thứ nhất rồi thử lại từ đầu. Nếu hai luồng chạy trên hai lõi CPU với nhịp đồng bộ và không có độ trễ ngẫu nhiên (random delay):
1. Cả hai luồng cùng chiếm khóa thứ nhất của mình (`lock1` với Thread A, `lock2` với Thread B).
2. Cả hai cùng gọi `trylock` cho khóa thứ hai và cùng thất bại.
3. Cả hai cùng nhả khóa thứ nhất rồi ngay lập tức thử lại đồng thời.

Chu kỳ này lặp lại vô tận, khiến cả hai luồng bận rộn liên tục ở 100% CPU nhưng không bao giờ hoàn thành công việc.
</details>

### Câu Hỏi 6: Làm thế nào để nhận diện hiện tượng Livelock khi quan sát hệ thống trên Linux bằng lệnh `top` (ví dụ `top -p $PID -H`)?

<details>
<summary>Đáp án</summary>

Khi quan sát qua `top -p $PID -H`, dấu hiệu nhận diện Livelock gồm:
- Các luồng liên quan đều hiển thị ở trạng thái **`R` (Running)**, không có luồng nào ở trạng thái ngủ (`S` hay `D` như trong Deadlock).
- Mức `%CPU` của các luồng chạm ngưỡng **~100% CPU** trên các lõi tương ứng (quạt máy chủ có thể quay hết công suất).
- Nhật ký ứng dụng (logs) không ghi nhận bất kỳ nghiệp vụ hay yêu cầu nào được hoàn thành thực chất.
</details>

### Câu Hỏi 7: Hãy liệt kê các giải pháp triệt tiêu chính cho Deadlock và Livelock được nêu trong bài học?

<details>
<summary>Đáp án</summary>

- **Giải pháp cho Deadlock:**
  - Havender Total Ordering (quy ước thứ tự chiếm khóa toàn cục).
  - Phá vỡ các điều kiện Coffman (Coffman Conditions).
  - Phát hiện và khôi phục (Detection & Rollback).
- **Giải pháp cho Livelock:**
  - Randomized Exponential Backoff (lùi thời gian chờ theo cấp số nhân có yếu tố ngẫu nhiên).
  - Thêm Jitter ngẫu nhiên để phá vỡ sự đồng bộ xung nhịp giữa các luồng.
  - Chuyển từ cơ chế ngắt (Interrupt) sang thăm dò (Polling) đối với trường hợp Receive Livelock.
</details>

### Câu Hỏi 8: Hiện tượng Writer Starvation xảy ra như thế nào với `pthread_rwlock_t` và cách khắc phục trong môi trường sản xuất là gì?

<details>
<summary>Đáp án</summary>

- **Cơ chế gây Starvation:** Trên nhiều phiên bản triển khai mặc định của Linux Glibc, `pthread_rwlock_t` sử dụng chính sách thiên vị người đọc (**Reader-Preference**). Khi có luồng đọc (Reader) đang giữ khóa, luồng ghi (Writer) phải chờ. Nếu các luồng đọc mới liên tục đến gối đầu nhau không dứt, luồng ghi sẽ bị chặn và bỏ đói vĩnh viễn (Writer Starvation), khiến dữ liệu/cache không bao giờ được cập nhật.
- **Cách khắc phục chuẩn sản xuất:** Thiết lập thuộc tính khóa thiên vị người ghi hoặc công bằng (Fair RWLock) thông qua `pthread_rwlockattr_setkind_np`:
  - Khởi tạo `pthread_rwlockattr_t`, gọi `pthread_rwlockattr_setkind_np(&attr, PTHREAD_RWLOCK_PREFER_WRITER_NONRECURSIVE_NP)`, rồi truyền vào `pthread_rwlock_init`.
</details>

### Câu Hỏi 9: Hiện tượng Receive Livelock (Interrupt Storm) ở tầng mạng Linux hoạt động như thế nào và gây ra hậu quả gì?

<details>
<summary>Đáp án</summary>

Khi gói tin mạng đổ về card mạng (NIC) với tốc độ cực cao:
1. NIC liên tục bắn ngắt phần cứng (Hardware Interrupt IRQ) tới CPU.
2. CPU phải dừng công việc hiện tại để chạy Interrupt Service Routine (ISR) và đưa gói tin vào hàng đợi Kernel Ring Buffer.
3. Trước khi CPU kịp bàn giao gói tin cho ứng dụng không gian người dùng (User App), NIC lại bắn tiếp IRQ mới, buộc CPU quay lại chạy ISR.

**Hậu quả:** CPU đạt ngưỡng **100%** chỉ để xử lý ngắt (IRQ Handling), hàng đợi bị tràn nên nhân buộc phải **DROP (hủy)** các gói tin vừa nhận, còn User App (như Nginx, Redis) bị đói CPU và **không nhận được bất kỳ gói tin nào**.
</details>

### Câu Hỏi 10: Cơ chế Linux NAPI (New API) giải quyết hiện tượng Receive Livelock bằng cách nào?

<details>
<summary>Đáp án</summary>

Nhân Linux triển khai **NAPI (New API)** để chuyển đổi linh hoạt giữa hai chế độ dựa trên lưu lượng mạng:
- **Khi lưu lượng mạng thấp:** Card mạng hoạt động ở chế độ ngắt bình thường (**Interrupt Mode**) để đảm bảo độ trễ thấp nhất.
- **Khi lưu lượng mạng vượt ngưỡng cao:** Linux Kernel chủ động **tắt hoàn toàn ngắt phần cứng của card mạng (Disable IRQ)** và chuyển sang chế độ thăm dò định kỳ theo lô (**Polling Mode**). Nhờ đó, CPU kiểm soát chính xác hạn ngạch (budget) thời gian xử lý gói tin và ngăn ngừa Receive Livelock.
</details>

### Câu Hỏi 11: Kỹ thuật Lão hóa (Aging) giúp ngăn chặn Starvation trong bộ điều phối CPU (Priority Scheduling) như thế nào?

<details>
<summary>Đáp án</summary>

Trong Priority Scheduling, nếu bộ điều phối chỉ luôn chọn tiến trình có độ ưu tiên cao nhất, tiến trình độ ưu tiên thấp có thể bị bỏ đói vĩnh viễn.

**Kỹ thuật Lão hóa (Aging)** giải quyết vấn đề này bằng cách: cứ sau mỗi chu kỳ thời gian (ví dụ mỗi 1 giây) mà một tiến trình nằm chờ trong hàng đợi `Ready` nhưng chưa được cấp CPU, bộ điều phối sẽ **tăng dần độ ưu tiên của nó lên 1 bậc**. Cuối cùng, độ ưu tiên của tiến trình chờ lâu sẽ vượt qua các tiến trình mới vào, đảm bảo mọi tiến trình đều được phục vụ công bằng.
</details>

### Câu Hỏi 12: Khi quan sát cột `STAT` trong lệnh `ps aux` trên Linux, làm thế nào phân biệt một tiến trình bị Deadlock với một tiến trình bị Starvation?

<details>
<summary>Đáp án</summary>

- **Tiến trình bị Deadlock:** Hiển thị trạng thái **`S` (Interruptible Sleep)** hoặc **`D` (Uninterruptible Sleep / I/O wait)** vì nó đang bị hạt nhân treo ngủ trên hàng đợi chờ tài nguyên (chẳng hạn chờ mutex giải phóng qua `futex`).
- **Tiến trình bị Starvation:** Thường ở trạng thái **`R` (Running / Runnable trên hàng đợi Ready)** hoặc ngủ rất ngắn, vì về mặt logic nó hoàn toàn sẵn sàng nhận CPU để chạy ngay lập tức nhưng liên tục bị bộ lập lịch bỏ qua để nhường cho tiến trình ưu tiên cao hơn.
</details>
