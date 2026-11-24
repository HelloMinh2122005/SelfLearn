# Review: 7_1_1 Data Model Topic Partition Offset

### Câu Hỏi 1: Apache Kafka lưu trữ dữ liệu khác với hệ thống hàng đợi truyền thống như thế nào và cơ chế này mang lại lợi ích gì?

<details>
<summary>Đáp án</summary>

Trong các hệ thống hàng đợi truyền thống, dữ liệu sau khi được người nhận đọc xong thường bị xóa ngay lập tức. Ngược lại, Apache Kafka lưu trữ dữ liệu như một cuốn nhật ký ghi nối thêm bất biến (append-only commit log) và giữ dữ liệu theo thời gian lưu giữ (retention) được cấu hình trên từng topic, bất kể đã có bên đọc hay chưa. Nhờ tách biệt việc ghi và đọc theo mô hình này, nhiều hệ thống có thể cùng đọc độc lập tại các thời điểm khác nhau, đồng thời Kafka vừa đạt thông lượng cao vừa giữ được tính bền vững của dữ liệu.

</details>

### Câu Hỏi 2: Một record (event) trong Kafka gồm những thành phần nào và vai trò của từng thành phần là gì?

<details>
<summary>Đáp án</summary>

Một record (hoặc event) là đơn vị dữ liệu nhỏ nhất được gửi vào Kafka, gồm 4 thành phần:

- **`value` (Giá trị / Nội dung chính)**: Chứa dữ liệu nghiệp vụ thực tế (ví dụ chuỗi JSON của một đơn hàng).
- **`key` (Khóa — tùy chọn)**: Định danh đối tượng liên quan đến sự kiện (ví dụ mã khách hàng) nhằm nhóm các sự kiện liên quan về cùng một partition và giữ đúng thứ tự.
- **`timestamp` (Dấu thời gian)**: Ghi lại thời điểm phát sinh của sự kiện.
- **`headers` (Tiêu đề siêu dữ liệu — tùy chọn)**: Các cặp khóa-giá trị bổ sung (như `trace-id`, phiên bản schema) giúp đính kèm thông tin điều khiển mà không làm thay đổi phần `value`.

</details>

### Câu Hỏi 3: Topic trong Kafka là gì và tại sao Kafka lại chia một topic thành nhiều partition?

<details>
<summary>Đáp án</summary>

**Topic** là nơi tổ chức và lưu trữ bền vững các sự kiện cùng loại (tương tự như thư mục trong hệ thống tệp, còn các sự kiện bên trong là những tệp tin). Một topic luôn hỗ trợ đa nguồn ghi và đa nguồn đọc (multi-producer, multi-subscriber).

Kafka chia mỗi topic thành nhiều **partition** (phân vùng) nằm rải rác trên các Kafka broker khác nhau để không bị giới hạn bởi dung lượng và năng lực xử lý của một máy chủ đơn lẻ. Nhờ vậy, một topic có thể lưu trữ khối lượng dữ liệu lớn hơn sức chứa của một máy chủ duy nhất, miễn là mỗi partition đơn lẻ nằm vừa trên máy chủ lưu nó.

</details>

### Câu Hỏi 4: Mỗi partition có tính chất gì và dữ liệu mới được ghi vào partition như thế nào?

<details>
<summary>Đáp án</summary>

Mỗi partition là một chuỗi record có thứ tự và bất biến (immutable), hoạt động giống như một nhật ký ghi tuần tự (structured commit log). Khi một sự kiện mới được gửi tới topic, nó được ghi nối thêm vào cuối (append-only) của một trong các partition thuộc topic đó, không ghi đè hay chèn vào giữa.

</details>

### Câu Hỏi 5: Offset trong Kafka là gì và vị trí đầy đủ của một record được xác định như thế nào?

<details>
<summary>Đáp án</summary>

**Offset** là một số nguyên tăng dần tuần tự được gán cho mỗi record khi ghi vào một partition, dùng để định danh duy nhất record đó **bên trong partition ấy**.

Offset không phải là mã định danh toàn cục (global ID) cho toàn bộ topic, vì hai partition khác nhau trong cùng một topic đều bắt đầu đánh số offset từ `0` một cách độc lập. Do đó, vị trí đầy đủ của một record được xác định theo bộ ba `(topic, partition, offset)`.

</details>

### Câu Hỏi 6: Ai là bên kiểm soát offset khi đọc dữ liệu và điều này cho phép consumer làm được gì?

<details>
<summary>Đáp án</summary>

Ứng dụng đọc (**consumer**) là bên tự theo dõi **offset hiện tại** — tức vị trí của record tiếp theo mà nó sẽ đọc trong từng partition. Thông thường consumer tăng offset tuyến tính sau mỗi lần đọc, nhưng vì offset do consumer kiểm soát nên nó có thể quay lại offset cũ hơn để xử lý lại dữ liệu lịch sử khi cần (miễn là dữ liệu vẫn nằm trong khoảng thời gian retention của topic).

</details>

### Câu Hỏi 7: Kafka đảm bảo thứ tự của các record ở phạm vi nào?

<details>
<summary>Đáp án</summary>

Kafka chỉ đảm bảo thứ tự toàn phần (total order) của các record **bên trong một partition đơn lẻ** — bất kỳ consumer nào đọc từ một partition cụ thể đều nhận được các sự kiện theo đúng trình tự đã được ghi vào partition đó. Kafka hoàn toàn **không** đảm bảo thứ tự giữa các partition khác nhau trong cùng một topic.

</details>

### Câu Hỏi 8: Vì sao partition được gọi là đơn vị xử lý song song (unit of parallelism) và điều gì xảy ra nếu số consumer trong một Consumer Group nhiều hơn số partition?

<details>
<summary>Đáp án</summary>

Khi nhiều consumer cùng tham gia một **Consumer Group** để chia việc đọc một topic, tại một thời điểm mỗi partition chỉ được giao cho tối đa một consumer trong nhóm đó xử lý. Vì vậy, partition đóng vai trò là đơn vị xử lý song song, và số consumer làm việc hiệu quả không thể vượt quá số partition. Nếu số consumer nhiều hơn số partition, các consumer dư ra sẽ ở trạng thái nhàn rỗi (idle), không được gán partition nào và gây lãng phí tài nguyên.

</details>

### Câu Hỏi 9: Khi gửi record có `key` (khác `null`) và không có `key`, bộ phân vùng mặc định của Kafka chọn partition đích như thế nào?

<details>
<summary>Đáp án</summary>

- **Khi record có `key` (khác `null`)** và producer không chỉ định sẵn số partition đích: bộ phân vùng mặc định của Kafka sẽ băm giá trị `key` rồi chia lấy dư cho tổng số partition (`hash(key) % numPartitions`) để chọn partition đích. Nhờ công thức tất định này, mọi sự kiện có cùng `key` luôn được ghi vào cùng một partition và giữ được đúng thứ tự thời gian.
- **Khi record không có `key`**: Kafka sẽ phân phối dữ liệu sang các partition khác nhau để cân bằng tải ghi và đọc.

</details>

### Câu Hỏi 10: Việc tăng hoặc giảm số partition trên một topic đang hoạt động có những hạn chế và rủi ro gì?

<details>
<summary>Đáp án</summary>

- **Khi tăng số partition trên topic đang dùng `key`**: Tổng số partition thay đổi làm thay đổi kết quả công thức `hash(key) % numPartitions`, khiến các sự kiện mới của cùng một `key` có thể rơi sang partition khác. Vì Kafka không tự động di chuyển hay sắp xếp lại các record cũ đã lưu trước đó, thứ tự xử lý giữa sự kiện cũ và sự kiện mới của cùng một `key` có thể bị xáo trộn.
- **Khi muốn giảm số partition**: Kafka **không hỗ trợ** giảm số lượng partition của một topic đã tồn tại.

</details>

### Câu Hỏi 11: Lệch tải dữ liệu (Hot Partition) xảy ra khi nào và thực hành tốt để phòng tránh là gì?

<details>
<summary>Đáp án</summary>

**Hot Partition** xảy ra khi chọn `key` phân tán kém, khiến đa số sự kiện dùng chung một vài `key` phổ biến (ví dụ dùng mã quốc gia trong khi phần lớn người dùng ở một nước). Khi đó, toàn bộ lưu lượng của `key` phổ biến đó sẽ dồn vào một partition duy nhất trong khi các partition khác gần như trống.

*Thực hành tốt*: Chọn `key` có độ phân giải đủ cao (high cardinality), như `userId` hoặc `orderId`, chỉ ở mức cần thiết để giữ thứ tự nghiệp vụ.

</details>

### Câu Hỏi 12: Trong bộ công cụ CLI của Apache Kafka 3.x, các lệnh `kafka-topics.sh`, `kafka-console-producer.sh` và `kafka-console-consumer.sh` dùng để làm gì khi làm việc với topic, key, partition và offset?

<details>
<summary>Đáp án</summary>

- **`kafka-topics.sh`**: Dùng cờ `--create` (kèm `--topic`, `--partitions`, `--replication-factor`, `--bootstrap-server`) để tạo topic mới với số partition chỉ định, và cờ `--describe` để xem thông tin chi tiết từng partition của topic.
- **`kafka-console-producer.sh`**: Dùng để gửi dữ liệu văn bản từ terminal vào topic; khi bật `--property parse.key=true` và `--property key.separator=:` sẽ tách được phần `key` và `value` trên mỗi dòng nhập vào.
- **`kafka-console-consumer.sh`**: Dùng để đọc dữ liệu từ topic; kết hợp `--from-beginning` để đọc từ offset `0` của tất cả partition và các tùy chọn `--property print.partition=true`, `--property print.offset=true`, `--property print.key=true` để in rõ số hiệu partition, offset và key của từng record.

</details>
