# Review: 1_5_5 Deadlock Avoidance and Bankers Algorithm

### Câu Hỏi 1: Deadlock Avoidance khác gì so với Deadlock Prevention về cách tiếp cận xử lý bế tắc?

<details>
<summary>Đáp án</summary>

- **Deadlock Prevention (Phòng ngừa bế tắc)** can thiệp bằng cách áp đặt các quy tắc tĩnh để triệt tiêu vĩnh viễn ít nhất 1 trong 4 điều kiện Coffman ngay từ đầu.
- **Deadlock Avoidance (Tránh bế tắc)** tiếp cận theo cơ chế **động (dynamic approach)**: hệ thống vẫn cho phép cả 4 điều kiện Coffman tiềm tàng xuất hiện, nhưng trước mỗi quyết định cấp phát tài nguyên, hệ điều hành sẽ tính toán mô phỏng trạng thái tương lai. Nếu việc cấp phát dẫn hệ thống vào **Unsafe State**, yêu cầu sẽ bị từ chối hoặc trì hoãn cho tới khi có đủ tài nguyên an toàn.
</details>

### Câu Hỏi 2: Ý tưởng cốt lõi của Banker's Algorithm (Thuật toán Kẻ Cho Vay) bắt nguồn từ phép so sánh thực tế nào?

<details>
<summary>Đáp án</summary>

Thuật toán do **Edsger W. Dijkstra** đề xuất vào năm 1965, lấy cảm hứng từ cách vận hành của một giám đốc ngân hàng tại thị trấn nhỏ:
- Ngân hàng có lượng tiền mặt dự trữ hữu hạn (**Available**).
- Các khách hàng (tiến trình) phải tuyên bố trước hạn mức tín dụng tối đa cần dùng để hoàn thành dự án (**Max**).
- Giám đốc không bao giờ giải ngân vượt quá mức khiến ngân hàng không còn đủ tiền mặt để giúp ít nhất một khách hàng hoàn thành trọn vẹn dự án và trả lại toàn bộ tiền vay, từ đó lần lượt thu hồi vốn để hỗ trợ các khách hàng tiếp theo.
</details>

### Câu Hỏi 3: Cơ chế Deadlock Avoidance cho hệ thống tài nguyên đơn cá thể (Single-Instance) và đa cá thể (Multi-Instance) khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

1. **Hệ thống tài nguyên đơn cá thể (Single-Instance)**:
   - Mở rộng **Đồ Thị Phân Bổ Tài Nguyên (RAG)** bằng cách thêm **Cạnh tuyên bố (Claim Edge)** nét đứt $P_i \dashrightarrow R_j$.
   - Khi tiến trình yêu cầu tài nguyên, cạnh nét đứt chuyển thành cạnh yêu cầu nét liền $P_i \to R_j$ và chỉ được chấp thuận chuyển thành cạnh phân bổ $R_j \to P_i$ khi thao tác đảo chiều **không tạo ra bất kỳ chu trình nào** trong đồ thị.
   - Độ phức tạp kiểm tra chu trình là $O(n^2)$ với $n$ là số tiến trình.
2. **Hệ thống tài nguyên đa cá thể (Multi-Instance)**:
   - Kiểm tra chu trình thuần túy trên RAG không còn đủ vì một chu trình không đồng nghĩa với Deadlock.
   - Phải áp dụng **Banker's Algorithm** thông qua các ma trận và vector số lượng, với độ phức tạp thời gian là $O(m \cdot n^2)$ (với $n$ tiến trình và $m$ kiểu tài nguyên).
</details>

### Câu Hỏi 4: Banker's Algorithm sử dụng 4 cấu trúc dữ liệu hình thức nào để theo dõi trạng thái hệ thống, và công thức liên hệ của $Need$ là gì?

<details>
<summary>Đáp án</summary>

Với $n$ tiến trình và $m$ kiểu tài nguyên, Banker's Algorithm sử dụng:
1. **$Available[m]$**: Vector 1 chiều cho biết số lượng cá thể của từng kiểu tài nguyên $R_j$ hiện đang sẵn sàng cấp phát.
2. **$Max[n][m]$**: Ma trận 2 chiều biểu thị số cá thể tối đa của mỗi tài nguyên mà từng tiến trình $P_i$ tuyên bố sẽ cần trong toàn bộ vòng đời.
3. **$Allocation[n][m]$**: Ma trận 2 chiều biểu thị số cá thể tài nguyên mà từng tiến trình $P_i$ hiện đang thực sự nắm giữ.
4. **$Need[n][m]$**: Ma trận 2 chiều biểu thị số lượng tài nguyên mà $P_i$ vẫn còn cần được cấp thêm để hoàn tất công việc, được tính theo công thức bất biến:
   $$Need[i][j] = Max[i][j] - Allocation[i][j]$$
</details>

### Câu Hỏi 5: Thế nào là Safe State, Safe Sequence và Unsafe State? Trạng thái Unsafe State có đồng nghĩa với Deadlock không?

<details>
<summary>Đáp án</summary>

- **Safe State (Trạng thái an toàn)**: Trạng thái mà hệ thống có thể phân bổ tài nguyên cho từng tiến trình lên tới mức $Max$ theo một trình tự nào đó mà không dẫn đến Deadlock, tức là tồn tại ít nhất một **Safe Sequence**.
- **Safe Sequence (Chuỗi an toàn)**: Thứ tự thực thi $\langle P_0, P_1, \dots, P_{n-1} \rangle$ sao cho với mỗi $P_i$, nhu cầu còn lại $Need_i$ được đáp ứng bởi lượng tài nguyên đang khả dụng ($Available$) cộng với toàn bộ tài nguyên đang được nắm giữ bởi các tiến trình đứng trước nó ($P_k$ với $k < i$).
- **Unsafe State (Trạng thái không an toàn)**: Trạng thái mà hệ thống **không tìm thấy bất kỳ chuỗi an toàn nào**.
- **Unsafe State KHÔNG đồng nghĩa với Deadlock**: Hệ thống ở trạng thái Unsafe chưa chắc đã bị bế tắc ngay lập tức (nếu các tiến trình nhả tài nguyên sớm hoặc không đòi đến mức $Max$). Tuy nhiên, nếu ở trạng thái Unsafe mà các tiến trình đồng loạt gửi yêu cầu tới mức tối đa $Max$ đã tuyên bố, hệ thống chắc chắn sẽ rơi vào Deadlock.
</details>

### Câu Hỏi 6: Thuật toán An Toàn (Safety Algorithm) kiểm tra một trạng thái có phải là Safe State hay không qua các bước nào?

<details>
<summary>Đáp án</summary>

1. **Khởi tạo**: $Work = Available$ và $Finish[i] = \text{false}$ với mọi tiến trình $i = 0, 1, \dots, n-1$.
2. **Tìm kiếm**: Tìm một chỉ số $i$ thỏa mãn đồng thời hai điều kiện:
   - $Finish[i] == \text{false}$
   - $Need_i \le Work$ (với mọi kiểu tài nguyên).  
   Nếu không tìm thấy chỉ số $i$ nào như vậy, chuyển sang Bước 4.
3. **Cập nhật giả định**: Nếu tìm thấy $i$, giả định $P_i$ hoàn tất và trả lại tài nguyên:
   - $Work = Work + Allocation_i$
   - $Finish[i] = \text{true}$
   - Quay lại Bước 2 để tìm tiến trình tiếp theo.
4. **Kết luận**: Nếu $Finish[i] == \text{true}$ với mọi $i$, hệ thống đang ở **Safe State**; ngược lại, hệ thống ở **Unsafe State**.
</details>

### Câu Hỏi 7: Khi một tiến trình $P_i$ gửi yêu cầu $Request_i$, Thuật toán Yêu Cầu Tài Nguyên (Resource-Request Algorithm) thực hiện những bước kiểm tra nào trước khi quyết định cấp phát?

<details>
<summary>Đáp án</summary>

1. **Kiểm tra giới hạn $Need$**: Nếu $Request_i \le Need_i$ thì sang Bước 2; ngược lại báo lỗi vì tiến trình yêu cầu vượt quá mức $Max$ đã tuyên bố.
2. **Kiểm tra tài nguyên khả dụng $Available$**: Nếu $Request_i \le Available$ thì sang Bước 3; ngược lại $P_i$ buộc phải chờ đợi (Wait) vì hệ thống tạm thời chưa đủ tài nguyên.
3. **Cấp phát giả định (Trial Allocation)**:
   - $Available' = Available - Request_i$
   - $Allocation_i' = Allocation_i + Request_i$
   - $Need_i' = Need_i - Request_i$
4. **Chạy Safety Algorithm trên trạng thái giả định**:
   - Nếu kết quả là **Safe**: Yêu cầu được chính thức chấp thuận (**Granted**).
   - Nếu kết quả là **Unsafe**: Hủy bỏ trạng thái giả định (**Rollback**), khôi phục nguyên trạng ban đầu và bắt $P_i$ phải tiếp tục chờ đợi (**Wait**).
</details>

### Câu Hỏi 8: Trong ví dụ thực hành và mã nguồn C của bài học, tại sao yêu cầu $Request_1 = (1, 0, 2)$ của $P_1$ được chấp thuận, còn yêu cầu $Request_4 = (3, 3, 0)$ của $P_4$ sau đó lại buộc phải chờ?

<details>
<summary>Đáp án</summary>

- **Đối với $P_1$ xin $(1, 0, 2)$**: Ban đầu $Available = (3, 3, 2)$ và $Need_1 = (1, 2, 2)$, nên yêu cầu thỏa mãn cả $Request_1 \le Need_1$ và $Request_1 \le Available$. Sau khi cấp phát giả định ($Available' = (2, 3, 0)$, $Allocation_1' = (3, 0, 2)$, $Need_1' = (0, 2, 0)$), hệ thống vẫn tìm được chuỗi an toàn $\langle P_1, P_3, P_4, P_0, P_2 \rangle$ nên yêu cầu được **chấp thuận (Granted)**.
- **Đối với $P_4$ xin $(3, 3, 0)$**: Sau khi đã cấp phát cho $P_1$, lượng tài nguyên khả dụng chỉ còn $Available = (2, 3, 0)$. Vì $Request_4(3, 3, 0) > Available(2, 3, 0)$ ở kiểu tài nguyên $A$ ($3 > 2$), kiểm tra Bước 2 không đạt nên $P_4$ buộc phải **chờ (Wait)** do hệ thống không đủ tài nguyên khả dụng.
</details>

### Câu Hỏi 9: Vì sao Banker's Algorithm hiếm khi được áp dụng trực tiếp trong nhân của các hệ điều hành (OS Kernel) hiện đại như Linux, Windows hay macOS?

<details>
<summary>Đáp án</summary>

Do 3 hạn chế nghiêm trọng trong môi trường thực tế:
1. **Phải biết trước nhu cầu tối đa ($Max$)**: Hầu hết các ứng dụng người dùng không thể biết trước chính xác số lượng file, socket hay dung lượng bộ nhớ tối đa sẽ sử dụng trong tương lai.
2. **Số lượng tiến trình và tài nguyên biến động liên tục**: Tiến trình ($n$) liên tục được tạo ra (`fork`) hoặc kết thúc (`exit`), còn thiết bị phần cứng có thể tháo lắp nóng (hot-plug), khiến kích thước các ma trận thay đổi không ngừng.
3. **Chi phí tính toán cao (Algorithmic Overhead)**: Thuật toán kiểm tra an toàn có độ phức tạp $O(m \times n^2)$. Chạy thuật toán này ở mỗi system call xin cấp phát tài nguyên khi hệ thống có hàng nghìn luồng và hàng trăm tài nguyên sẽ gây nghẽn CPU nghiêm trọng.
</details>

### Câu Hỏi 10: Tư tưởng của Banker's Algorithm được ứng dụng thực tế như thế nào trong các hệ thống Cloud & DevOps?

<details>
<summary>Đáp án</summary>

Tư tưởng phân bổ và dự phòng để giữ hệ thống trong vùng an toàn được áp dụng ở tầng trừu tượng cao hơn:
- **Kubernetes Pod Resource Requests & Limits**: K8s Scheduler phân bổ Pod lên Node dựa trên `requests` (tương đương $Need$) và `limits` (tương đương $Max$), từ chối schedule Pod lên Node nếu tổng `requests` vượt năng lực thực tế của Node để tránh tình trạng Node OOM.
- **Database Connection Pooling (HikariCP / PgBouncer)**: Giám sát số lượng kết nối đang giữ và thiết lập `maxPoolSize` kết hợp `connectionTimeout` để tránh tình trạng tất cả luồng cùng giữ một phần kết nối mà không hoàn thành được câu lệnh SQL.
- **Cloud Capacity Reservation (AWS EC2 / Azure On-Demand Capacity Reservations)**: Doanh nghiệp đăng ký trước hạn mức tài nguyên cho các đợt cao điểm (như Black Friday) để nhà cung cấp đám mây đảm bảo hệ thống luôn duy trì trong Safe State.
</details>
