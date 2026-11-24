# Review: 1_7_7 Thrashing and the Working Set Model

### Câu Hỏi 1: Hiện tượng Thrashing (Trì trệ / Quẫy đạp bộ nhớ) là gì và hệ thống biểu hiện những đặc điểm nào khi rơi vào trạng thái này?

<details>
<summary>Đáp án</summary>

**Thrashing** xảy ra khi tổng số trang nhớ mà các tiến trình đang tích cực sử dụng cùng lúc vượt quá dung lượng RAM vật lý, khiến hệ điều hành phải liên tục hoán đổi trang giữa RAM và ổ cứng.

Các đặc điểm chính khi hệ thống bị Thrashing:
- Máy tính dành hầu hết thời gian (thậm chí 99%) chỉ để **hoán đổi trang (swapping/paging)** liên tục giữa RAM và đĩa thay vì thực thi lệnh tính toán hữu ích.
- Tốc độ phát sinh lỗi thiếu trang (**Page Fault Rate**) tăng vọt.
- Các tiến trình rơi vào trạng thái ngủ chờ I/O (`Blocked / Disk Sleep` hoặc `D` state trên Linux).
- Hàng đợi I/O của ổ đĩa bị nghẽn $100\%$, trong khi mức sử dụng CPU thực tế tụt dốc về gần $0\%$.
</details>

### Câu Hỏi 2: "Vòng xoáy tự hủy hoại" (Vicious Downward Spiral) của Thrashing diễn ra như thế nào và bộ lập lịch CPU (CPU Scheduler) đã mắc sai lầm gì?

<details>
<summary>Đáp án</summary>

Quá trình diễn ra theo chuỗi phản ứng dây chuyền sau:
1. Khi số tiến trình tăng vượt ngưỡng RAM vật lý, tiến trình A cần trang mới nên OS buộc phải tước trang của tiến trình B đẩy ra swap.
2. Khi tiến trình B chạy lại, nó chạm vào trang vừa bị lấy mất $\to$ gây **Page Fault** $\to$ OS lại đẩy trang của tiến trình C ra đĩa để nạp lại cho B.
3. Các tiến trình lần lượt bị chặn để chờ nạp đĩa, làm mức sử dụng CPU tụt giảm nghiêm trọng.
4. **Sai lầm của CPU Scheduler**: Bộ điều phối lầm tưởng hệ thống đang "nhàn rỗi" vì thiếu việc làm, nên quyết định **nạp thêm các tiến trình mới vào RAM** (tăng **Degree of Multiprogramming**) để cố tăng hiệu suất CPU.
5. Các tiến trình mới tiếp tục tranh giành RAM, làm Page Fault tăng theo cấp số nhân và khiến toàn bộ hệ thống đóng băng.
</details>

### Câu Hỏi 3: Nguyên lý Cục bộ (Principle of Locality) là gì? Phân biệt hai dạng cục bộ chính trong truy cập bộ nhớ của chương trình.

<details>
<summary>Đáp án</summary>

**Nguyên lý Cục bộ (Principle of Locality)** chỉ ra rằng một chương trình không truy cập ngẫu nhiên khắp toàn bộ bộ nhớ, mà trong một khoảng thời gian ngắn sẽ tập trung truy xuất vào một tập hợp trang nhớ xác định.

Hai dạng cục bộ chính gồm:
- **Cục bộ thời gian (Temporal Locality)**: Một ô nhớ vừa được truy xuất thì có xác suất rất cao sẽ được truy xuất lại trong tương lai gần (ví dụ: biến đếm vòng lặp `for`, mã của các hàm đệ quy).
- **Cục bộ không gian (Spatial Locality)**: Khi một ô nhớ được truy xuất, các ô nhớ nằm liền kề nó cũng sẽ sớm được truy xuất theo (ví dụ: duyệt tuần tự một mảng dữ liệu, thực thi mã máy tính nối tiếp nhau).
</details>

### Câu Hỏi 4: Trong Mô hình Tập làm việc (Working Set Model) của Peter J. Denning, hãy giải thích ý nghĩa của các khái niệm $\Delta$, $W(t, \Delta)$, $\text{WSS}_i$ và $D$.

<details>
<summary>Đáp án</summary>

Các khái niệm cốt lõi trong **Working Set Model (1968)** gồm:
- **Cửa sổ Tập làm việc ($\Delta$ - Working Set Window)**: Tham số quy định một số lượng lượt tham chiếu bộ nhớ gần nhất (ví dụ: $\Delta = 10.000$ lệnh truy xuất) hoặc một cửa sổ thời gian gần nhất.
- **Tập làm việc ($W(t, \Delta)$ - Working Set)**: Tập hợp tất cả các trang ảo **độc nhất (Unique Pages)** mà tiến trình $i$ đã thực sự tham chiếu trong phạm vi cửa sổ $\Delta$ vừa qua.
- **Kích thước Tập làm việc ($\text{WSS}_i$ - Working Set Size)**: Số lượng trang nhớ nằm trong tập làm việc của tiến trình $i$, với $\text{WSS}_i = |W(t, \Delta)|$.
- **Tổng nhu cầu khung trang của toàn hệ thống ($D$)**: Tổng kích thước tập làm việc của tất cả $n$ tiến trình đang chạy:
  $$D = \sum_{i=1}^{n} \text{WSS}_i$$
</details>

### Câu Hỏi 5: Định lý Denning về Thrashing phát biểu điều kiện gì giữa $D$ và $M$, và hệ điều hành cần hành động ra sao khi $D > M$?

<details>
<summary>Đáp án</summary>

Gọi $M$ là tổng số khung RAM vật lý khả dụng và $D$ là tổng nhu cầu khung trang của các tiến trình:
- **Nếu $D \le M$**: Mỗi tiến trình được cấp đủ khung trang để chứa trọn vẹn Working Set của nó $\to$ tỷ lệ Page Fault rất thấp, hệ thống đạt hiệu năng tối ưu.
- **Nếu $D > M$**: RAM không đủ chứa tổng Working Set của các tiến trình $\to$ **hiện tượng Thrashing chắc chắn sẽ xảy ra**.

**Chính sách điều phối của Hệ điều hành khi $D > M$**:
- Tuyệt đối không được nạp thêm tiến trình mới.
- Chọn một tiến trình nạn nhân có độ ưu tiên thấp nhất, **đình chỉ hoàn toàn (Suspend / Swap-out toàn bộ)** và thu hồi toàn bộ khung RAM của nó để chia cho các tiến trình còn lại nhằm kéo $D \le M$.
- Chỉ khôi phục (Resume) tiến trình bị đình chỉ khi có tiến trình khác kết thúc và điều kiện $D + \text{WSS}_k \le M$ được thỏa mãn.
</details>

### Câu Hỏi 6: Trong Mô hình Tập làm việc, điều gì sẽ xảy ra nếu Cửa sổ Tập làm việc ($\Delta$) được cấu hình quá nhỏ hoặc quá lớn?

<details>
<summary>Đáp án</summary>

- **Nếu $\Delta$ quá nhỏ ($\Delta \to 0$)**: Cửa sổ thời gian quá ngắn không bao quát hết các trang nhớ thực sự cần thiết cho pha thực thi hiện tại. Tập làm việc $W(t, \Delta)$ bị thiếu trang nên hệ thống cấp phát không đủ khung RAM, dẫn đến vẫn xảy ra Page Fault liên tục và Thrashing.
- **Nếu $\Delta$ quá lớn ($\Delta \to \infty$)**: Tập làm việc $W(t, \Delta)$ sẽ ôm đồm cả những trang nhớ chỉ dùng một lần trong quá khứ (như giai đoạn khởi tạo). Kích thước $\text{WSS}$ bị phóng đại quá mức, gây lãng phí RAM và hạn chế khả năng chạy đa nhiệm của hệ thống.
</details>

### Câu Hỏi 7: Chiến lược Tần suất Lỗi Trang (Page Fault Frequency - PFF) kiểm soát Thrashing như thế nào?

<details>
<summary>Đáp án</summary>

Chiến lược **PFF** đo lường trực tiếp tần suất lỗi trang của từng tiến trình và thiết lập hai ngưỡng an toàn: **Ngưỡng trên ($U$)** và **Ngưỡng dưới ($L$)**:
- **Khi Page Fault Rate $> U$**: Tiến trình đang bị thiếu trang nhớ nghiêm trọng và có nguy cơ gây Thrashing $\to$ hệ điều hành cấp phát thêm khung RAM cho tiến trình đó.
- **Khi Page Fault Rate $< L$**: Tiến trình đang giữ quá nhiều khung RAM nhàn rỗi mà không dùng tới $\to$ hệ điều hành thu hồi bớt khung RAM của nó để cấp cho tiến trình khác.
</details>

### Câu Hỏi 8: Khi chạy lệnh `vmstat 1` trên Linux, 4 dấu hiệu nào cho thấy máy chủ đang bị Thrashing?

<details>
<summary>Đáp án</summary>

4 dấu hiệu đặc trưng của Thrashing trên đầu ra `vmstat`:
1. **Cột `b` (Blocked processes)**: Tăng vọt (ví dụ $8 - 10$ tiến trình), cho thấy nhiều tiến trình đang xếp hàng chờ I/O đĩa.
2. **Cột `si` (Swap-In) và `so` (Swap-Out)**: Cùng nhảy vọt lên hàng chục nghìn KB/s liên tục do RAM và Swap hoán đổi dữ liệu dồn dập.
3. **Cột `%wa` (I/O Wait CPU)**: Chiếm phần lớn thời gian CPU (ví dụ $94\% - 98\%$), vì CPU chủ yếu phải chờ ổ đĩa.
4. **Cột `%us` (User CPU)**: Tụt dốc xuống gần như bằng $0\%$ ($0\% - 1\%$), cho thấy các ứng dụng người dùng hầu như bị đóng băng.
</details>

### Câu Hỏi 9: Khi kiểm tra Linux PSI (Pressure Stall Information) qua `/proc/pressure/memory`, hai dòng `some` và `full` cho biết thông tin gì?

<details>
<summary>Đáp án</summary>

Linux PSI (có từ nhân Linux 4.20+) đo tỷ lệ phần trăm thời gian các tác vụ bị trễ do thiếu tài nguyên bộ nhớ:
- **`some`**: Cho biết tỷ lệ phần trăm thời gian (trong các khung `avg10`, `avg60`, `avg300` giây) mà **ít nhất một tác vụ** bị đứng hình (stalled) vì phải chờ giải phóng hoặc nạp trang nhớ.
- **`full`**: Cho biết tỷ lệ phần trăm thời gian mà **toàn bộ các CPU cores** trong hệ thống đều bị tê liệt vì không có luồng nào chạy được do thiếu RAM — đây là bằng chứng rõ ràng của hiện tượng Thrashing.
</details>

### Câu Hỏi 10: Tham số `vm.swappiness` trên Linux có phạm vi giá trị bao nhiêu, ý nghĩa kỹ thuật là gì và nên cấu hình thấp hay cao trong trường hợp nào?

<details>
<summary>Đáp án</summary>

- **Phạm vi giá trị**: Từ `0` đến `200` (giá trị mặc định trên hầu hết bản phân phối Linux hiện đại là `60`).
- **Ý nghĩa kỹ thuật**: Điều chỉnh mức độ ưu tiên giữa việc thu hồi bộ nhớ đệm tập tin (**Page Cache reclaim**) và hoán đổi bộ nhớ ẩn danh của ứng dụng (**Anonymous Memory swap**).
- **Cách lựa chọn**:
  - **Giá trị thấp (ví dụ `1` đến `10`)**: Ưu tiên giữ bộ nhớ của tiến trình trong RAM tối đa, chỉ swap khi thực sự cạn kiệt; phù hợp cho **cơ sở dữ liệu (Database)** và hệ thống cần độ trễ thấp.
  - **Giá trị cao (ví dụ `100` đến `180`)**: Tích cực đẩy bộ nhớ nhàn rỗi của ứng dụng ra swap để dành RAM làm bộ đệm I/O tập tin.
</details>

### Câu Hỏi 11: Vì sao trong các phiên bản Kubernetes truyền thống (trước K8s 1.22), kỹ sư thường được yêu cầu tắt hoàn toàn Swap (`swapoff -a`) trên Node?

<details>
<summary>Đáp án</summary>

Có hai lý do kỹ thuật chính:
1. **Tính toán tài nguyên tất định (Deterministic QoS)**: Nếu bật Swap, Kubelet không thể đo lường và cưỡng chế chính xác giới hạn bộ nhớ `resources.limits.memory` của từng Pod.
2. **Phòng ngừa Thrashing lây nhiễm chéo**: Nếu một Pod bị rò rỉ bộ nhớ (Memory Leak) và bắt đầu quẫy đạp đĩa (Thrashing), nó sẽ làm nghẽn toàn bộ bus I/O ổ cứng của máy chủ và kéo sập hiệu năng của hàng chục Pod lành mạnh khác trên cùng Node.

Do đó, tắt Swap giúp đảm bảo Pod vượt quá giới hạn RAM sẽ bị tiêu diệt cục bộ ngay (`OOMKilled`) thay vì kéo cả Node vào tình trạng Thrashing.
</details>

### Câu Hỏi 12: Cơ chế OOM Killer (Out-Of-Memory Killer) trên nhân Linux hoạt động như thế nào khi hệ thống cạn kiệt hoàn toàn RAM và không còn khả năng hoán đổi?

<details>
<summary>Đáp án</summary>

Khi tình trạng thiếu RAM kéo dài và không còn khung RAM nào để hoán đổi, nhân Linux kích hoạt **OOM Killer** như lá chắn bảo vệ cuối cùng:
- OOM Killer duyệt qua danh sách tất cả các tiến trình, kết hợp mức độ tiêu tốn RAM và tham số ưu tiên để tính điểm **`oom_score`** (từ `0` đến `1000`).
- Tiến trình có **`oom_score` cao nhất** sẽ bị kernel gửi tín hiệu **`SIGKILL` (Signal 9)** để hủy diệt ngay lập tức nhằm giải phóng RAM và cứu máy chủ khỏi bị treo cứng.
- Để bảo vệ một tiến trình tối quan trọng (như `sshd`) không bao giờ bị OOM Killer chọn tiêu diệt, có thể ghi giá trị **`-1000`** vào tệp `/proc/<PID>/oom_score_adj`.
</details>
