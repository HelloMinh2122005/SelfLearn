# Review: 7_2_3 Continuous Rebalance

### Câu Hỏi 1: Rebalance là gì, vai trò của Group Coordinator là gì, và khi nào hệ thống rơi vào trạng thái Rebalance liên tục (Continuous Rebalance)?

<details>
<summary>Đáp án</summary>

- **Rebalance** là quá trình các consumer trong cùng một consumer group phân chia lại quyền sở hữu các partition khi số thành viên trong group hoặc thông tin topic/partition thay đổi.
- **Group coordinator** là broker chịu trách nhiệm điều phối consumer group (theo dõi các thành viên và kích hoạt rebalance khi cần).
- **Rebalance liên tục** xảy ra khi một consumer liên tục bị group coordinator đánh dấu là "đã chết" hoặc thoát ra rồi tham gia lại. Khi đó, consumer group dành phần lớn thời gian để thu hồi và chia lại partition thay vì đọc dữ liệu, làm consumer lag tăng nhanh và có nguy cơ xử lý trùng lặp tin nhắn.

</details>

### Câu Hỏi 2: Tại sao xử lý message quá lâu lại gây ra rebalance? Vai trò của `max.poll.interval.ms`, `max.poll.records` và cạm bẫy khi tăng `max.poll.interval.ms` quá lớn là gì?

<details>
<summary>Đáp án</summary>

- Hàm `poll()` được consumer gọi định kỳ để lấy lô message mới và báo cho coordinator biết luồng xử lý chính vẫn đang hoạt động.
- **`max.poll.interval.ms`** quy định khoảng thời gian tối đa cho phép giữa hai lần gọi `poll()` liên tiếp. Nếu ứng dụng xử lý lô message quá chậm (như gọi API ngoài bị nghẽn hoặc truy vấn database nặng) làm thời gian giữa hai lần `poll()` vượt ngưỡng này, coordinator sẽ coi consumer đã gặp sự cố, loại nó khỏi group và kích hoạt rebalance.
- **`max.poll.records`** giới hạn số lượng record tối đa mà một lần gọi `poll()` trả về. Giảm giá trị này giúp mỗi lô nhỏ hơn, xử lý nhanh hơn và gọi `poll()` kịp hạn.
- **Cạm bẫy**: Tăng `max.poll.interval.ms` quá lớn một cách mù quáng sẽ khiến coordinator phát hiện lỗi chậm khi consumer bị kẹt thật (deadlock hoặc treo kết nối), để lại các partition không ai đọc trong thời gian dài.

</details>

### Câu Hỏi 3: Heartbeat trong Kafka consumer hoạt động như thế nào? Phân biệt `session.timeout.ms` với `heartbeat.interval.ms` và nêu các nguyên nhân làm mất heartbeat dù tiến trình consumer chưa tắt?

<details>
<summary>Đáp án</summary>

- **Heartbeat** là tín hiệu định kỳ mà một luồng nền (background thread) của consumer gửi tới group coordinator để chứng minh phiên làm việc vẫn sống.
- **`session.timeout.ms`** là khoảng thời gian tối đa coordinator chờ heartbeat từ consumer trước khi đánh dấu mất kết nối và bắt đầu rebalance.
- **`heartbeat.interval.ms`** xác định tần suất gửi heartbeat. Giá trị này phải nhỏ hơn `session.timeout.ms` (thực tế khuyến nghị không vượt quá **1/3** `session.timeout.ms`) để consumer có nhiều cơ hội gửi lại trước khi hết phiên.
- **Nguyên nhân mất heartbeat dù tiến trình chưa tắt**: Mạng bị gián đoạn tạm thời, container bị bóp CPU (CPU throttling), hoặc ứng dụng JVM bị dừng toàn cục để dọn rác (GC pause) kéo dài hơn `session.timeout.ms`.

</details>

### Câu Hỏi 4: Vì sao tình trạng Pod restart liên tục trên Kubernetes lại dẫn đến vòng lặp rebalance liên hoàn?

<details>
<summary>Đáp án</summary>

- Khi Pod chạy consumer gặp sự cố như tràn bộ nhớ (`OOMKilled`), lỗi ứng dụng (`CrashLoopBackOff`), hoặc kiểm tra sức khỏe (`livenessProbe`) thất bại lặp đi lặp lại, container sẽ bị khởi động lại liên tiếp.
- Mỗi lần consumer mất phiên hoặc rời nhóm rồi Pod mới khởi động và tham gia lại vào consumer group, group coordinator đều phải kích hoạt rebalance để điều chỉnh danh sách thành viên. Chuỗi restart không dứt dẫn đến vòng lặp rebalance liên hoàn.

</details>

### Câu Hỏi 5: Hệ quả "Stop-the-World Pause" khi rebalance là gì, và chiến lược `CooperativeStickyAssignor` giúp hạn chế tác động này như thế nào?

<details>
<summary>Đáp án</summary>

- Với chiến lược gán partition truyền thống (**eager rebalancing**), toàn bộ consumer trong group phải thu hồi toàn bộ partition đang giữ và ngừng đọc dữ liệu cho tới khi vòng chia lại kết thúc (hiện tượng **stop-the-world pause**). Khi rebalance lặp lại liên tục, thời gian consumer đứng hình cộng dồn khiến consumer lag tăng vọt.
- Với chiến lược **`CooperativeStickyAssignor`** (**cooperative rebalancing**), consumer chỉ thu hồi và chuyển giao những partition thực sự cần đổi chủ, giúp các partition còn lại vẫn tiếp tục được xử lý trong lúc rebalance.

</details>

### Câu Hỏi 6: Cơ chế nào dẫn đến xử lý trùng tin (Duplicate Message Processing) khi rebalance xảy ra, và vì sao ứng dụng consumer nên thiết kế theo hướng idempotent?

<details>
<summary>Đáp án</summary>

- **Commit offset** là thao tác ghi nhận vị trí message đã xử lý xong lên Kafka (tự động theo `enable.auto.commit=true` và `auto.commit.interval.ms`, hoặc ứng dụng tự gọi lệnh commit).
- Nếu consumer đã xử lý xong một phần hoặc toàn bộ lô message nhưng bị loại khỏi group trước khi kịp commit offset mới, thành viên khác nhận lại partition sẽ đọc lại từ offset đã commit gần nhất, khiến các message đó bị xử lý trùng lặp.
- Vì rebalance vẫn có thể xảy ra bất ngờ khi node Kubernetes gặp sự cố hoặc mạng chập chờn, ứng dụng cần thiết kế **idempotent** (xử lý lặp lại cùng một tin nhắn vẫn cho kết quả an toàn như xử lý một lần).

</details>

### Câu Hỏi 7: Trong quá trình Rolling Update của Kubernetes `Deployment`, cơ chế kết thúc Pod bằng `SIGTERM`, `terminationGracePeriodSeconds` và `SIGKILL` hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- Khi thực hiện rolling update, controller tạo các Pod mới đồng thời yêu cầu kết thúc các Pod cũ theo từng đợt.
- Khi dừng một Pod, kubelet gửi tín hiệu **`SIGTERM`** tới tiến trình trong container và chờ trong khoảng **`terminationGracePeriodSeconds`** (mặc định là **30 giây**) trước khi gửi **`SIGKILL`** để ép buộc dừng.
- Nếu ứng dụng không bắt `SIGTERM` hoặc thời gian xử lý nốt lô dữ liệu và commit offset vượt quá `terminationGracePeriodSeconds`, Pod sẽ bị ngắt ngang bằng `SIGKILL`, làm offset chưa kịp commit và gây xử lý trùng tin khi Pod mới tiếp quản partition.

</details>

### Câu Hỏi 8: Để thực hiện Graceful Shutdown hiệu quả với dynamic membership, ứng dụng Kafka consumer cần thực hiện các bước nào sau khi nhận tín hiệu `SIGTERM`?

<details>
<summary>Đáp án</summary>

Khi bắt được tín hiệu `SIGTERM` (trước khi hết `terminationGracePeriodSeconds`), ứng dụng cần:
1. Dừng vòng lặp `poll()` mới.
2. Hoàn tất xử lý lô message đang dở trong bộ nhớ.
3. Thực hiện commit offset.
4. Gọi `close()` (với dynamic membership — tức không đặt `group.instance.id`, consumer sẽ chủ động gửi yêu cầu `LeaveGroup` để coordinator chia lại partition ngay thay vì phải chờ hết `session.timeout.ms`).

</details>

### Câu Hỏi 9: Static Membership (`group.instance.id`) hoạt động như thế nào và phù hợp với trường hợp nào?

<details>
<summary>Đáp án</summary>

- Cấu hình **`group.instance.id`** (Static Membership) gán cho consumer một định danh cố định.
- Nếu Pod hoặc tiến trình khởi động lại và kết nối lại **trước khi hết `session.timeout.ms`**, group coordinator sẽ giữ nguyên phần partition cũ cho nó mà không kích hoạt rebalance.
- Tính năng này phù hợp cho các workload có định danh ổn định (ví dụ `StatefulSet`) khi một instance chỉ cần restart nhanh trong khoảng `session.timeout.ms`.

</details>

### Câu Hỏi 10: Cách dùng lệnh `kafka-consumer-groups.sh` để kiểm tra consumer group và dấu hiệu nào trong output cho thấy group đang bị rebalance liên tục hoặc mất ổn định?

<details>
<summary>Đáp án</summary>

- Chạy lệnh với cờ `--describe` để xem phân công partition, độ trễ (`LAG`) và các thành viên trong group:
  ```bash
  bin/kafka-consumer-groups.sh \
    --bootstrap-server localhost:9092 \
    --describe \
    --group order-processor
  ```
- **Dấu hiệu bất thường**: Xuất hiện dấu `-` ở cột `CONSUMER-ID` trong lúc các Pod vẫn đang chạy, hoặc `CONSUMER-ID` đổi liên tục giữa các lần chạy lệnh, đồng thời chỉ số `LAG` tăng nhanh.

</details>
