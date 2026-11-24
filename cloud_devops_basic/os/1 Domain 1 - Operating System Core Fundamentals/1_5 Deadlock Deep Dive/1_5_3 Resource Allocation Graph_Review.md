# Review: 1_5_3 Resource Allocation Graph

### Câu Hỏi 1: Đồ thị Phân bổ Tài nguyên (Resource Allocation Graph - RAG) có cấu trúc hình thức như thế nào và gồm những tập đỉnh nào?

<details>
<summary>Đáp án</summary>

Đồ thị Phân bổ Tài nguyên (RAG) — do Richard C. Holt công bố năm 1972 — là một **đồ thị hai phía có hướng (Directed Bipartite Graph)** ký hiệu là $G = (V, E)$.

Tập đỉnh $V$ được phân tách thành hai tập con rời rạc hoàn toàn:
1. **Tập hợp tiến trình (Processes)**: $P = \{P_1, P_2, \dots, P_n\}$, đại diện cho các luồng hoặc tiến trình đang thực thi đồng thời trong hệ thống (ký hiệu bằng **hình tròn**).
2. **Tập hợp kiểu tài nguyên (Resource Types)**: $R = \{R_1, R_2, \dots, R_m\}$, đại diện cho các loại tài nguyên như CPU, Mutex, bộ nhớ, socket hoặc thiết bị I/O (ký hiệu bằng **hình chữ nhật**, bên trong có các dấu chấm biểu thị số lượng cá thể — **instances / units** khả dụng của tài nguyên đó).
</details>

### Câu Hỏi 2: Hai loại cạnh có hướng trong tập cạnh $E$ của RAG là gì và chúng biểu thị trạng thái nào?

<details>
<summary>Đáp án</summary>

Tập cạnh có hướng $E$ trong RAG gồm hai loại:
1. **Cạnh yêu cầu (Request Edge)** — ký hiệu $P_i \longrightarrow R_j$: Là cung có hướng đi từ tiến trình $P_i$ tới ô tài nguyên $R_j$, biểu thị tiến trình $P_i$ đã yêu cầu xin cấp phát một đơn vị tài nguyên $R_j$ và hiện đang bị hệ điều hành chặn (Blocked/Sleeping) để chờ tài nguyên này.
2. **Cạnh phân bổ (Assignment Edge / Allocation Edge)** — ký hiệu $R_j \longrightarrow P_i$: Là cung có hướng đi từ một chấm cá thể cụ thể bên trong ô tài nguyên $R_j$ tới tiến trình $P_i$, biểu thị một đơn vị của tài nguyên $R_j$ đã được cấp phát thành công và đang được $P_i$ nắm giữ độc quyền.
</details>

### Câu Hỏi 3: Theo Định lý Holt 1, mối quan hệ giữa chu trình trong RAG và trạng thái Deadlock đối với hệ thống tài nguyên đơn vị (Single-Unit Resources) là gì?

<details>
<summary>Đáp án</summary>

Trong hệ thống tài nguyên đơn vị (mỗi kiểu tài nguyên chỉ có **duy nhất 1 cá thể**), sự tồn tại của chu trình có hướng trong RAG là **điều kiện CẦN và ĐỦ (Necessary and Sufficient Condition)** của Deadlock:
- Nếu đồ thị **không có chu trình**: Hệ thống an toàn tuyệt đối (không có Deadlock).
- Nếu xuất hiện **dù chỉ 1 chu trình**: Hệ thống chắc chắn bị Deadlock, và toàn bộ các tiến trình tham gia chu trình đó đều bị bế tắc.
</details>

### Câu Hỏi 4: Đối với hệ thống tài nguyên đa đơn vị (Multi-Unit Resources), tại sao sự tồn tại của chu trình trong RAG chỉ là điều kiện cần chứ chưa đủ để kết luận Deadlock?

<details>
<summary>Đáp án</summary>

Theo Định lý Holt 2, trong hệ thống có một hoặc nhiều kiểu tài nguyên sở hữu **từ 2 cá thể trở lên**, chu trình chỉ là **điều kiện CẦN chứ CHƯA ĐỦ (Necessary but NOT Sufficient Condition)**:
- Nếu hệ thống bị Deadlock thì chắc chắn tồn tại chu trình trong RAG.
- Nhưng tồn tại chu trình trong RAG **không đồng nghĩa** hệ thống chắc chắn bị Deadlock.

**Lý do**: Một cá thể khác của cùng kiểu tài nguyên nằm trong chu trình có thể đang được nắm giữ bởi một tiến trình **nằm ngoài chu trình** (không bị chặn). Khi tiến trình bên ngoài này hoàn thành công việc và giải phóng cá thể tài nguyên đó, tài nguyên sẽ được cấp phát cho tiến trình đang chờ trong chu trình, giúp phá vỡ bế tắc.
</details>

### Câu Hỏi 5: Đồ thị Chờ (Wait-For Graph - WFG) được xây dựng từ RAG khi nào và bằng cách nào?

<details>
<summary>Đáp án</summary>

Đồ thị RAG chỉ có thể được rút gọn thành **Wait-For Graph (WFG)** khi **tất cả các kiểu tài nguyên trong hệ thống đều là tài nguyên đơn vị (Single-Unit / Single-Instance)**.

Cách chuyển đổi từ RAG sang WFG:
- Loại bỏ hoàn toàn các nút tài nguyên ($R_j$), chỉ giữ lại các nút tiến trình ($P_i$).
- Vẽ cạnh có hướng trực tiếp $P_i \longrightarrow P_k$ nếu và chỉ nếu tiến trình $P_i$ đang chờ một tài nguyên mà tiến trình $P_k$ đang nắm giữ.

Việc chuyển đổi này giúp giảm số lượng đỉnh từ $|P| + |R|$ xuống còn $|P|$, làm ma trận kề gọn hơn và tăng hiệu năng phát hiện chu trình.
</details>

### Câu Hỏi 6: Thuật toán nào được dùng để phát hiện Deadlock trên Wait-For Graph (WFG) và độ phức tạp thời gian của nó là bao nhiêu?

<details>
<summary>Đáp án</summary>

Trên WFG (khi tất cả tài nguyên là Single-Unit), việc phát hiện Deadlock quy về bài toán tìm chu trình trên đồ thị có hướng bằng thuật toán **Duyệt Theo Chiều Sâu (Depth-First Search - DFS)**.

Độ phức tạp thời gian của thuật toán là **$O(V + E)$**, hoặc **$O(V^2)$** khi biểu diễn đồ thị bằng ma trận kề.
</details>

### Câu Hỏi 7: Trong thuật toán DFS phát hiện chu trình sử dụng 3 màu (`WHITE`, `GRAY`, `BLACK`), ý nghĩa của từng màu và dấu hiệu nhận biết chu trình Deadlock là gì?

<details>
<summary>Đáp án</summary>

Ba trạng thái màu đỉnh trong thuật toán DFS gồm:
- `WHITE` (0): Đỉnh chưa được ghé thăm.
- `GRAY` (1): Đỉnh đang nằm trong ngăn xếp đệ quy hiện tại (Active on Call Stack).
- `BLACK` (2): Đỉnh đã được duyệt xong toàn bộ nhánh con và không có chu trình.

**Dấu hiệu nhận biết Deadlock**: Trong quá trình duyệt từ một đỉnh `u`, nếu gặp đỉnh kề `v` đang có trạng thái `GRAY`, điều đó chứng tỏ đã phát hiện **Cạnh Ngược (Back-edge)** $\to$ tồn tại chu trình khép kín $\iff$ hệ thống đang bị Deadlock.
</details>

### Câu Hỏi 8: Thuật toán Rút Gọn Đồ Thị (Graph Reduction) của Holt hoạt động như thế nào và kết quả "rút gọn hoàn toàn" (Completely Reducible) cho biết điều gì?

<details>
<summary>Đáp án</summary>

Thuật toán Rút Gọn Đồ Thị (Graph Reduction) hoạt động bằng cách liên tục tìm các tiến trình **không bị chặn** (không có cạnh yêu cầu nào đi ra), giả định tiến trình đó sẽ chạy xong rồi xóa bỏ toàn bộ các cạnh phân bổ tài nguyên của nó để trả tài nguyên về hệ thống. Quá trình này lặp lại cho đến khi không còn tiến trình nào rút gọn được nữa.

- Nếu đồ thị **có thể rút gọn hoàn toàn (Completely Reducible)** — tức tất cả tiến trình đều lần lượt hoàn tất và đồ thị không còn cạnh nào — điều đó chứng minh **hệ thống hoàn toàn KHÔNG CÓ DEADLOCK**.
- Ngược lại, nếu còn lại một tập hợp tiến trình không thể rút gọn, chính tập hợp đó đang bị Deadlock.
</details>

### Câu Hỏi 9: Cạm bẫy báo động giả (False Positive Alerts) xảy ra khi nào và biện pháp chuẩn mực để khắc phục là gì?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy**: Xảy ra khi công cụ giám sát chỉ dùng thuật toán phát hiện chu trình thuần túy trên hệ thống **tài nguyên đa đơn vị** (ví dụ Connection Pool hoặc Thread Pool) rồi lập tức phát cảnh báo hoặc kill tiến trình ngay khi thấy chu trình.
- **Nguyên nhân**: Trong hệ đa đơn vị, chu trình chưa chắc là Deadlock vì các luồng khác ngoài chu trình vẫn có thể trả tài nguyên về pool, giúp chu trình tự tan biến. Kill nhầm tiến trình sẽ gây lỗi mất dữ liệu không đáng có.
- **Biện pháp chuẩn mực (Best Practice)**: Với tài nguyên đa đơn vị, cần dùng thuật toán kiểm tra an toàn toàn diện như **Banker's Algorithm** hoặc thuật toán **Graph Reduction** của Holt thay vì chỉ kiểm tra chu trình thuần túy.
</details>

### Câu Hỏi 10: Tại sao không nên chạy thuật toán DFS phát hiện chu trình trên mỗi thao tác xin khóa, và cách triển khai tối ưu trong thực tế là gì?

<details>
<summary>Đáp án</summary>

- **Lý do (Detection Overhead)**: Nếu kích hoạt thuật toán xây dựng và duyệt WFG bằng DFS ở mỗi thao tác xin khóa (`mutex_lock` hoặc `lock_acquire`) trên hệ thống có lưu lượng lớn (như 50.000 requests/giây), CPU sẽ bị tiêu tốn nặng nề cho chính thuật toán giám sát, làm tụt giảm nghiêm trọng throughput của ứng dụng.
- **Biện pháp chuẩn mực (Best Practice)**:
  - Chỉ kích hoạt thuật toán phát hiện chu trình theo **chu kỳ thời gian định kỳ (Periodic Detection)**, ví dụ 10 giây/lần.
  - Hoặc chỉ kích hoạt khi phát hiện có luồng bị chặn (blocked) vượt quá một **ngưỡng thời gian chờ bất thường (Deadlock Timeout Threshold)**, ví dụ bị kẹt quá 1 giây.
</details>
