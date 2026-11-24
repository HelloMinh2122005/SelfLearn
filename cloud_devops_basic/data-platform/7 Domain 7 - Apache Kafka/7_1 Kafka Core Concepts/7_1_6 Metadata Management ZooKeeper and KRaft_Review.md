# Review: 7_1_6 Metadata Management ZooKeeper and KRaft

### Câu Hỏi 1: Metadata trong Apache Kafka là gì và bao gồm những thông tin chính nào?

<details>
<summary>Đáp án</summary>

**Metadata** là dữ liệu mô tả cấu trúc của cụm Kafka giúp cụm vận hành đúng. Nó bao gồm:
- Danh sách các broker đang sống trong cụm.
- Danh sách các topic và cách phân bố từng partition lên broker nào.
- Tập replica/ISR của mỗi partition.
- Các cấu hình động ở cấp độ topic hoặc broker (chẳng hạn `retention.ms`, `cleanup.policy`) để đồng bộ tới mọi broker áp dụng nhất quán.

</details>

### Câu Hỏi 2: Thành phần Controller trong cụm Kafka đảm nhận những vai trò gì?

<details>
<summary>Đáp án</summary>

**Controller** là vai trò điều phối trung tâm trong cụm Kafka, chịu trách nhiệm:
- Theo dõi trạng thái sống của các broker.
- Thực thi các thay đổi metadata (như tạo/xóa topic, tăng số partition).
- Điều phối bầu chọn leader mới cho partition khi broker đang giữ leader bị sập.

</details>

### Câu Hỏi 3: Trong kiến trúc truyền thống, Apache ZooKeeper được sử dụng để làm gì cho cụm Kafka?

<details>
<summary>Đáp án</summary>

**Apache ZooKeeper** là một dịch vụ phối hợp phân tán (distributed coordination service) độc lập mà kiến trúc Kafka truyền thống bắt buộc phải chạy kèm để:
- Lưu trữ metadata của cụm.
- Theo dõi heartbeat của các broker.
- Bầu chọn Controller cho cụm Kafka.

</details>

### Câu Hỏi 4: ZooKeeper ensemble là gì, tại sao cần triển khai số node lẻ và điều kiện quorum được tính như thế nào?

<details>
<summary>Đáp án</summary>

- Cụm các node ZooKeeper được gọi là **ZooKeeper ensemble**.
- Ensemble thường được triển khai với số lượng node **lẻ** (phổ biến là 3 hoặc 5 node) để đảm bảo cơ chế đồng thuận theo đa số (**quorum**) và phòng tránh tình trạng chia tách não (**split-brain**, khi hai nhóm node cô lập cùng tự nhận quyền điều phối).
- Để đạt quorum, hệ thống cần tối thiểu `(N / 2) + 1` node hoạt động (ví dụ: cụm 3 node cần ít nhất 2 node, cụm 5 node cần ít nhất 3 node).

</details>

### Câu Hỏi 5: Kiến trúc dùng ZooKeeper có những hạn chế nào về vận hành và khả năng mở rộng?

<details>
<summary>Đáp án</summary>

- **Đánh đổi vận hành**: Kỹ sư vận hành phải cài đặt, giám sát, bảo mật và nâng cấp **2 hệ thống phân tán tách biệt** (cụm Kafka broker và cụm ZooKeeper ensemble), đồng thời Controller phải giao tiếp qua mạng với ZooKeeper để đọc/ghi trạng thái.
- **Giới hạn mở rộng**: Khi số lượng partition trong cụm tăng lên rất lớn, việc đồng bộ metadata qua các watcher của ZooKeeper và phải nạp lại toàn bộ trạng thái khi khởi động hoặc chuyển đổi Controller có thể làm chậm đáng kể thời gian phục hồi của cụm.

</details>

### Câu Hỏi 6: KRaft (Kafka Raft Metadata Mode) là gì và metadata được lưu trữ như thế nào trong chế độ này?

<details>
<summary>Đáp án</summary>

- **KRaft** là chế độ quản lý metadata tích hợp thẳng vào bên trong Apache Kafka, sử dụng giao thức đồng thuận dựa trên thuật toán **Raft** để loại bỏ hoàn toàn sự phụ thuộc vào ZooKeeper (chỉ còn vận hành 1 hệ thống duy nhất là Kafka).
- Trong chế độ KRaft, một nhóm các node đóng vai trò controller lập thành **controller quorum** và ghi mọi thay đổi metadata dưới dạng sự kiện tuần tự vào một topic nội bộ mang tên `__cluster_metadata`.

</details>

### Câu Hỏi 7: Tham số `process.roles` trong cấu hình KRaft có ý nghĩa gì, nhận những giá trị nào và khuyến nghị triển khai ra sao ở môi trường production?

<details>
<summary>Đáp án</summary>

`process.roles` gắn vai trò cho từng node Kafka trong cụm KRaft, nhận một trong các giá trị:
- `broker`: lưu và phục vụ dữ liệu.
- `controller`: quản lý metadata.
- `broker,controller` (combined mode): gộp cả hai vai trò trên cùng một node, chỉ phù hợp cho môi trường thử nghiệm hoặc quy mô nhỏ.

**Khuyến nghị cho production**: Tài liệu chính thức của Apache Kafka khuyến nghị tách riêng các node chuyên dụng chỉ chạy `process.roles=controller` (thường 3 hoặc 5 node) và các node chạy `process.roles=broker` độc lập. Nếu chạy gộp, khi lưu lượng dữ liệu của broker tăng cao làm bão hòa disk I/O hoặc network, tiến trình controller dùng chung tài nguyên sẽ bị trễ heartbeat và dễ gây chuyển đổi controller liên tục.

</details>

### Câu Hỏi 8: Vì sao KRaft có khả năng chuyển quyền Active Controller nhanh hơn (Fast Failover) so với kiến trúc ZooKeeper?

<details>
<summary>Đáp án</summary>

Trong KRaft, danh sách các node thuộc controller quorum được khai báo qua tham số `controller.quorum.voters`. Các controller dự phòng (**standby**) liên tục nhân bản sẵn log `__cluster_metadata` trong bộ nhớ. Nhờ đã có sẵn trạng thái mới nhất, khi Active Controller gặp sự cố, một standby controller có thể tiếp quản quyền gần như tức thì mà không phải mất thời gian nạp lại toàn bộ trạng thái từ ZooKeeper.

</details>

### Câu Hỏi 9: Quy tắc số node lẻ áp dụng cho KRaft controller quorum như thế nào và điều gì xảy ra nếu triển khai số node chẵn (ví dụ 2 controller)?

<details>
<summary>Đáp án</summary>

- Tương tự ZooKeeper ensemble, KRaft controller quorum cần số lượng controller **lẻ** (thường là 3 hoặc 5 node) để chịu được lỗi tối đa `(N - 1) / 2` node (tương ứng 1 node với cụm 3 node, hoặc 2 node với cụm 5 node) mà vẫn giữ được đa số đồng thuận.
- Nếu triển khai **2 controller** (số chẵn), khi mất 1 node chỉ còn 1/2 — không đạt đa số `(2 / 2) + 1 = 2`. Vì vậy, dùng 2 node không giúp tăng khả năng chịu lỗi so với 1 node và sẽ khiến toàn cụm ngừng phục vụ các thao tác metadata (như tạo topic hay bầu leader mới) khi có 1 node hỏng.

</details>

### Câu Hỏi 10: Các mốc phiên bản chính của lộ trình chuyển từ ZooKeeper sang KRaft là gì và một cụm đang dùng ZooKeeper muốn lên Kafka 4.0 phải làm thế nào?

<details>
<summary>Đáp án</summary>

**Lộ trình phiên bản**:
- **Kafka 2.8**: KRaft được giới thiệu ở mức thử nghiệm (early access).
- **Kafka 3.3**: KRaft đạt trạng thái sẵn sàng cho môi trường production.
- **Kafka 3.5**: Chế độ ZooKeeper bị đánh dấu lỗi thời (**deprecated**).
- **Kafka 4.0**: Chế độ ZooKeeper bị **loại bỏ hoàn toàn**, chỉ còn hỗ trợ KRaft.

**Cách nâng cấp từ cụm ZooKeeper cũ lên Kafka 4.0**: Không thể nâng cấp thẳng lên Kafka 4.0 vì mã nguồn ZooKeeper mode đã bị gỡ bỏ. Quản trị viên bắt buộc phải nâng cấp qua một phiên bản trung gian trong nhánh 3.x có hỗ trợ di chuyển (migration) từ ZooKeeper sang KRaft, hoàn tất quá trình chuyển đổi và kiểm tra ổn định rồi mới nâng cấp tiếp lên Kafka 4.0.

</details>

### Câu Hỏi 11: Trước khi khởi động Kafka ở chế độ KRaft lần đầu, cần thực hiện hai bước chuẩn bị nào với `kafka-storage.sh` và cần tránh sai lầm gì về `CLUSTER_ID`?

<details>
<summary>Đáp án</summary>

Hai bước chuẩn bị bằng `bin/kafka-storage.sh`:
1. **Sinh Cluster ID**: Chạy `bin/kafka-storage.sh random-uuid` để tạo một chuỗi định danh cụm duy nhất (`KAFKA_CLUSTER_ID`).
2. **Format thư mục lưu trữ (`log.dirs`)**: Chạy `bin/kafka-storage.sh format -t "$KAFKA_CLUSTER_ID" -c <file-config>` (trên Kafka 4.0 khi chạy 1 node đơn lẻ theo Quickstart dùng thêm `--standalone`; trên Kafka 3.x không có `--standalone`) để tạo file `meta.properties` gắn cứng node vào đúng cụm đó.

**Sai lầm cần tránh**: Nếu chạy nhầm `random-uuid` riêng trên từng máy trong cụm thay vì dùng chung **một** `KAFKA_CLUSTER_ID` duy nhất cho toàn bộ cụm, giá trị `cluster.id` trong `meta.properties` sẽ bị lệch và các node sẽ từ chối kết nối vào quorum.

</details>

### Câu Hỏi 12: Làm thế nào để kiểm tra trạng thái hoạt động của KRaft Controller Quorum qua CLI và các trường `LeaderId`, `MaxFollowerLag` cho biết điều gì?

<details>
<summary>Đáp án</summary>

Sau khi khởi động Kafka server (`bin/kafka-server-start.sh`), sử dụng lệnh `kafka-metadata-quorum.sh` để kiểm tra:
```bash
bin/kafka-metadata-quorum.sh --bootstrap-server localhost:9092 describe --status
```

Ý nghĩa các trường chính trong output:
- `LeaderId`: Cho biết node controller nào hiện đang giữ quyền điều phối chính (Active Controller Leader).
- `MaxFollowerLag`: Cho biết độ trễ đồng bộ lớn nhất của các controller follower/standby; giá trị `0` xác nhận các controller standby đang đồng bộ kịp thời gian thực với leader.

</details>
