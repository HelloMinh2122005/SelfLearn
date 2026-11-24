# Review: 7_1_3 Consumer and Consumer Group

### Câu Hỏi 1: Consumer và Consumer Group (`group.id`) là gì? Khi nhiều Consumer Group khác nhau cùng đăng ký đọc một topic thì dữ liệu được phân phối như thế nào?

<details>
<summary>Đáp án</summary>

- **Consumer** là ứng dụng client kết nối tới Kafka broker để kéo (pull) bản ghi từ topic về xử lý.
- **Consumer Group** là nhóm logic gồm một hoặc nhiều consumer instance cùng chia sẻ công việc đọc dữ liệu, được định danh bằng cấu hình `group.id`.
- Mỗi bản ghi gửi vào topic sẽ được phân phối tới **đúng một consumer instance bên trong mỗi consumer group** đang đăng ký đọc topic đó.
- Nhiều consumer group có `group.id` khác nhau đọc cùng một topic một cách **hoàn toàn độc lập**: mỗi group đều nhận đủ toàn bộ bản ghi và tự theo dõi vị trí đọc (offset) riêng.

</details>

### Câu Hỏi 2: Quy tắc phân chia partition cho các consumer trong cùng một Consumer Group là gì? Điều gì xảy ra nếu số lượng consumer trong group vượt quá số partition của topic?

<details>
<summary>Đáp án</summary>

- Trong cùng một `group.id`, tại một thời điểm, **mỗi partition chỉ được gán cho duy nhất một consumer** (một consumer có thể đọc nhiều partition, nhưng hai consumer cùng nhóm không bao giờ đọc chung một partition). Quy tắc này giúp giữ thứ tự xử lý theo từng partition.
- Nếu số consumer trong cùng group **vượt quá** số partition của topic (ví dụ 4 consumer đọc topic có 3 partition), các consumer dư thừa sẽ ở trạng thái **nhàn rỗi (idle)** và không nhận được bản ghi nào.

</details>

### Câu Hỏi 3: Offset commit là gì và Kafka lưu trữ thông tin offset đã commit ở đâu?

<details>
<summary>Đáp án</summary>

- **Offset commit** là hành động consumer xác nhận đã xử lý tới vị trí offset nào trên từng partition để khi khởi động lại (hoặc nhận lại partition), consumer group biết cần đọc tiếp từ đâu.
- Kafka lưu các offset đã commit này vào một topic nội bộ có tên là `__consumer_offsets`.

</details>

### Câu Hỏi 4: Cơ chế Auto Commit (`enable.auto.commit=true`) hoạt động như thế nào và vì sao nó gắn với ngữ nghĩa giao hàng at-most-once (tối đa một lần)?

<details>
<summary>Đáp án</summary>

- Cấu hình `enable.auto.commit` mặc định là `true`, cho phép consumer tự động commit offset mới nhất nhận từ `poll()` ở chế độ nền theo chu kỳ do `auto.commit.interval.ms` quy định (mặc định là `5000` ms, tức 5 giây).
- Vì việc commit diễn ra theo đồng hồ hẹn giờ chứ không chờ logic nghiệp vụ xử lý xong, nếu hệ thống tự động commit trước khi consumer xử lý hết lô tin rồi consumer bị sập giữa chừng, consumer thay thế sẽ đọc tiếp từ sau offset đã commit và **bỏ sót** các bản ghi chưa kịp xử lý. Đây chính là ngữ nghĩa **at-most-once** (tối đa một lần — có thể mất bản ghi).

</details>

### Câu Hỏi 5: Khi cấu hình commit thủ công (`enable.auto.commit=false`), tại sao việc commit sau khi xử lý xong chỉ đảm bảo at-least-once chứ không tự động đạt exactly-once?

<details>
<summary>Đáp án</summary>

- Khi tắt tự động commit (`enable.auto.commit=false`) và chủ động gọi commit **sau khi** logic nghiệp vụ đã thành công, nếu consumer đã xử lý xong bản ghi nhưng bị sập ngay trước khi kịp commit offset, consumer thay thế sẽ đọc và xử lý lại từ offset đã commit gần nhất.
- Cơ chế này không làm mất dữ liệu (đảm bảo **at-least-once** — ít nhất một lần), nhưng có thể xảy ra xử lý trùng lặp nên không tự động đạt *exactly-once*. Vì vậy, logic ghi vào Database hoặc gọi API cần được thiết kế **idempotent** để chịu được việc xử lý lại.

</details>

### Câu Hỏi 6: Hai phương thức commit thủ công `commitSync()` và `commitAsync()` khác nhau ở điểm nào?

<details>
<summary>Đáp án</summary>

- `commitSync()` thực hiện commit **đồng bộ**: chặn luồng xử lý để chờ broker xác nhận thành công và tự động thử lại nếu gặp lỗi tạm thời.
- `commitAsync()` gửi yêu cầu commit **bất đồng bộ**: không chặn luồng xử lý chính của consumer.

</details>

### Câu Hỏi 7: Rebalance là gì và những nguyên nhân nào kích hoạt quá trình rebalance trong một Consumer Group?

<details>
<summary>Đáp án</summary>

- **Rebalance** là quá trình Kafka phân công lại quyền sở hữu các partition cho các consumer trong cùng một `group.id`.
- Rebalance xảy ra khi:
  1. Một consumer mới tham gia hoặc chủ động rời khỏi group.
  2. Một consumer bị coi là mất kết nối vì không gửi heartbeat kịp trong khoảng `session.timeout.ms`.
  3. Consumer xử lý lô tin quá lâu khiến lần gọi `poll()` tiếp theo vượt quá ngưỡng `max.poll.interval.ms`.

</details>

### Câu Hỏi 8: Vì sao tình trạng "bão rebalance" (rebalance xảy ra liên tục) lại khiến cả Consumer Group bị "đứng hình"?

<details>
<summary>Đáp án</summary>

- Trong quá trình rebalance (đặc biệt với giao thức eager rebalance truyền thống), các consumer phải tạm dừng đọc dữ liệu trên các partition bị thu hồi cho đến khi việc chia lại hoàn tất.
- Nếu consumer xử lý lô bản ghi quá lâu vượt `max.poll.interval.ms` khiến broker loại nó khỏi group, rồi consumer đó lại kết nối lại và tiếp tục timeout, vòng lặp rebalance sẽ lặp đi lặp lại khiến cả group chững lại và không xử lý được dữ liệu.

</details>

### Câu Hỏi 9: Khi nào Kafka sử dụng tham số cấu hình `auto.offset.reset`?

<details>
<summary>Đáp án</summary>

Kafka sử dụng `auto.offset.reset` để quyết định điểm bắt đầu đọc của consumer trong hai trường hợp:
1. Consumer group chưa từng có offset nào được commit trong `__consumer_offsets` (ví dụ một `group.id` mới tạo).
2. Offset đã commit trước đó không còn tồn tại trên server (ví dụ do dữ liệu cũ đã bị xóa theo chính sách `retention`).

</details>

### Câu Hỏi 10: Phân biệt ba giá trị `latest`, `earliest` và `none` của `auto.offset.reset`. Giá trị nào là mặc định?

<details>
<summary>Đáp án</summary>

- `latest` (**mặc định**): Consumer nhảy tới cuối partition và chỉ đọc các bản ghi mới xuất hiện sau khi khởi động (bỏ qua dữ liệu đã có trước đó nếu là group mới).
- `earliest`: Consumer đọc lại từ offset sớm nhất hiện còn lưu trong partition.
- `none`: Consumer ném ra ngoại lệ (exception) nếu không tìm thấy offset trước đó của group.

</details>

### Câu Hỏi 11: Consumer Lag được tính theo công thức nào? Lag tăng dần báo hiệu điều gì và có rủi ro gì liên quan đến `retention`?

<details>
<summary>Đáp án</summary>

- Công thức trên từng partition:
  $$\text{Consumer Lag} = \text{Latest Partition Offset} - \text{Group Committed Offset}$$
  Trong đó **Latest Partition Offset** là offset mới nhất đã ghi vào partition, còn **Group Committed Offset** là offset cuối cùng mà group đã commit.
- Lag tăng dần báo hiệu tốc độ ghi dữ liệu (produce) đang nhanh hơn tốc độ xử lý của consumer group.
- Nếu độ trễ này kéo dài vượt quá thời gian `retention` của topic, các bản ghi cũ chưa kịp đọc có thể bị broker xóa mất trước khi consumer kịp xử lý.

</details>

### Câu Hỏi 12: Khi chạy `kafka-console-consumer.sh` với hai terminal cùng `--group billing-group` và một terminal thứ ba dùng `--group analytics-group` (tất cả đều có `--from-beginning`), kết quả nhận tin nhắn ở các terminal khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- Cờ `--from-beginning` tương ứng với `auto.offset.reset=earliest`, giúp các group mới đọc từ các bản ghi cũ nhất còn trong topic.
- Hai terminal cùng `--group billing-group` chia nhau các partition theo quy tắc 1-1 trong cùng group, nên mỗi terminal chỉ nhận tin nhắn từ tập partition được gán cho nó (không trùng lặp nhau).
- Terminal thứ ba thuộc `--group analytics-group` hoạt động độc lập với `billing-group`, nên sẽ nhận lại **đầy đủ toàn bộ** tin nhắn của topic bất kể tiến độ của `billing-group`.

</details>
