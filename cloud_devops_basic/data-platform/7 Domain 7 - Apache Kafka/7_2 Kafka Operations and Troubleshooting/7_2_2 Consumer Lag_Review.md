# Review: 7_2_2 Consumer Lag

### Câu Hỏi 1: Consumer Lag là gì, và các khái niệm `Offset`, `LOG-END-OFFSET` (LEO), `CURRENT-OFFSET` có ý nghĩa như thế nào?

<details>
<summary>Đáp án</summary>

- **Consumer Lag**: Là khoảng cách tồn đọng các bản ghi (record) chưa được xử lý trên broker khi tốc độ xử lý của consumer không theo kịp tốc độ ghi của producer. Đây là chỉ số quan trọng để đánh giá sức khỏe của pipeline dữ liệu theo thời gian thực.
- **Offset**: Là số thứ tự nguyên tăng dần duy nhất mà Kafka gán cho mỗi bản ghi khi được ghi vào một partition (trong phạm vi partition đó).
- **`LOG-END-OFFSET` (LEO)**: Là vị trí offset của bản ghi tiếp theo sẽ được ghi vào cuối partition trên broker leader, cho biết tổng độ dài dữ liệu hiện có của partition đó.
- **`CURRENT-OFFSET`**: Là vị trí offset gần nhất đã được consumer group xác nhận xử lý xong (commit) cho partition đó.
</details>

### Câu Hỏi 2: Công thức tính `LAG` theo từng partition và cách tính tổng Consumer Lag của toàn bộ Consumer Group là gì?

<details>
<summary>Đáp án</summary>

- **`LAG` theo từng partition**: Được tính bằng hiệu số giữa `LOG-END-OFFSET` và `CURRENT-OFFSET`:
  `LAG = LOG-END-OFFSET - CURRENT-OFFSET`
  Giá trị này cho biết còn bao nhiêu bản ghi đang chờ consumer xử lý ở partition đó.
- **Tổng Consumer Lag của toàn bộ Consumer Group**: Được tính bằng tổng giá trị `LAG` cộng dồn từ tất cả các partition mà group đang tiêu thụ (ví dụ: nếu partition `0` có `LAG = 50`, partition `1` có `LAG = 10` và partition `2` có `LAG = 0`, tổng lag của group là `60` bản ghi).
</details>

### Câu Hỏi 3: Năm nguyên nhân kỹ thuật phổ biến nhất gây tăng Consumer Lag trong Kafka là gì?

<details>
<summary>Đáp án</summary>

1. **Consumer xử lý chậm hoặc bị lỗi (Slow / Failing Consumer)**: Các tác vụ nghiệp vụ như ghi database hoặc gọi API bên ngoài bị chậm hoặc lỗi lặp lại khiến offset không được commit, làm `CURRENT-OFFSET` đứng yên trong khi `LOG-END-OFFSET` vẫn tăng đều.
2. **Thiếu consumer so với số lượng partition (Insufficient Consumers)**: Số lượng consumer instance ít hơn số partition nên một số consumer phải đảm nhận nhiều partition cùng lúc và dễ bị quá tải khi lưu lượng producer tăng cao.
3. **Hot Partition do lệch Key (Skewed Key)**: Producer gắn cùng một partition key cho phần lớn bản ghi, khiến bộ chia mặc định của Kafka dồn các bản ghi đó về cùng một partition để giữ đúng thứ tự, làm lag tại partition đó tăng vọt.
4. **Rebalance liên tục (Continuous Rebalance)**: Khi consumer tham gia, rời group hoặc không phản hồi đúng hạn, group bước vào quá trình phân chia lại partition (rebalance), khiến việc đọc dữ liệu bị gián đoạn tạm thời và lag tăng vọt.
5. **Broker chậm hoặc gặp vấn đề hạ tầng (Slow Broker)**: Broker giữ partition leader bị nghẽn I/O đĩa, quá tải CPU hoặc nghẽn mạng làm thời gian phản hồi yêu cầu fetch dữ liệu của consumer chậm lại đáng kể dù code consumer bình thường.
</details>

### Câu Hỏi 4: Vì sao việc scale số lượng consumer vượt quá số lượng partition của topic lại không giúp giảm Consumer Lag?

<details>
<summary>Đáp án</summary>

Trong cùng một consumer group, **mỗi partition tại một thời điểm chỉ được gán cho tối đa một consumer instance**.

Do giới hạn kiến trúc này, nếu bạn scale số consumer vượt quá số partition của topic (ví dụ tăng lên 10 consumer cho topic chỉ có 3 partition), các consumer dư ra (7 consumer thừa) sẽ hoàn toàn nằm chờ ở trạng thái nhàn rỗi (**idle**), không nhận thêm partition nào và gây lãng phí tài nguyên CPU/RAM mà không giảm được đơn vị lag nào.
</details>

### Câu Hỏi 5: Hiện tượng Hot Partition do lệch Key (Skewed Key) xảy ra như thế nào và có dấu hiệu nhận biết ra sao?

<details>
<summary>Đáp án</summary>

- **Cơ chế xảy ra**: Khi producer gắn cùng một partition key cho nhiều bản ghi, bộ chia mặc định của Kafka sẽ định tuyến tất cả bản ghi có cùng key về cùng một partition để đảm bảo đúng thứ tự. Nếu một key xuất hiện quá nhiều (ví dụ một khách hàng lớn chiếm 80% đơn hàng), phần lớn lưu lượng sẽ bị dồn vào duy nhất một partition.
- **Dấu hiệu nhận biết**: Khi kiểm tra bằng `--describe`, toàn bộ các partition đều đã có `CONSUMER-ID` và `HOST` đảm nhận, nhưng có 1 (hoặc một vài) partition có `LAG` tăng vọt trong khi các partition còn lại có `LAG` gần như bằng `0`.
</details>

### Câu Hỏi 6: Khi không có consumer nào đang hoạt động (`#MEMBERS = 0`), trạng thái `Empty` và `Dead` của Consumer Group khác nhau như thế nào, và vì sao ở trạng thái `Empty` chỉ số `LAG` vẫn tiếp tục tăng?

<details>
<summary>Đáp án</summary>

- **Trạng thái `Empty`**: Group hiện không có thành viên consumer nào đang kết nối, nhưng metadata và các offset đã commit trước đó vẫn còn được lưu trên broker.
- **Trạng thái `Dead`**: Group không có thành viên nào và toàn bộ thông tin/offset của group đã bị xóa (hoặc đã hết hạn lưu giữ theo cấu hình `offsets.retention.minutes`), hoặc group chưa từng tồn tại.
- **Lý do `LAG` vẫn tăng ở trạng thái `Empty`**: Vì broker vẫn còn lưu `CURRENT-OFFSET` cũ để đối chiếu với `LOG-END-OFFSET` mới. Khi producer tiếp tục ghi dữ liệu làm `LOG-END-OFFSET` tăng lên, hiệu số `LAG` vẫn tiếp tục được tính toán và tăng dần theo thời gian (trên bảng `--describe`, các cột `CONSUMER-ID`, `HOST`, `CLIENT-ID` sẽ hiển thị dấu `-`).
</details>

### Câu Hỏi 7: Các tham số Consumer gồm `max.poll.interval.ms`, `max.poll.records` và `session.timeout.ms` có ý nghĩa gì và liên quan thế nào đến Rebalance?

<details>
<summary>Đáp án</summary>

- **`max.poll.interval.ms`**: Quy định khoảng thời gian tối đa cho phép giữa hai lần consumer gọi hàm `poll()` liên tiếp. Nếu code xử lý một lô bản ghi lâu hơn ngưỡng này, coordinator sẽ coi consumer bị treo và kích hoạt rebalance.
- **`max.poll.records`**: Giới hạn số lượng bản ghi tối đa mà consumer lấy về trong một lần gọi `poll()`, giúp thu nhỏ kích thước lô xử lý để kịp hoàn thành trước khi chạm ngưỡng `max.poll.interval.ms`.
- **`session.timeout.ms`**: Quy định thời gian tối đa group coordinator chờ tín hiệu heartbeat từ consumer. Nếu quá hạn mà không nhận được heartbeat, consumer bị loại khỏi group và quá trình rebalance diễn ra.
</details>

### Câu Hỏi 8: Để kiểm tra chi tiết `LAG` theo từng partition và xem trạng thái vòng đời (`STATE`) của Consumer Group qua CLI, ta dùng công cụ và các cờ (flags) nào?

<details>
<summary>Đáp án</summary>

Ta sử dụng công cụ dòng lệnh tiêu chuẩn đi kèm Kafka distribution là **`kafka-consumer-groups.sh`**:

- **Xem chi tiết `LAG` theo từng partition**: Dùng kết hợp các cờ:
  - `--bootstrap-server`: Địa chỉ broker đầu vào của cụm Kafka (ví dụ `localhost:9092`).
  - `--describe`: Xuất thông tin chi tiết của group (bao gồm `CURRENT-OFFSET`, `LOG-END-OFFSET`, `LAG`, `CONSUMER-ID`, `HOST`, `CLIENT-ID`).
  - `--group`: Tên định danh của consumer group cần kiểm tra.
- **Xem trạng thái tổng quan của group (`STATE`, `ASSIGNMENT-STRATEGY`, `#MEMBERS`)**: Thêm cờ **`--state`** vào lệnh `--describe` ở trên.
</details>

### Câu Hỏi 9: Quy trình chẩn đoán thực chiến khi nhận được cảnh báo Consumer Lag tăng cao gồm những bước nào?

<details>
<summary>Đáp án</summary>

Thay vì đoán mò hoặc scale mù quáng, ta thực hiện theo luồng chẩn đoán sau:

1. **Kiểm tra trạng thái group trước** bằng `kafka-consumer-groups.sh --describe --state`:
   - Nếu `STATE` là `Empty` hoặc `Dead` (`#MEMBERS = 0`): Consumer đã chết hoặc chưa chạy → kiểm tra Pod/Process logs, OOMKill.
   - Nếu trạng thái đổi liên tục (`Rebalancing`): Group đang bị rebalance liên tục → kiểm tra crash loop, `max.poll.interval.ms`, `session.timeout.ms`.
2. **Nếu `STATE` là `Stable` (`#MEMBERS > 0`), kiểm tra cột `LAG` trên từng partition**:
   - Nếu `LAG` dồn vào 1–2 partition: Kiểm tra **Hot Partition** (lệch key) hoặc **Slow Broker** (broker leader của partition đó chậm).
   - Nếu `LAG` trải đều trên các partition: Kiểm tra xem số consumer có nhỏ hơn số partition không. Nếu thiếu thì scale thêm consumer (tối đa bằng số partition); nếu đã đủ consumer thì kiểm tra **Consumer xử lý chậm** (DB/API nghẽn) hoặc **Producer tăng đột biến**.
</details>

### Câu Hỏi 10: Nếu Consumer Lag kéo dài vượt quá ngưỡng lưu giữ dữ liệu (`retention.ms` hoặc `retention.bytes`) trên broker thì điều gì sẽ xảy ra?

<details>
<summary>Đáp án</summary>

Kafka lưu giữ dữ liệu trên đĩa theo thời gian hoặc dung lượng cấu hình (`retention.ms` hoặc `retention.bytes`) chứ không xóa bản ghi ngay sau khi consumer đọc.

Do đó, nếu Consumer Lag kéo dài vượt quá ngưỡng retention này, các bản ghi cũ mà consumer chưa kịp đọc sẽ bị broker xóa bỏ, gây ra **cạm bẫy mất dữ liệu âm thầm** cho consumer.
</details>

### Câu Hỏi 11: Trong vận hành, cần phân biệt như thế nào giữa "Lag nhỏ tạm thời" và "Lag tăng đơn điệu"?

<details>
<summary>Đáp án</summary>

- **Lag nhỏ tạm thời**: Xảy ra khi lưu lượng gửi đến từ producer tăng đột biến trong thời gian ngắn; độ trễ tăng lên tạm thời rồi nhanh chóng giảm về mức bình thường khi consumer tiêu thụ kịp.
- **Lag tăng đơn điệu**: Là khi đồ thị độ trễ dốc lên liên tục theo thời gian mà không có dấu hiệu giảm xuống — đây mới là dấu hiệu sự cố cần can thiệp khẩn cấp.
</details>
