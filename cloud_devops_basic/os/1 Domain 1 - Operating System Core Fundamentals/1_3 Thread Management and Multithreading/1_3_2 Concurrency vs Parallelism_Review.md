# Review: 1_3_2 Concurrency vs Parallelism

### Câu Hỏi 1: Sự khác nhau cốt lõi về bản chất giữa Concurrency (Tính đồng thời) và Parallelism (Tính song song) là gì?

<details>
<summary>Đáp án</summary>

Theo định nghĩa kinh điển của Rob Pike và phân tích kỹ thuật trong bài học:
- **Concurrency (Tính đồng thời)** thuộc về **cấu trúc phần mềm (Program Structure)** — là việc *xử lý nhiều việc cùng lúc* bằng cách phân rã bài toán thành các luồng độc lập có thể tiến triển đan xen (interleaving), không phụ thuộc vào việc chúng có chạy tại cùng một tích tắc vật lý hay không.
- **Parallelism (Tính song song)** thuộc về **năng lực phần cứng (Hardware Execution)** — là việc *thực thi nhiều việc cùng lúc* tại đúng cùng một tích tắc thời gian vật lý trên các nhân CPU (cores) hoặc bộ vi xử lý riêng biệt.
- Nói ngắn gọn: **Concurrency không phải là Parallelism**, nhưng Concurrency tạo tiền đề (enables) cho Parallelism.

</details>

### Câu Hỏi 2: Hệ thống chỉ có 1 CPU Core đơn nhân có thể đạt được Concurrency và Parallelism không? Cơ chế hoạt động trên phần cứng này diễn ra như thế nào?

<details>
<summary>Đáp án</summary>

- **Có thể đạt được Concurrency**: Một chương trình đa luồng sở hữu nhiều con trỏ lệnh (`Program Counter - PC`) độc lập. Trên hệ thống 1 CPU Core, hệ điều hành thực hiện Concurrency thông qua cơ chế chia sẻ thời gian (**Time-slicing / Preemption**) và chuyển đổi ngữ cảnh (**Context Switching**) luân phiên giữa các luồng (ví dụ: Luồng A chạy 5ms $\rightarrow$ Luồng B chạy 5ms $\rightarrow$ Luồng A chạy tiếp), giúp các tác vụ cùng tiến triển đan xen.
- **Không thể đạt được Parallelism**: Tại bất kỳ một nano-giây vật lý nào, phần cứng bán dẫn của một core duy nhất chỉ có thể thực thi lệnh của duy nhất một luồng. Parallelism **bắt buộc** phải có phần cứng đa nhân (Multi-core) hoặc đa vi xử lý vật lý (Multi-socket).

</details>

### Câu Hỏi 3: Trên hệ thống Multi-core (đa nhân), Concurrency và Parallelism phối hợp với nhau như thế nào?

<details>
<summary>Đáp án</summary>

Trên hệ thống Multi-core (ví dụ 4 cores), hệ thống có thể đạt được **cả Concurrency lẫn Parallelism** cùng lúc: các luồng độc lập (như Luồng A trên Core 0 và Luồng B trên Core 1) được CPU thực thi song song tại đúng cùng một thời điểm xung nhịp đồng hồ (clock tick), đồng thời hệ điều hành vẫn có thể đan xen nhiều luồng khác trên từng core nếu số luồng lớn hơn số core.

</details>

### Câu Hỏi 4: Công thức của Định luật Amdahl (Amdahl's Law) là gì và ý nghĩa của từng thành phần trong công thức đó ra sao?

<details>
<summary>Đáp án</summary>

Công thức Định luật Amdahl:

$$S(N) = \frac{1}{(1 - P) + \frac{P}{N}}$$

Trong đó:
- **$S(N)$**: Hệ số tăng tốc lý thuyết (Theoretical Speedup) khi sử dụng $N$ nhân xử lý.
- **$P$**: Tỷ lệ phần trăm khối lượng công việc của chương trình có thể chạy song song ($0 \le P \le 1$).
- **$(1 - P)$**: Tỷ lệ phần trăm khối lượng công việc bắt buộc phải chạy **tuần tự** (Serial Fraction — ví dụ: khởi tạo tệp, phân phối dữ liệu ban đầu, tranh chấp khóa đồng bộ, tổng hợp kết quả cuối cùng).
- **$N$**: Số lượng nhân vi xử lý (CPU Cores).

</details>

### Câu Hỏi 5: Theo Định luật Amdahl, điều gì quyết định giới hạn tăng tốc tối đa (Amdahl's Bottleneck) khi số lượng CPU cores tiến tới vô cùng ($N \to \infty$)?

<details>
<summary>Đáp án</summary>

Khi số lượng CPU cores tiến tới vô cùng ($N \to \infty$), thành phần $\frac{P}{N}$ tiến về $0$. Khi đó, hệ số tăng tốc cực đại bị chặn trên bởi tỷ lệ mã bắt buộc phải chạy tuần tự $(1 - P)$:

$$\lim_{N \to \infty} S(N) = \frac{1}{1 - P}$$

Ví dụ: Nếu một chương trình có $90\%$ chạy song song ($P = 0.90$) và $10\%$ chạy tuần tự ($1 - P = 0.10$), thì dù có tăng lên hàng nghìn hay vô hạn cores, tốc độ toàn hệ thống **không bao giờ nhanh hơn $10\times$** so với chạy trên 1 core. Phần mã tuần tự chính là nút thắt quyết định trần hiệu năng.

</details>

### Câu Hỏi 6: Sự khác nhau giữa Định luật Amdahl (Strong Scaling) và Định luật Gustafson (Weak Scaling) là gì?

<details>
<summary>Đáp án</summary>

- **Định luật Amdahl (Strong Scaling)**: Đặt giả thiết **kích thước bài toán là cố định** (Fixed problem size). Khi tăng số lượng CPU cores, mục tiêu là giải quyết cùng một bài toán đó trong thời gian ngắn nhất; hiệu quả tăng tốc biên giảm dần do nút thắt tuần tự.
- **Định luật Gustafson (Weak Scaling)**: Đặt giả thiết **thời gian thực thi là cố định**, nhưng kích thước bài toán mở rộng tương ứng theo năng lực tính toán ($S(N) = N - (1 - P)(N - 1)$). Trong các hệ thống Big Data hoặc AI/Machine Learning, khi có thêm máy chủ hoặc core, hệ thống xử lý tập dữ liệu lớn hơn nhiều lần trong cùng một khoảng thời gian chấp nhận được.

</details>

### Câu Hỏi 7: CPU Affinity trên Linux là gì? Làm thế nào dùng `pthread_setaffinity_np` cùng `CPU_ZERO` và `CPU_SET` để tạo ra chế độ Concurrency và Parallelism cho 2 luồng?

<details>
<summary>Đáp án</summary>

- **CPU Affinity (CPU Pinning)** là kỹ thuật cho phép ứng dụng can thiệp vào bộ lập lịch (Scheduler) mặc định của Linux để gán cố định một luồng vào một hoặc nhiều CPU core cụ thể thông qua hàm `pthread_setaffinity_np(pthread_t thread, size_t cpusetsize, const cpu_set_t *cpuset)`.
- Sử dụng macro `CPU_ZERO(&cpuset)` để xóa rỗng mặt nạ và `CPU_SET(core_id, &cpuset)` để chỉ định core:
  - **Tái hiện Concurrency**: Dùng `CPU_SET(0, ...)` gán cả 2 luồng ngốn CPU vào cùng `Core 0`. Hai luồng buộc phải tranh chấp và chia sẻ thời gian (time-slicing) trên 1 core duy nhất.
  - **Tái hiện Parallelism**: Dùng `CPU_SET(0, &cpuset1)` gán Luồng 1 vào `Core 0` và `CPU_SET(1, &cpuset2)` gán Luồng 2 vào `Core 1`. Cả hai luồng chạy song song thực sự trên 2 core phần cứng riêng biệt.

</details>

### Câu Hỏi 8: Khi theo dõi bằng lệnh `mpstat -P ALL 1` trên Linux cho một chương trình chạy 2 luồng ngốn CPU, dấu hiệu nào giúp phân biệt chế độ Concurrency và chế độ Parallelism?

<details>
<summary>Đáp án</summary>

- **Dấu hiệu chế độ Concurrency (cùng chạy trên 1 core)**: Chỉ có duy nhất một CPU core (ví dụ `CPU 0`) có chỉ số `%usr` đạt `100%`, trong khi tất cả các core khác (`CPU 1, 2, 3...`) đều có `%idle` bằng `100%`. (Trên máy 4 cores, tổng tải `all` là khoảng `25%`).
- **Dấu hiệu chế độ Parallelism (chạy trên 2 cores riêng biệt)**: Cả `CPU 0` và `CPU 1` đồng thời hiển thị chỉ số `%usr` đạt `100%` tại cùng thời điểm lấy mẫu (trên máy 4 cores, tổng tải `all` tăng lên `50%`). Thời gian hoàn tất chương trình giảm đi gần một nửa so với chế độ Concurrency.

</details>

### Câu Hỏi 9: Nguyên nhân gây ra "Ảo tưởng tăng tốc tuyến tính" (Linear Scaling Illusion) khi nâng cấp CPU trên Cloud là gì và cần tối ưu hóa như thế nào?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân**: Dù nâng cấp từ máy 4 vCPU lên 32 vCPU (gấp 8 lần tài nguyên và chi phí), ứng dụng vẫn chứa các đoạn mã tuần tự (Critical Sections) như khóa độc quyền (**Global Mutex / Database Lock**) hoặc ghi nhật ký tuần tự vào một tệp (**Write-Ahead Logging - WAL**). Theo Định luật Amdahl, phần mã tuần tự này chặn trần tăng tốc của toàn hệ thống; đồng thời khi nhiều core cùng truy cập khóa, chi phí tranh chấp khóa (**Lock Contention**) tăng vọt khiến hiệu năng thực tế tăng rất ít rồi đi ngang.
- **Cách tối ưu trước khi nâng cấp CPU**: Phải giảm thiểu phần mã tuần tự bằng cách chia nhỏ khóa (**Lock Striping**), sử dụng cấu trúc dữ liệu không khóa (**Lock-free data structures**), hoặc chuyển sang kiến trúc bất đồng bộ (**Actor model / Event-driven**).

</details>

### Câu Hỏi 10: Cạm bẫy "Phân bổ quá nhiều luồng" (Over-Threading) gây suy giảm hiệu năng như thế nào?

<details>
<summary>Đáp án</summary>

Khi tạo quá nhiều luồng tính toán số học vượt xa số nhân phần cứng (ví dụ: tạo 500 luồng trên máy chủ chỉ có 8 CPU Cores), các luồng này không thể chạy song song (Parallelism) vì phần cứng chỉ có 8 nhân vật lý. Thay vào đó, chúng buộc phải chạy đồng thời (Concurrency), khiến kernel phải liên tục thực hiện chuyển đổi ngữ cảnh (**Context Switching**) hàng trăm nghìn lần mỗi giây. Chi phí lưu/nạp thanh ghi và trượt bộ nhớ đệm **CPU Cache** phát sinh từ việc chuyển đổi liên tục này làm chương trình chạy **chậm hơn đáng kể** so với việc chỉ tạo đúng 8 luồng tương ứng với số core.

</details>
