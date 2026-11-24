# Review: 7_2_1 Admin CLI Tools

### Câu Hỏi 1: Các script CLI quản trị nằm ở đâu trong bản phân phối chuẩn của Apache Kafka, và khi chạy trên container hoặc Kubernetes thì cách gọi lệnh có gì khác?

<details>
<summary>Đáp án</summary>

- Trong bản phân phối chuẩn của Apache Kafka, các script CLI nằm trong thư mục `bin/` (mang hậu tố `.sh` trên Linux/macOS; riêng trên Windows là các file `.bat` trong thư mục `bin/windows/`).
- Khi triển khai qua container hoặc Kubernetes (chẳng hạn Strimzi), đường dẫn thư mục hoặc cách gọi lệnh có thể khác: bạn có thể gọi trực tiếp tên lệnh nếu script đã được gắn vào `PATH`, hoặc chạy thông qua `kubectl exec` vào bên trong pod Kafka.

</details>

### Câu Hỏi 2: Từ phiên bản Apache Kafka 3.0 trở đi, `kafka-topics.sh` kết nối tới cluster bằng tham số nào thay cho tham số cũ nào, và sự thay đổi này mang lại lợi ích gì?

<details>
<summary>Đáp án</summary>

- Từ Kafka 3.0 trở đi, `kafka-topics.sh` kết nối trực tiếp tới broker thông qua tham số `--bootstrap-server`, còn cờ `--zookeeper` cũ đã bị loại bỏ.
- Cách tiếp cận qua `--bootstrap-server` giúp toàn bộ công cụ quản trị đi qua cùng một giao thức mạng của Kafka broker thay vì truy cập trực tiếp vào lớp lưu trữ điều phối cũ.

</details>

### Câu Hỏi 3: Năm công cụ CLI cốt lõi trong bài học gồm những công cụ nào và vai trò chính của từng công cụ là gì?

<details>
<summary>Đáp án</summary>

1. `kafka-topics.sh`: Quản lý vòng đời topic và partition (`--create`, `--list`, `--describe`, `--alter`, `--delete`).
2. `kafka-configs.sh`: Xem (`--describe`) và cập nhật động (`--alter` với `--add-config` hoặc `--delete-config`) cấu hình của các thực thể (`--entity-type`) như `topics` hoặc `brokers`.
3. `kafka-consumer-groups.sh`: Liệt kê (`--list`), xem trạng thái và tiến độ đọc của nhóm consumer (`--describe --group`), xóa nhóm (`--delete`) hoặc đặt lại vị trí đọc (`--reset-offsets`).
4. `kafka-console-producer.sh`: Đọc từng dòng văn bản từ luồng nhập chuẩn (`stdin`) và gửi thành message thử vào topic chỉ định.
5. `kafka-console-consumer.sh`: Đọc message từ topic ra màn hình để kiểm tra nhanh dữ liệu.

</details>

### Câu Hỏi 4: Khi tạo topic mới với `kafka-topics.sh --create`, bạn cần cung cấp những tham số nào? Khi mở rộng topic bằng `--alter`, Kafka có giới hạn gì về số lượng partition và cần lưu ý rủi ro nào?

<details>
<summary>Đáp án</summary>

- Khi tạo topic mới, bạn cần cung cấp: tên topic (`--topic`), số lượng phân mảnh (`--partitions`) và hệ số sao lưu (`--replication-factor`).
- Với `--alter`, bạn có thể tăng số lượng partition (`--partitions <số_mới>`), nhưng **Kafka không hỗ trợ giảm số partition** của một topic đã tồn tại.
- Lưu ý rủi ro khi tăng partition quá tay: nhiều partition thừa sẽ làm tăng số lượng file handle, mức tiêu thụ bộ nhớ và thời gian bầu leader; đồng thời với topic đang dùng key, việc tăng partition sẽ làm thay đổi hàm băm phân phối các key mới vào partition khác so với dữ liệu cũ.

</details>

### Câu Hỏi 5: Khi chạy `kafka-topics.sh --describe --topic <tên>`, dòng tổng quan ở đầu và các trường `Partition`, `Leader`, `Replicas`, `Isr` ở các dòng bên dưới thể hiện thông tin gì?

<details>
<summary>Đáp án</summary>

- **Dòng tổng quan ở đầu**: Cho biết `Topic`, `PartitionCount` (tổng số partition), `ReplicationFactor` (số bản sao mỗi partition) và `Configs` (các cấu hình topic đã được ghi đè khác với mặc định).
- **`Partition`**: Chỉ số thứ tự của phân mảnh, đánh số bắt đầu từ `0`.
- **`Leader`**: Broker ID đang giữ vai trò chính, trực tiếp tiếp nhận mọi thao tác đọc và ghi cho partition đó (nếu hiển thị `none`, partition đang mất leader và tạm thời không phục vụ được).
- **`Replicas`**: Danh sách các broker ID lưu giữ bản sao của partition đó, sắp xếp theo thứ tự mà broker đầu tiên là bản sao ưu tiên (preferred replica).
- **`Isr` (In-Sync Replicas)**: Tập con của `Replicas`, chỉ gồm những broker có bản sao đang bắt kịp trạng thái dữ liệu của leader.

</details>

### Câu Hỏi 6: Hai cờ `--under-replicated-partitions` và `--unavailable-partitions` khi dùng kèm `kafka-topics.sh --describe` giúp phát hiện nhanh điều gì?

<details>
<summary>Đáp án</summary>

- `--under-replicated-partitions`: Lọc nhanh các partition có số broker trong danh sách `Isr` ít hơn danh sách `Replicas` (tức là có bản sao chưa bắt kịp dữ liệu của leader).
- `--unavailable-partitions`: Lọc nhanh các partition hiện không có `Leader` (hiển thị `Leader: none`), nghĩa là partition đó tạm thời không thể phục vụ đọc/ghi.

</details>

### Câu Hỏi 7: `kafka-configs.sh` dùng để làm gì trong vận hành hằng ngày, và khi thay đổi tham số hỗ trợ cập nhật động như `retention.ms` cho một topic thì có cần khởi động lại broker không?

<details>
<summary>Đáp án</summary>

- `kafka-configs.sh` dùng để đọc và chỉnh sửa cấu hình cho từng thực thể (`--entity-type`) như `topics` hoặc `brokers` — ví dụ điều chỉnh thời gian giữ dữ liệu (`retention.ms`) riêng cho một topic đang tăng dung lượng quá nhanh mà không ảnh hưởng đến các topic khác.
- Đối với các tham số hỗ trợ cập nhật động, việc thay đổi qua `kafka-configs.sh --alter --add-config ...` **không cần khởi động lại broker**.

</details>

### Câu Hỏi 8: Mặc định `kafka-console-consumer.sh` đọc những tin nhắn nào, và cần thêm cờ gì để đọc từ đầu topic? Khi dùng `kafka-console-producer.sh` để gửi tin nhắn có key, cần thêm những thuộc tính nào?

<details>
<summary>Đáp án</summary>

- Mặc định, `kafka-console-consumer.sh` chỉ đọc các message mới xuất hiện kể từ lúc lệnh bắt đầu chạy (nếu quên điều này dễ hiểu nhầm là topic bị mất dữ liệu hoặc trống rỗng). Để đọc lại từ vị trí sớm nhất hiện còn lưu trong topic, cần thêm cờ `--from-beginning`.
- Khi gửi tin nhắn có gắn key bằng `kafka-console-producer.sh`, bạn cần bật `--property parse.key=true` kèm `--property key.separator=<ký_tự>` (ví dụ `--property key.separator=:`).

</details>

### Câu Hỏi 9: Trước khi chạy `kafka-consumer-groups.sh --reset-offsets --execute` trên thực tế, bạn cần đảm bảo hai điều kiện an toàn nào?

<details>
<summary>Đáp án</summary>

1. Đảm bảo toàn bộ consumer trong consumer group đó đã dừng hẳn để group ở trạng thái rỗng (`Empty`).
2. Luôn chạy thử với cờ `--dry-run` trước để xem trước kết quả offset dự kiến trên từng partition rồi mới thay bằng `--execute`, tránh việc ứng dụng đọc lặp lại hàng triệu tin nhắn cũ hoặc bỏ sót dữ liệu mới.

</details>

### Câu Hỏi 10: Khi thao tác với cụm Kafka có bật mã hóa TLS hoặc xác thực SASL, các công cụ CLI truyền tệp cấu hình bảo mật qua cờ nào? Vì sao cần kiểm tra `<script>.sh --help` trước khi chạy lệnh tham khảo từ tài liệu bên ngoài?

<details>
<summary>Đáp án</summary>

- Nhóm công cụ quản trị (`kafka-topics.sh`, `kafka-configs.sh`, `kafka-consumer-groups.sh`) dùng cờ `--command-config <file.properties>`.
- Công cụ console dùng cờ `--producer.config` cho `kafka-console-producer.sh` và `--consumer.config` cho `kafka-console-consumer.sh`.
- Lý do cần chạy `<script>.sh --help`: Một số tên cờ thay đổi qua các thế hệ Kafka (chẳng hạn `kafka-topics.sh` bỏ `--zookeeper` từ bản 3.0, hoặc `kafka-console-producer.sh` dùng `--bootstrap-server` thay cho `--broker-list` cũ), nên chạy `--help` trực tiếp trên binary đang dùng giúp xác nhận đúng cú pháp của phiên bản đó trước khi đưa vào runbook hoặc script.

</details>
