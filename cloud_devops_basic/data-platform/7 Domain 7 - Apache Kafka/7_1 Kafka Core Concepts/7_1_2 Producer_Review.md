# Review: 7_1_2 Producer

### Câu Hỏi 1: Kafka Producer là gì và phải giải quyết bài toán cân bằng giữa những yếu tố nào khi đẩy sự kiện vào Kafka?

<details>
<summary>Đáp án</summary>

- **Kafka Producer** là thành phần phía client thực hiện nhiệm vụ đẩy sự kiện vào Apache Kafka sau khi đã xác định partition đích.
- Khi gửi dữ liệu qua mạng, Producer phải cân bằng giữa **3 yếu tố**: độ bền dữ liệu (**durability**), độ trễ (**latency**) và thông lượng (**throughput**).
- Để điều khiển sự đánh đổi này, Producer dựa vào **3 cơ chế trụ cột**: xác nhận ghi (`acks`), thử lại chống trùng lặp (`retries` + `enable.idempotence`), và gom lô kết hợp nén dữ liệu (`batch.size`, `linger.ms`, `compression.type`).

</details>

### Câu Hỏi 2: Tham số `acks` trong Kafka Producer dùng để quy định điều gì?

<details>
<summary>Đáp án</summary>

Tham số `acks` quy định **số lượng xác nhận (acknowledgments)** mà **partition leader** phải nhận được trước khi coi một yêu cầu gửi từ Producer là hoàn tất.

</details>

### Câu Hỏi 3: Hãy phân biệt ba giá trị `acks=0`, `acks=1` và `acks=all` (`-1`) về cách xác nhận, độ trễ và độ bền dữ liệu. Từ Apache Kafka 3.0 trở đi, giá trị mặc định của `acks` là gì?

<details>
<summary>Đáp án</summary>

- **`acks=0` (Không chờ xác nhận)**:
  - Producer không chờ phản hồi từ broker mà coi bản ghi đã gửi thành công ngay sau khi đưa vào socket buffer của client.
  - **Đánh đổi**: Độ trễ thấp nhất và thông lượng cao nhất, nhưng hoàn toàn không bảo đảm độ bền dữ liệu (dễ mất tin nếu broker lỗi hoặc mất kết nối trước khi ghi xuống log). Phù hợp với metrics, clickstream hoặc telemetry chấp nhận mất mát nhỏ.
- **`acks=1` (Chỉ chờ Leader ghi xong)**:
  - Partition leader ghi bản ghi vào local log của chính nó rồi trả về xác nhận thành công ngay cho Producer mà không chờ các follower sao chép xong.
  - **Đánh đổi**: Cân bằng ở mức trung bình giữa độ trễ và độ bền, nhưng dữ liệu vẫn có thể mất nếu leader sập ngay sau khi trả ACK mà các follower chưa kịp sao chép. Phù hợp với log ứng dụng thông thường.
- **`acks=all` (hoặc `acks=-1` — Chờ toàn bộ ISR)**:
  - Leader phải chờ toàn bộ tập in-sync replicas (ISR) xác nhận đã nhận bản ghi trước khi phản hồi thành công về cho Producer.
  - **Đánh đổi**: Độ trễ cao nhất vì phải đợi đồng bộ sang các follower, nhưng mang lại mức bảo đảm độ bền dữ liệu cao nhất. Phù hợp với giao dịch tài chính, đơn hàng, thanh toán.
- **Mặc định**: Từ Apache Kafka 3.0 trở đi, giá trị mặc định của `acks` là **`all`** (thay cho mặc định `1` ở các phiên bản cũ hơn).

</details>

### Câu Hỏi 4: Vì sao trong môi trường production, chỉ cấu hình `acks=all` vẫn có thể không bảo vệ được dữ liệu nếu topic chỉ có 1 replica?

<details>
<summary>Đáp án</summary>

- Vì `acks=all` chỉ chờ các replica đang nằm trong tập **ISR** xác nhận.
- Nếu topic chỉ có **1 replica duy nhất** (không có follower dự phòng), `acks=all` không thể tự bảo vệ dữ liệu khi broker duy nhất đó bị sập.
- Do đó, ở môi trường production phải kết hợp `acks=all` với cấu hình replication và tham số `min.insync.replicas`.

</details>

### Câu Hỏi 5: Tham số `retries` dùng để làm gì, và nếu bật gửi lại đơn thuần (không có cơ chế bảo vệ) thì sẽ phát sinh hai vấn đề nghiêm trọng nào?

<details>
<summary>Đáp án</summary>

- **`retries`** cho phép Producer tự động gửi lại các batch bị lỗi tạm thời (**transient errors**, chẳng hạn mạng chập chờn hoặc leader đang trong quá trình chuyển giao) thay vì báo lỗi ngay cho ứng dụng.
- Hai vấn đề nghiêm trọng khi bật gửi lại đơn thuần:
  1. **Trùng lặp dữ liệu (Duplicates)**: Broker thực chất đã ghi bản ghi thành công nhưng gói tin xác nhận bị rớt trên đường truyền về client; khi Producer gửi lại, broker sẽ ghi thêm một bản sao nữa.
  2. **Đảo lộn thứ tự (Out-of-order)**: Khi Producer gửi nhiều batch nối tiếp nhau (pipelining), nếu batch 1 gặp lỗi và phải gửi lại sau khi batch 2 đã ghi thành công, thứ tự trong partition sẽ bị đảo ngược thành `batch 2 -> batch 1`.

</details>

### Câu Hỏi 6: Idempotent Producer (`enable.idempotence`) hoạt động như thế nào để chống trùng lặp và bảo toàn thứ tự khi retry? Mặc định từ Kafka 3.0 là gì và đi kèm các yêu cầu cấu hình nào?

<details>
<summary>Đáp án</summary>

- **Cơ chế hoạt động**: Khi bật `enable.idempotence=true`, Producer được cấp một **Producer ID (PID)** và gắn **số thứ tự (sequence number)** tăng dần cho mỗi batch trên từng partition. Nhờ đó, broker nhận biết và loại bỏ bản sao trùng lặp nếu nhận lại cùng một sequence number.
- **Bảo toàn thứ tự**: Khi bật idempotence và giữ `max.in.flight.requests.per.connection` không vượt quá `5`, Kafka vẫn bảo toàn thứ tự bản ghi trong một partition ngay cả khi có nhiều request đang bay song song và xảy ra retry.
- **Mặc định và yêu cầu đi kèm**: Từ Apache Kafka 3.0 trở đi, `enable.idempotence` mặc định là **`true`**, với các yêu cầu đi kèm là `acks=all`, `retries > 0`, và `max.in.flight.requests.per.connection <= 5`.

</details>

### Câu Hỏi 7: Mục đích của cơ chế batching trong Kafka Producer là gì, và hai tham số `batch.size` với `linger.ms` điều khiển quá trình này ra sao?

<details>
<summary>Đáp án</summary>

- **Mục đích**: Thay vì gửi từng bản ghi riêng lẻ qua mạng, Producer gom các bản ghi có cùng đích partition thành các batch trong bộ nhớ đệm của client (`RecordAccumulator`) để giảm số lần gọi mạng và tối ưu I/O.
- **`batch.size`**: Quy định kích thước tối đa (tính bằng **byte**) cho một batch trên mỗi partition; khi lượng dữ liệu gom được đạt ngưỡng này, batch sẵn sàng được gửi đi ngay.
- **`linger.ms`**: Quy định khoảng thời gian tối đa (tính bằng **mili-giây**) mà Producer chủ động chờ để gom thêm bản ghi vào cùng một batch trước khi gửi đi, ngay cả khi batch chưa đầy.

</details>

### Câu Hỏi 8: Việc tăng `batch.size` và `linger.ms` tạo ra sự đánh đổi gì giữa thông lượng (throughput) và độ trễ (latency) so với đặt `linger.ms=0`?

<details>
<summary>Đáp án</summary>

- **Lợi ích (Throughput)**: Tăng `linger.ms` và `batch.size` giúp gom được nhiều bản ghi hơn trong mỗi lần truyền, qua đó tăng thông lượng tổng thể và giảm tải cho broker.
- **Đánh đổi (Latency)**: Làm tăng độ trễ của từng bản ghi riêng lẻ vì bản ghi phải chờ thêm (tối đa theo `linger.ms` nếu batch chưa đầy), đặc biệt bất lợi ở luồng ít tin nhắn hoặc hệ thống nhạy độ trễ cần phản hồi tức thì. Ngược lại, đặt `linger.ms=0` sẽ gửi ngay lập tức khi luồng gửi rảnh.

</details>

### Câu Hỏi 9: Cơ chế nén dữ liệu (`compression.type`) hoạt động như thế nào, hỗ trợ các thuật toán nào, và tại sao nó lại kết hợp hiệu quả với batching?

<details>
<summary>Đáp án</summary>

- **Cách hoạt động**: Tham số `compression.type` cho phép Producer nén **toàn bộ payload của một batch** nhằm giảm băng thông mạng và dung lượng lưu trữ trên đĩa của broker.
- **Các thuật toán hỗ trợ**: `none`, `gzip`, `snappy`, `lz4`, `zstd`.
- **Kết hợp với batching**: Khi batch càng lớn (nhờ `batch.size` và `linger.ms`), thuật toán nén càng phát huy hiệu quả cao hơn vì nén trên nhiều bản ghi cùng lúc loại bỏ được nhiều phần dư thừa lặp lại.
- **Đánh đổi**: Tốn thêm một lượng nhỏ CPU ở phía Producer (nén) và Consumer (giải nén).

</details>

### Câu Hỏi 10: Hãy liệt kê đúng thứ tự các bước trong đường ống xử lý bên trong Kafka Producer từ lúc ứng dụng gọi `send()` tới Partition Leader Broker.

<details>
<summary>Đáp án</summary>

Đường ống xử lý bên trong Kafka Producer diễn ra theo thứ tự:
1. Ứng dụng gọi `send()`.
2. **Serializer**: Chuyển đổi Key/Value sang bytes.
3. **Partitioner**: Chọn partition đích.
4. **RecordAccumulator**: Gom batch theo từng partition (theo `batch.size`).
5. **Nén Batch** (`compression.type`): Thực hiện khi batch đầy `batch.size` hoặc hết thời gian `linger.ms`.
6. **Sender Thread**: Gắn PID + Sequence number (nếu bật `enable.idempotence`) và gửi request qua mạng tới **Partition Leader Broker**.

</details>

### Câu Hỏi 11: Tham số `delivery.timeout.ms` kiểm soát khoảng thời gian nào, và cần lưu ý gì khi tinh chỉnh `linger.ms` hoặc khi mạng chậm?

<details>
<summary>Đáp án</summary>

- `delivery.timeout.ms` là giới hạn thời gian tối đa tính từ lúc hàm `send()` trả về cho tới khi Producer báo kết quả thành công hoặc thất bại.
- Khoảng thời gian này bao gồm **cả thời gian chờ gom lô (`linger.ms`) lẫn thời gian thực hiện các lần thử lại (`retries`)**.
- **Lưu ý**: Nếu tăng `linger.ms` rất lớn hoặc mạng chậm kéo dài, cần kiểm tra để bảo đảm `delivery.timeout.ms` đủ lớn cho tổng thời gian chờ và thử lại.

</details>

### Câu Hỏi 12: Trong RabbitMQ, cơ chế nào tương đương gần nhất với `acks` của Kafka Producer? Điểm giống và khác nhau giữa hai cơ chế này là gì?

<details>
<summary>Đáp án</summary>

- Cơ chế tương đương gần nhất trong RabbitMQ là **Publisher Confirms** (broker gửi xác nhận bất đồng bộ `basic.ack` hoặc `basic.nack` về cho publisher trên channel sau khi message đã được xử lý an toàn xuống đĩa hoặc đồng bộ trên queue).
- **Điểm giống nhau**: Cả Kafka `acks` và RabbitMQ Publisher Confirms đều sinh ra để giải quyết bài toán chống mất tin âm thầm giữa client và broker, đối lập với chế độ gửi không chờ phản hồi (`acks=0` ở Kafka hay `basic.publish` không bật confirm mode ở RabbitMQ).
- **Điểm khác nhau**:
  - **Kafka `acks`**: Vận hành trên mô hình gom batch ghi nối thêm vào partition và gắn trực tiếp với cơ chế sao chép ISR (`0`, `1`, `all`).
  - **RabbitMQ Publisher Confirms**: Xác nhận theo từng message trên channel đi qua exchange để định tuyến vào queue.

</details>
