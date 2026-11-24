# Review: 7_1_4 Broker Replication Leader and ISR

### Câu Hỏi 1: Broker là gì và hệ số sao chép (`replication.factor`) ảnh hưởng như thế nào đến khả năng chịu lỗi và chi phí hạ tầng?

<details>
<summary>Đáp án</summary>

- **Broker** là một máy chủ (hoặc container/node) chạy tiến trình Kafka, chịu trách nhiệm lưu trữ các partition trên đĩa và phục vụ yêu cầu đọc/ghi từ client.
- **`replication.factor`** là số lượng bản sao (replica) của mỗi partition được tạo ra và phân bổ trên các broker khác nhau trong cluster.
- **Khả năng chịu lỗi**: Với `replication.factor = N`, Kafka có thể chịu được tối đa `N - 1` broker chứa bản sao bị lỗi mà vẫn không làm mất các bản ghi đã được xác nhận (committed).
- **Chi phí hạ tầng**: Khi tăng `replication.factor` (ví dụ từ `1` lên `3`), dung lượng đĩa lưu trữ và lưu lượng mạng sao chép nội bộ giữa các broker cũng tăng theo số lượng bản sao. Do đó, thường áp dụng `replication.factor=3` cho topic nghiệp vụ quan trọng và cân nhắc mức thấp hơn cho dữ liệu tạm thời ít giá trị.

</details>

### Câu Hỏi 2: Trong các bản sao (replicas) của một partition, vai trò và luồng giao tiếp của Leader và Follower khác nhau ra sao?

<details>
<summary>Đáp án</summary>

- Trong các bản sao của một partition, Kafka chỉ định **đúng 1 bản sao làm Leader** và tất cả các bản sao còn lại làm **Follower**.
- **Leader** là nơi tiếp nhận toàn bộ thao tác ghi từ producer và thao tác đọc mặc định từ consumer *(từ Kafka 2.4+ có hỗ trợ tùy chọn rack-aware follower fetching cho phép consumer đọc từ follower gần nhất về mặt mạng, nhưng mặc định vẫn đọc từ leader)*.
- **Follower** không trực tiếp nhận dữ liệu ghi từ producer. Thay vào đó, các follower sao chép dữ liệu một cách thụ động bằng cách gửi yêu cầu fetch định kỳ tới leader để giữ bản log của mình giống hệt leader.

</details>

### Câu Hỏi 3: Tập ISR (In-Sync Replicas) là gì và tham số `replica.lag.time.max.ms` điều khiển điều gì?

<details>
<summary>Đáp án</summary>

- **ISR (In-Sync Replicas)** là danh sách các replica (bao gồm leader và những follower đang theo kịp dữ liệu) hiện đang đồng bộ với leader của partition.
- **`replica.lag.time.max.ms`** quy định khoảng thời gian tối đa cho phép một follower bị tụt hậu (do nghẽn mạng, quá tải đĩa hoặc sập) trước khi bị leader loại khỏi tập ISR.
- Khi follower đó phục hồi và bắt kịp log của leader trở lại, nó sẽ tự động được đưa vào lại tập ISR.

</details>

### Câu Hỏi 4: Khi nào một bản ghi được Kafka coi là đã commit (committed) và vì sao Consumer chỉ được phép đọc các bản ghi ở trạng thái này?

<details>
<summary>Đáp án</summary>

- Một bản ghi chỉ được Kafka coi là **committed** sau khi **tất cả các replica đang có mặt trong tập ISR** đã ghi nhận bản ghi đó vào log của chúng.
- **Consumer** chỉ được phép đọc những bản ghi đã ở trạng thái committed để tránh trường hợp đọc nhầm dữ liệu chưa kịp đồng bộ, rồi dữ liệu đó bị biến mất nếu leader bất ngờ gặp sự cố sập.

</details>

### Câu Hỏi 5: Khi producer đặt `acks=all` (tương đương `acks=-1`), cơ chế xác nhận diễn ra như thế nào và tại sao chỉ đặt `acks=all` thôi vẫn tiềm ẩn rủi ro mất dữ liệu?

<details>
<summary>Đáp án</summary>

- Khi producer đặt `acks=all`, leader sẽ đợi cho đến khi **toàn bộ các replica đang có trong tập ISR hiện tại** xác nhận đã ghi bản ghi thì mới báo thành công về cho producer.
- **Rủi ro khi dùng một mình**: Giá trị mặc định của `min.insync.replicas` là `1`. Nếu tất cả follower đều sập hoặc bị loại khỏi ISR, tập ISR thu hẹp lại chỉ còn 1 thành viên là chính leader. Lúc này, leader chỉ cần tự ghi cho chính mình là đã thỏa mãn "toàn bộ ISR hiện tại" và báo thành công về cho producer. Nếu leader đó sập ngay sau đó trước khi kịp sao chép sang follower, dữ liệu sẽ bị mất.

</details>

### Câu Hỏi 6: Tham số `min.insync.replicas` có tác dụng gì và điều gì xảy ra nếu số replica trong ISR giảm xuống dưới ngưỡng này?

<details>
<summary>Đáp án</summary>

- **`min.insync.replicas`** (cấu hình ở cấp broker hoặc topic, mặc định là `1`) quy định số lượng replica tối thiểu phải có trong tập ISR thì leader mới chấp nhận lệnh ghi từ producer sử dụng `acks=all`.
- Nếu số lượng replica trong tập ISR giảm xuống **nhỏ hơn `min.insync.replicas`** và producer gửi tin với `acks=all`, broker sẽ từ chối lệnh ghi và ném ngoại lệ `NotEnoughReplicasException` (hoặc `NotEnoughReplicasAfterAppendException`).

</details>

### Câu Hỏi 7: Vì sao không nên cấu hình `min.insync.replicas` bằng đúng `replication.factor` (ví dụ cùng bằng `3`)?

<details>
<summary>Đáp án</summary>

Nếu đặt `replication.factor=3` và `min.insync.replicas=3`, chỉ cần **1 broker** khởi động lại để bảo trì hoặc vá lỗi hệ điều hành, số replica trong ISR sẽ giảm xuống còn 2 (`< 3`). Khi đó, toàn bộ luồng ghi với `acks=all` sẽ bị chặn lập tức (`NotEnoughReplicasException`).

Trong thực tế sản xuất, cần giữ `min.insync.replicas < replication.factor` (phổ biến nhất là `3` và `2`) để cluster chịu được tối thiểu 1 node ngừng hoạt động mà không gián đoạn ghi.

</details>

### Câu Hỏi 8: Khi broker giữ vai trò Leader bị sập hoặc mất kết nối, quá trình bầu Leader mới diễn ra như thế nào trong trường hợp bình thường?

<details>
<summary>Đáp án</summary>

- Khi leader bị sập hoặc mất kết nối, **controller** của Kafka sẽ chọn một replica đang nằm trong tập **ISR** để lên làm leader mới.
- Vì mọi thành viên trong ISR đều lưu giữ đầy đủ các bản ghi đã commit, quá trình chuyển đổi leader này bảo toàn hoàn toàn dữ liệu đã xác nhận với producer.

</details>

### Câu Hỏi 9: Cấu hình `unclean.leader.election.enable` được dùng trong tình huống nào và sự đánh đổi giữa `false` với `true` ra sao?

<details>
<summary>Đáp án</summary>

Tham số này quyết định cách xử lý khi **toàn bộ các replica trong tập ISR đều sập cùng lúc**, chỉ còn lại follower nằm **ngoài ISR** (chưa kịp đồng bộ các tin mới nhất):

- **`unclean.leader.election.enable=false`** *(giá trị mặc định từ Kafka 0.11 trở đi)*: Không bầu replica ngoài ISR; partition tạm ngừng phục vụ đọc/ghi cho đến khi một thành viên trong ISR cũ hoạt động trở lại. Cách này **ưu tiên độ bền dữ liệu (Durability)** và chấp nhận gián đoạn dịch vụ (giảm Availability).
- **`unclean.leader.election.enable=true`** *(từng là mặc định trước Kafka 0.11)*: Cho phép bầu replica ngoài ISR lên làm leader mới để tiếp tục phục vụ ngay lập tức. Cách này **ưu tiên tính sẵn sàng (Availability)** nhưng chấp nhận **mất các bản ghi** chưa kịp đồng bộ, không phù hợp cho dữ liệu quan trọng như tài chính hay đơn hàng (chỉ nên cân nhắc cho log/metric chấp nhận mất mát nhỏ).

</details>

### Câu Hỏi 10: Với bộ cấu hình tiêu chuẩn `replication.factor=3`, `min.insync.replicas=2` và `acks=all`, hệ thống sẽ hoạt động như thế nào khi (a) 1 broker sập và (b) 2 broker sập?

<details>
<summary>Đáp án</summary>

- **(a) Khi 1 broker sập**: Tập ISR còn lại 2 thành viên (`2 >= min.insync.replicas`). Kafka tự động bầu 1 trong 2 thành viên còn lại làm leader mới nếu cần, và producer vẫn ghi bình thường với `acks=all`, luôn đảm bảo ít nhất 2 bản sao lưu giữ dữ liệu.
- **(b) Khi 2 broker sập (chỉ còn 1 replica trong ISR)**: Tập ISR lúc này chỉ còn 1 thành viên (`1 < min.insync.replicas`). Consumer vẫn có thể đọc các bản ghi đã commit từ replica còn sống, nhưng mọi lệnh ghi từ producer dùng `acks=all` sẽ bị chặn và trả về lỗi `NotEnoughReplicasException` nhằm tránh ghi dữ liệu lên một máy đơn lẻ đầy rủi ro.

</details>

### Câu Hỏi 11: Dùng lệnh CLI nào để kiểm tra Leader, Replicas và ISR của một topic, và các cột `Leader`, `Replicas`, `Isr` trong kết quả thể hiện thông tin gì?

<details>
<summary>Đáp án</summary>

Sử dụng lệnh `kafka-topics.sh --describe`:

```bash
kafka-topics.sh --bootstrap-server localhost:9092 \
  --describe \
  --topic orders
```

Ý nghĩa các cột trong kết quả trả về:
- **`Leader`**: ID của broker đang giữ vai trò leader xử lý đọc/ghi cho partition đó (ví dụ `Leader: 0`).
- **`Replicas`**: Danh sách tất cả các broker được phân công giữ bản sao của partition đó (ví dụ `Replicas: 0,1,2`).
- **`Isr`**: Danh sách các broker hiện đang đồng bộ với leader (ví dụ `Isr: 0,1,2`; nếu Broker `2` bị tắt, cột này thu hẹp thành `Isr: 0,1`).

</details>

### Câu Hỏi 12: Làm thế nào để thiết lập `min.insync.replicas=2` ngay khi tạo topic mới và cập nhật cấu hình này cho một topic đang chạy mà không cần tạo lại?

<details>
<summary>Đáp án</summary>

1. **Thiết lập ngay khi tạo topic mới** bằng `kafka-topics.sh --create`:

```bash
kafka-topics.sh --bootstrap-server localhost:9092 \
  --create \
  --topic orders \
  --partitions 1 \
  --replication-factor 3 \
  --config min.insync.replicas=2
```

2. **Cập nhật động trên topic đang chạy** (không cần tạo lại) bằng `kafka-configs.sh --alter`:

```bash
kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name orders \
  --alter \
  --add-config min.insync.replicas=2
```

</details>
