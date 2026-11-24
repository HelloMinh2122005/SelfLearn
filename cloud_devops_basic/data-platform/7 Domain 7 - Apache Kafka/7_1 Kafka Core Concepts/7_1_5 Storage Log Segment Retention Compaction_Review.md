# Review: 7_1_5 Storage Log Segment Retention Compaction

### Câu Hỏi 1: Cấu trúc lưu trữ của một partition trên đĩa broker là gì, và tại sao Kafka chia partition thành nhiều tệp log segment thay vì dùng một tệp khổng lồ duy nhất?

<details>
<summary>Đáp án</summary>

Mỗi partition trong Kafka là một nhật ký có thứ tự, bất biến và chỉ ghi nối thêm vào cuối (**append-only commit log**), được lưu trữ thành nhiều tệp **log segment** trên đĩa cứng của broker.

Việc chia nhỏ partition thành nhiều segment giúp Kafka dễ dàng dọn dẹp (xóa) hoặc nén dữ liệu cũ theo từng tệp hoàn chỉnh thay vì phải sửa đổi trực tiếp bên trong một tệp khổng lồ duy nhất.

</details>

### Câu Hỏi 2: Active segment là gì và Kafka dựa vào những điều kiện nào để xoay vòng (roll) sang một tệp segment mới?

<details>
<summary>Đáp án</summary>

**Active segment** là tệp segment đang mở ở hiện tại, nơi mọi dữ liệu mới được ghi nối thêm vào cuối.

Kafka đóng active segment hiện tại và mở một tệp segment mới khi đạt một trong hai ngưỡng sau:
- **Theo dung lượng (`segment.bytes`)**: Khi active segment đạt ngưỡng dung lượng cấu hình (mặc định `1073741824` byte, tức **1 GiB**).
- **Theo thời gian (`segment.ms`)**: Khi active segment chưa đầy dung lượng nhưng đã tồn tại lâu hơn ngưỡng thời gian cấu hình (mặc định `604800000` ms, tức **7 ngày**).

</details>

### Câu Hỏi 3: Ba cơ chế nào phối hợp với hệ điều hành giúp Kafka đạt thông lượng cao và độ trễ thấp dù lưu mọi thông điệp trực tiếp xuống đĩa cứng?

<details>
<summary>Đáp án</summary>

Kafka đạt tốc độ đọc/ghi cao trên đĩa nhờ 3 cơ chế:
1. **Ghi tuần tự (Sequential I/O)**: Chỉ ghi nối tiếp vào cuối tệp log thay vì ghi rải rác ở các vị trí ngẫu nhiên, tận dụng tối đa khả năng tối ưu đọc/ghi tuyến tính của đĩa và hệ điều hành.
2. **OS Page Cache**: Ghi và đọc dữ liệu thông qua vùng nhớ đệm trang của nhân hệ điều hành thay vì tự quản lý bộ đệm lớn trong JVM heap.
3. **Zero-copy (`sendfile`)**: Chuyển byte trực tiếp từ page cache ra socket mạng cho consumer mà không sao chép trung gian qua vùng nhớ ứng dụng.

</details>

### Câu Hỏi 4: Vì sao Kafka dùng OS Page Cache thay cho JVM Heap, và điều này dẫn đến thực hành tốt nào khi cấp phát RAM cho Kafka broker?

<details>
<summary>Đáp án</summary>

Việc dùng **OS Page Cache** giúp Kafka:
- Tránh áp lực thu gom rác (Garbage Collection) của JVM.
- Giữ nguyên dữ liệu đệm trong RAM ngay cả khi tiến trình broker khởi động lại (miễn là hệ điều hành không tắt).

**Thực hành tốt trong Production**: Không cấp toàn bộ RAM của máy chủ cho JVM heap (`-Xmx`) của Kafka broker; phần lớn RAM trống nên để hệ điều hành dùng làm OS page cache nhằm tối ưu tốc độ đọc/ghi.

</details>

### Câu Hỏi 5: Cơ chế Zero-copy (`sendfile`) hoạt động như thế nào khi Kafka gửi dữ liệu cho consumer?

<details>
<summary>Đáp án</summary>

Khi gửi dữ liệu từ đĩa qua mạng cho consumer, Kafka tận dụng lời gọi hệ thống `sendfile` để chuyển các byte trực tiếp từ **OS page cache** ra **socket mạng**, bỏ qua việc sao chép trung gian qua vùng nhớ ứng dụng (user-space).

</details>

### Câu Hỏi 6: Trong chính sách mặc định `cleanup.policy=delete`, hai tham số `retention.ms` và `retention.bytes` có ý nghĩa và giá trị mặc định là gì?

<details>
<summary>Đáp án</summary>

Khi dùng `cleanup.policy=delete` (mặc định), Kafka tự động loại bỏ các segment cũ khi vượt quá giới hạn:
- **`retention.ms`**: Khoảng thời gian tối đa Kafka giữ lại log trước khi loại bỏ các segment cũ; giá trị mặc định là `604800000` ms (**7 ngày**).
- **`retention.bytes`**: Kích thước tối đa mà một **partition** được phép phình to trước khi xóa các segment cũ; giá trị mặc định là `-1` (**không giới hạn dung lượng**).

</details>

### Câu Hỏi 7: Chính sách retention xóa dữ liệu ở mức độ nào, và có cạm bẫy gì cần lưu ý với `retention.bytes`?

<details>
<summary>Đáp án</summary>

- **Mức độ xóa**: Retention giải phóng không gian bằng cách **xóa toàn bộ các tệp log segment cũ đã quá hạn**, chứ không tìm và xóa từng bản ghi đơn lẻ.
- **Cạm bẫy với `retention.bytes`**: `retention.bytes` được áp dụng **trên từng partition**, không phải tổng dung lượng của cả topic. Nếu một topic có 10 partition, hệ số sao lưu là 3 và đặt `retention.bytes` là 1 GiB, tổng dung lượng đĩa tối đa cụm broker phải chứa cho topic đó có thể lên tới 30 GiB (chưa tính các tệp chỉ mục và ngưỡng xoay vòng segment).

</details>

### Câu Hỏi 8: Log compaction (`cleanup.policy=compact`) hoạt động như thế nào, yêu cầu gì ở dữ liệu đầu vào và phù hợp cho bài toán nào?

<details>
<summary>Đáp án</summary>

- **Cơ chế**: Log compaction đảm bảo trong một partition, Kafka luôn giữ lại ít nhất **giá trị mới nhất cho mỗi message key**, thay vì giữ toàn bộ lịch sử thay đổi.
- **Yêu cầu đầu vào**: Các bản ghi gửi vào compacted topic cần có **key** để log compaction có thể gom nhóm và giữ lại giá trị mới nhất theo từng đối tượng.
- **Ứng dụng**: Phù hợp cho các bài toán chỉ cần biết **trạng thái hiện tại** của từng đối tượng, như khôi phục trạng thái ứng dụng sau sự cố hoặc lưu trữ changelog (ví dụ: bảng ánh xạ hồ sơ người dùng, cấu hình hệ thống).

</details>

### Câu Hỏi 9: Để xóa hoàn toàn một key khỏi compacted topic, producer cần gửi gì và tham số `delete.retention.ms` có vai trò gì?

<details>
<summary>Đáp án</summary>

- Producer cần gửi một bản ghi **tombstone**: bản ghi mang **key** cần xóa và phần giá trị (payload) là `null`.
- Tham số **`delete.retention.ms`** (mặc định `86400000` ms, tức **24 giờ**) quy định thời gian tối thiểu Kafka giữ lại dấu xóa tombstone này để các consumer kịp nhìn thấy và xóa key khỏi trạng thái cục bộ trước khi tombstone bị dọn sạch hoàn toàn.

</details>

### Câu Hỏi 10: Tiến trình log cleaner thực hiện compaction trên phần nào của partition, có chặn hoạt động ghi/đọc chính không, và vì sao không nên kỳ vọng bản ghi trùng bị xóa ngay lập tức?

<details>
<summary>Đáp án</summary>

- Tiến trình dọn dẹp (**log cleaner**) chạy ngầm để nén các **segment cũ đã đóng ở phía sau (tail)**.
- Hoạt động này **không chặn** producer và consumer vẫn ghi/đọc bình thường trên **active segment ở phía đầu (head)**.
- Không nên kỳ vọng bản ghi trùng bị xóa ngay lập tức vì log compaction chỉ chạy định kỳ dưới nền trên các segment đã đóng ở tail, **không nén ngay** dữ liệu vừa ghi vào active segment.

</details>

### Câu Hỏi 11: Khi nào nên kết hợp cấu hình `cleanup.policy=compact,delete`?

<details>
<summary>Đáp án</summary>

Nên cấu hình `cleanup.policy=compact,delete` khi sử dụng compaction nhưng **số lượng key tăng liên tục theo thời gian** và dữ liệu quá cũ không còn cần giữ lại mãi mãi. Cấu hình này giúp vừa nén dữ liệu theo key, vừa tự động xóa các segment đã quá hạn thời gian hoặc dung lượng.

</details>

### Câu Hỏi 12: Việc xóa dữ liệu trong Kafka có phụ thuộc vào việc consumer đã đọc xong tin nhắn hay không? Điều này đem lại lợi ích gì và rủi ro gì?

<details>
<summary>Đáp án</summary>

**Không.** Kafka giữ lại bản ghi theo chính sách retention đã cấu hình, hoàn toàn độc lập với hành vi đọc của consumer (không xóa tin nhắn ngay sau khi consumer đọc xong).

- **Lợi ích**: Nhiều consumer group độc lập có thể đọc cùng một dữ liệu theo tốc độ riêng, hoặc consumer có thể tua lại offset để xử lý lại dữ liệu cũ.
- **Rủi ro**: Nếu một consumer bị đứng hoặc xử lý quá chậm khiến độ trễ (consumer lag) vượt quá ngưỡng `retention.ms` hoặc `retention.bytes`, các segment chứa tin nhắn chưa kịp đọc vẫn bị xóa bỏ, dẫn đến mất dữ liệu ở phía consumer đó. Vì vậy cần giám sát consumer lag và cấu hình `retention.ms` đủ rộng.

</details>

### Câu Hỏi 13: Trong Apache Kafka 3.x / 4.x, những công cụ CLI nào được dùng trong bài để tạo topic có cấu hình retention/compaction, cập nhật/kiểm tra cấu hình động và gửi/đọc bản ghi có key?

<details>
<summary>Đáp án</summary>

- **`kafka-topics.sh`**: Tạo topic kèm cấu hình ban đầu qua `--create` và `--config` (ví dụ `retention.ms`, `segment.bytes`, `cleanup.policy=compact`).
- **`kafka-configs.sh`**: Bổ sung hoặc thay đổi cấu hình động mức topic (`--entity-type topics --alter --add-config ...`) và kiểm tra lại cấu hình (`--describe`).
- **`kafka-console-producer.sh`**: Gửi bản ghi có key từ console (dùng `--property parse.key=true` và `--property key.separator=:`).
- **`kafka-console-consumer.sh`**: Đọc lại dữ liệu từ đầu và in cả key (`--from-beginning`, `--property print.key=true`, `--property key.separator=:`).

</details>
