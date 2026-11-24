# Review: 1_6_4 Shortest Job First and SRTF

### Câu Hỏi 1: Thuật toán SJF và SRTF ra đời nhằm giải quyết nhược điểm nào của thuật toán điều phối FCFS?

<details>
<summary>Đáp án</summary>

Thuật toán **Shortest Job First (SJF)** và biến thể **Shortest Remaining Time First (SRTF)** ra đời để giải quyết nhược điểm **Hiệu ứng đoàn tàu (Convoy Effect)** của thuật toán First-Come, First-Served (FCFS).

Trong FCFS, các tiến trình ngắn phải xếp hàng chờ đợi phía sau một tiến trình tính toán CPU lớn đến trước, khiến thời gian chờ đợi trung bình (**Average Waiting Time**) của hệ thống tăng vọt. Việc ưu tiên các tiến trình ngắn chạy trước giúp giảm mạnh thời gian chờ đợi trung bình.
</details>

### Câu Hỏi 2: Sự khác biệt cốt lõi giữa Shortest Job First (SJF) và Shortest Remaining Time First (SRTF) là gì?

<details>
<summary>Đáp án</summary>

Sự khác biệt cốt lõi nằm ở cơ chế **chiếm dụng (Preemption)**:
- **SJF (Shortest Job First)**: Là thuật toán **không chiếm dụng (Non-preemptive)**. Khi một tiến trình đã nhận CPU, nó sẽ chạy cho đến khi kết thúc CPU Burst rồi hệ thống mới chọn tiến trình có CPU Burst tiếp theo ngắn nhất.
- **SRTF (Shortest Remaining Time First)** — còn gọi là **Shortest Time-to-Completion First (STCF)**: Là biến thể **chiếm dụng (Preemptive)**. Trong lúc một tiến trình đang chạy, nếu có tiến trình mới đến với thời gian thực thi ngắn hơn thời gian còn lại của tiến trình hiện tại, hệ thống sẽ tước CPU ngay để chạy tiến trình mới.
</details>

### Câu Hỏi 3: Trong điều kiện nào SJF được chứng minh là tối ưu toán học về thời gian chờ trung bình, và phép chứng minh hoán vị (Proof by Transposition) giải thích điều này như thế nào?

<details>
<summary>Đáp án</summary>

SJF đảm bảo **Average Waiting Time** nhỏ nhất tuyệt đối khi xét một tập hợp các tiến trình tĩnh **cùng sẵn sàng tại một thời điểm ($t=0$)**.

**Ý tưởng chứng minh bằng phép hoán vị**:
- Giả sử có hai tiến trình $P_i$ và $P_j$ với độ dài CPU Burst là $B_i < B_j$.
- Nếu chạy $P_j$ trước $P_i$, tổng thời gian chờ của hai tiến trình là $0 + B_j = B_j$.
- Nếu hoán đổi để chạy tiến trình ngắn hơn $P_i$ trước $P_j$ (quy tắc SJF), tổng thời gian chờ là $0 + B_i = B_i$.
- Vì $B_i < B_j$, việc đưa tiến trình ngắn lên trước làm tổng thời gian chờ giảm đi một lượng bằng $(B_j - B_i)$. Lặp lại phép hoán vị này trên toàn bộ danh sách tiến trình sẽ thu được thứ tự tăng dần theo Burst Time của SJF.
</details>

### Câu Hỏi 4: Trong SRTF, điều kiện chính xác để hệ thống thực hiện chiếm dụng CPU (Preemption) là gì, và khi nào thì SRTF hoạt động hoàn toàn giống hệt SJF?

<details>
<summary>Đáp án</summary>

- **Điều kiện chiếm dụng**: Khi một tiến trình mới $P_{\text{new}}$ bước vào hàng đợi `Ready`, hệ thống so sánh:
  $$\text{Burst}(P_{\text{new}}) < \text{Remaining\_Time}(P_{\text{current}})$$
  Nếu điều kiện này đúng, hệ thống thực hiện chuyển ngữ cảnh ngay lập tức, tước CPU từ $P_{\text{current}}$ để trao cho $P_{\text{new}}$.
- **Trường hợp SRTF hoạt động giống hệt SJF**: Khi **tất cả các tiến trình đều đến đồng thời tại cùng một thời điểm ban đầu ($t=0$)**. Vì không có tiến trình mới nào xuất hiện thêm trong quá trình thực thi để kích hoạt điều kiện chiếm dụng, tiến trình ngắn nhất sẽ chạy hết rồi mới tới tiến trình tiếp theo giống hệt Non-preemptive SJF.
</details>

### Câu Hỏi 5: Trong thực hành tính toán, khi các tiến trình có cùng độ dài CPU Burst (thế hòa) trong SJF thì hệ thống xử lý thế nào, và công thức tính $TAT$ cùng $WT$ là gì?

<details>
<summary>Đáp án</summary>

- **Phá vỡ thế hòa (Tie-breaking)**: Khi hai hoặc nhiều tiến trình có cùng độ dài CPU Burst, SJF áp dụng quy tắc **FCFS** — ưu tiên tiến trình có thời điểm đến ($AT$ - Arrival Time) sớm hơn chạy trước.
- **Công thức tính các chỉ số**: Với thời điểm hoàn thành là $CT$ (Completion Time) và thời gian thực thi là $BT$ (Burst Time):
  - **Thời gian lưu lại ($TAT$ - Turnaround Time)**: $TAT = CT - AT$
  - **Thời gian chờ ($WT$ - Waiting Time)**: $WT = TAT - BT$
</details>

### Câu Hỏi 6: Tại sao các hệ điều hành đa dụng (như Windows hay Linux) không thể triển khai SJF/SRTF nguyên bản, và hệ điều hành dùng kỹ thuật gì để khắc phục?

<details>
<summary>Đáp án</summary>

Trong môi trường hệ điều hành tương tác đa dụng, hạt nhân **không thể biết trước chính xác** một tiến trình sẽ sử dụng CPU trong bao nhiêu miligiây trước khi nó gọi I/O hoặc kết thúc.

Để khắc phục, hệ điều hành xấp xỉ độ dài CPU Burst tiếp theo dựa trên lịch sử quá khứ của tiến trình bằng kỹ thuật **Làm mịn số mũ (Exponential Smoothing / Exponential Average)**. Vì chỉ là dự đoán nên luôn có sai số, do đó tính tối ưu tuyệt đối về mặt lý thuyết của SJF không thể bảo đảm trọn vẹn trong thực tế.
</details>

### Câu Hỏi 7: Hãy giải thích ý nghĩa các thành phần trong công thức Exponential Smoothing $\tau_{n+1} = \alpha t_n + (1 - \alpha)\tau_n$ và lý do các lần chạy gần nhất ảnh hưởng lớn nhất đến dự đoán.

<details>
<summary>Đáp án</summary>

Ý nghĩa các thành phần trong công thức $\tau_{n+1} = \alpha t_n + (1 - \alpha)\tau_n$:
- $t_n$: Độ dài CPU Burst **thực tế** ở lần thực thi thứ $n$.
- $\tau_n$: Giá trị độ dài CPU Burst đã được **dự đoán** cho lần thứ $n$.
- $\tau_{n+1}$: Giá trị độ dài CPU Burst được **dự đoán cho lần tiếp theo** $(n+1)$.
- $\alpha \in [0, 1]$: Trọng số điều chỉnh mức độ tin cậy vào quá khứ gần so với lịch sử xa (thường chọn $\alpha = 0.5$ hoặc $1/2$).

Khi khai triển chuỗi lịch sử, mỗi lần thực thi lùi về quá khứ sẽ nhân thêm hệ số $(1 - \alpha)$. Vì $(1 - \alpha) \le 1$, trọng số của các lần thực thi trong quá khứ xa suy giảm theo hàm mũ, giúp các lần chạy gần nhất đóng góp tỷ trọng lớn nhất vào kết quả dự đoán.
</details>

### Câu Hỏi 8: Trong công thức Exponential Smoothing, điều gì xảy ra nếu cấu hình $\alpha = 0$ hoặc $\alpha = 1$?

<details>
<summary>Đáp án</summary>

- **Khi $\alpha = 1$**: Công thức trở thành $\tau_{n+1} = t_n$. Hệ thống phớt lờ toàn bộ lịch sử xa và chỉ dựa duy nhất vào độ dài burst thực tế của lần chạy gần nhất, khiến giá trị dự đoán biến động rất mạnh nếu lần chạy đó là một ngoại lệ bất thường.
- **Khi $\alpha = 0$**: Công thức trở thành $\tau_{n+1} = \tau_n = \tau_0$. Hệ thống phớt lờ hoàn toàn hành vi thực tế gần đây và giữ nguyên giá trị dự đoán ban đầu mãi mãi, không có khả năng tự học hay thích ứng.
</details>

### Câu Hỏi 9: Cạm bẫy Starvation trong SJF/SRTF là gì và kỹ thuật Aging khắc phục cạm bẫy này như thế nào?

<details>
<summary>Đáp án</summary>

- **Starvation (Bỏ đói)**: Trong cả SJF và SRTF, nếu hệ thống liên tục nhận được các tiến trình ngắn (Short Jobs), các tác vụ dài (Long Jobs — ví dụ sao lưu cơ sở dữ liệu, render video) sẽ liên tục bị đẩy xuống sau và có thể bị **bỏ đói vĩnh viễn**, không bao giờ được cấp CPU.
- **Kỹ thuật Lão hóa (Aging)**: Để khắc phục, hệ thống tăng dần độ ưu tiên hoặc giảm trừ độ dài dự đoán của tiến trình theo tỷ lệ thuận với khoảng thời gian mà nó đã phải nằm chờ trong hàng đợi `Ready`. Nhờ vậy, một tác vụ dài chờ đủ lâu cuối cùng cũng sẽ được ưu tiên cấp CPU.
</details>

### Câu Hỏi 10: Vì sao chi phí chuyển ngữ cảnh (Context Switch Overhead) có thể làm mất đi tính tối ưu của SRTF trong thực tế, và Linux CFS hạn chế vấn đề này như thế nào?

<details>
<summary>Đáp án</summary>

- **Ảnh hưởng của Context Switch Overhead**: Mỗi lần chiếm dụng (Preemption) đều phát sinh chi phí chuyển ngữ cảnh (lưu/nạp thanh ghi CPU, mất mát bộ đệm CPU L1/L2/L3 Cache, nạp lại TLB — thường mất từ `1 đến 5 microgiây`). Nếu một tiến trình mới đến chỉ ngắn hơn phần còn lại của tiến trình đang chạy một khoảng rất nhỏ (ví dụ `0.001 ms`) mà hệ thống vẫn chiếm dụng, chi phí chuyển ngữ cảnh sẽ xóa sạch lợi ích tối ưu của SRTF.
- **Thực tiễn trên Linux CFS**: Bộ điều phối Linux Completely Fair Scheduler (CFS) sử dụng tham số `granularity` (`sysctl_sched_min_granularity`) để ngăn chặn việc chiếm dụng nếu tiến trình đang chạy chưa thực thi đủ một khoảng thời gian tối thiểu.
</details>
