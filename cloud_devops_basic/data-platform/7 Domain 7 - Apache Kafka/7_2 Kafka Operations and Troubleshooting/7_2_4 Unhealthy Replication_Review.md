# Review: 7_2_4 Unhealthy Replication

### Câu Hỏi 1: Under-Replicated Partition (URP) và trạng thái Under-min-ISR khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- **Under-Replicated Partition (URP)**: Là partition có số lượng replica đang đồng bộ trong tập **ISR (In-Sync Replicas)** nhỏ hơn tổng số replica được phân công (`replication.factor`), tức là có ít nhất một follower không theo kịp leader.
- **Under-min-ISR**: Là trạng thái nghiêm trọng hơn khi số lượng replica trong tập ISR tụt xuống thấp hơn ngưỡng `min.insync.replicas` đã cấu hình.

</details>

### Câu Hỏi 2: Tham số `replica.lag.time.max.ms` có vai trò gì trong cơ chế replication của Kafka?

<details>
<summary>Đáp án</summary>

Tham số `replica.lag.time.max.ms` quy định thời gian tối đa một follower được phép chậm trễ (không gửi yêu cầu fetch hoặc không bắt kịp dữ liệu của leader) trước khi bị leader loại khỏi tập ISR.

</details>

### Câu Hỏi 3: Bốn nguyên nhân phổ biến nào thường khiến một follower bị chậm đồng bộ và bị loại khỏi tập ISR?

<details>
<summary>Đáp án</summary>

Bốn nguyên nhân phổ biến gồm:
1. **Broker mất kết nối hoặc sập (Broker down / crash)**: Follower dừng hoạt động (do lỗi phần cứng, crash hoặc rolling restart) nên ngừng gửi yêu cầu fetch tới leader.
2. **Broker chạy chậm (Slow broker)**: Follower vẫn chạy nhưng bị nghẽn CPU, tạm dừng kéo dài do Garbage Collection (GC pause) hoặc thiếu luồng xử lý, dẫn tới đồng bộ chậm quá ngưỡng `replica.lag.time.max.ms`.
3. **Sự cố mạng (Network issues)**: Mất gói tin, độ trễ mạng cao hoặc phân tách mạng giữa leader và follower làm gián đoạn luồng sao chép dữ liệu.
4. **Nghẽn hoặc lỗi đĩa (Disk I/O bottleneck / failure)**: Tốc độ ghi đĩa trên follower quá chậm hoặc ổ đĩa hỏng khiến broker không ghi nhận kịp các bản ghi sao chép.

</details>

### Câu Hỏi 4: Tham số `min.insync.replicas` hoạt động như thế nào khi đi cùng `acks=all`, và điều gì xảy ra nếu kích thước ISR nhỏ hơn ngưỡng này?

<details>
<summary>Đáp án</summary>

- `min.insync.replicas` xác định số replica tối thiểu (tính cả leader) phải xác nhận đã ghi dữ liệu thì yêu cầu ghi có `acks=all` (tương đương `acks=-1`) mới được coi là thành công.
- Tham số này có thể đặt mặc định ở cấp độ broker hoặc ghi đè riêng theo từng topic (ví dụ qua `--config min.insync.replicas=2` khi tạo topic bằng `kafka-topics.sh`).
- Khi producer gửi với `acks=all` nhưng kích thước ISR hiện tại nhỏ hơn `min.insync.replicas`, broker sẽ từ chối yêu cầu ghi và trả về lỗi `NotEnoughReplicasException` (hoặc `NotEnoughReplicasAfterAppendException`).

</details>

### Câu Hỏi 5: Tại sao việc trả về lỗi `NotEnoughReplicasException` khi dùng `acks=all` + `min.insync.replicas` lại được xem là hành vi an toàn có chủ đích, và điều này khác gì so với khi dùng `acks=1`?

<details>
<summary>Đáp án</summary>

- Việc trả lỗi là **hành vi an toàn có chủ đích** vì nếu Kafka vẫn cho phép ghi thành công khi số bản sao ít hơn ngưỡng `min.insync.replicas` (ví dụ chỉ còn 1 replica duy nhất), dữ liệu sẽ bị mất âm thầm nếu broker cuối cùng đó sập ngay sau khi xác nhận.
- Ngược lại, nếu producer dùng `acks=1`, leader sẽ trả lời thành công ngay sau khi ghi vào log cục bộ mà không chờ follower và không áp dụng ràng buộc `min.insync.replicas`.

</details>

### Câu Hỏi 6: Khi một broker đang giữ vai trò leader bị mất kết nối, cụm Kafka phát hiện và xử lý như thế nào? Tham số `unclean.leader.election.enable=false` có ý nghĩa gì?

<details>
<summary>Đáp án</summary>

- Thành phần **controller** trong cluster liên tục theo dõi trạng thái sống của các broker qua heartbeat/session timeout để phát hiện khi một broker ngắt kết nối.
- Broker mất kết nối sẽ bị loại khỏi tập ISR (ISR shrinking), và controller bầu một broker khác còn lại trong ISR làm leader mới cho partition đó.
- Với cấu hình mặc định `unclean.leader.election.enable=false`, Kafka chỉ chọn leader mới từ tập ISR nhằm tránh mất các bản ghi đã commit (nếu đặt thành `true`, hệ thống sẽ cho phép bầu bản sao không nằm trong ISR làm leader, gây mất các bản ghi đã commit trước đó).

</details>

### Câu Hỏi 7: Trong trạng thái Under-min-ISR, hoạt động ghi của producer dùng `acks=all` và hoạt động đọc của consumer bị ảnh hưởng như thế nào?

<details>
<summary>Đáp án</summary>

Trong trạng thái Under-min-ISR (kích thước ISR rơi xuống dưới `min.insync.replicas`):
- Các lệnh ghi với `acks=all` từ producer bị **từ chối**.
- Consumer **vẫn đọc được** các dữ liệu đã commit (đến mức high watermark) từ leader còn sống.

</details>

### Câu Hỏi 8: Khi một broker từng gặp sự cố khởi động lại và kết nối vào cluster, nó thực hiện những bước nào để quay lại tập ISR và có ngay lập tức làm leader trở lại không?

<details>
<summary>Đáp án</summary>

1. Khi khởi động lại với vai trò **follower**, broker cắt bỏ (`truncate`) phần dữ liệu chưa commit vượt quá high watermark (nếu có) và tải lại (`fetch`) các bản ghi bị thiếu từ leader hiện tại.
2. Khi đã bắt kịp log của leader, follower được đưa trở lại tập ISR và partition hết trạng thái under-replicated.
3. Broker vừa quay lại vẫn tiếp tục giữ vai trò follower và **không** ngay lập tức trở thành leader; quyền leader chỉ chuyển về khi quá trình bầu leader ưu tiên (preferred leader election) chạy thông qua `auto.leader.rebalance.enable` (mặc định `true`) hoặc qua công cụ quản trị như `kafka-leader-election.sh`.

</details>

### Câu Hỏi 9: Sử dụng `kafka-topics.sh` với những cờ nào để kiểm tra `Leader`, `Replicas`, `Isr` của một topic và lọc ra các partition đang Under-Replicated hoặc Under-Min-ISR?

<details>
<summary>Đáp án</summary>

- Kiểm tra `Leader`, `Replicas` và `Isr` của topic: dùng `kafka-topics.sh --describe --topic <tên-topic>`.
- Liệt kê các partition đang bị Under-Replicated (`Isr` nhỏ hơn `Replicas`): dùng `kafka-topics.sh --describe --under-replicated-partitions`.
- Lọc riêng các partition bị Under-Min-ISR (tụt dưới ngưỡng `min.insync.replicas`): dùng `kafka-topics.sh --describe --under-min-isr-partitions`.

</details>

### Câu Hỏi 10: Trong thực tế vận hành, vì sao không nên đặt `min.insync.replicas` bằng đúng `replication.factor` (ví dụ cùng bằng 3) và cấu hình khuyến nghị phổ biến là gì?

<details>
<summary>Đáp án</summary>

- **Cạm bẫy**: Nếu đặt `replication.factor=3` và `min.insync.replicas=3`, chỉ cần 1 broker restart bảo trì là ISR giảm còn 2 (`< 3`), khiến mọi producer `acks=all` lập tức nhận `NotEnoughReplicasException` và không ghi được.
- **Thực tiễn chuẩn**: Thiết lập phổ biến là `replication.factor=3` đi kèm `min.insync.replicas=2` để cụm có thể chịu được lỗi 1 broker mà producer `acks=all` vẫn ghi bình thường.

</details>
