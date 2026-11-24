# Review: 7_2_5 Disk Retention and Capacity

### Câu Hỏi 1: Kafka lưu dữ liệu của các partition tại đâu trên broker, và một log segment gồm những thành phần tệp nào?

<details>
<summary>Đáp án</summary>

- **Thư mục lưu log**: Kafka lưu dữ liệu của các partition trên đĩa tại những thư mục được khai báo trong cấu hình broker `log.dirs` (hoặc `log.dir`).
- **Log segment**: Dữ liệu của mỗi partition được chia thành nhiều đoạn tệp nối tiếp nhau gọi là log segment, gồm:
  - Tệp dữ liệu `.log`
  - Các tệp chỉ mục offset và thời gian đi kèm như `.index` và `.timeindex`.

</details>

### Câu Hỏi 2: Chính sách xóa mặc định `cleanup.policy=delete` hoạt động như thế nào và thời gian giữ dữ liệu mặc định ở mức broker là bao lâu?

<details>
<summary>Đáp án</summary>

- Với giá trị mặc định `cleanup.policy=delete`, broker sẽ tự động xóa các log segment cũ khi chúng vượt quá giới hạn thời gian hoặc giới hạn dung lượng đã cấu hình.
- Nếu không cấu hình riêng cho từng topic, broker sử dụng tham số mặc định ở mức broker là `log.retention.hours` với giá trị mặc định `168` giờ (tương đương 7 ngày), ngoài ra cũng có các tham số như `log.retention.minutes` hoặc `log.retention.ms`.

</details>

### Câu Hỏi 3: Tham số `retention.ms` và `retention.bytes` ở mức topic có tác dụng gì? Phạm vi áp dụng và giá trị mặc định của `retention.bytes` là gì?

<details>
<summary>Đáp án</summary>

- **`retention.ms`**: Quy định thời gian tối đa tính bằng mili-giây mà một log segment được giữ lại trên đĩa trước khi bị xóa. Giá trị này ở mức topic sẽ ghi đè cấu hình mặc định của broker.
- **`retention.bytes`**: Quy định kích thước tối đa tính bằng byte trước khi các segment cũ bị xóa.
  - **Phạm vi áp dụng**: Tính cho **mỗi partition**, không phải tổng dung lượng của toàn bộ topic. (Ví dụ: topic có 6 partition, `replication-factor = 3`, đặt `retention.bytes = 5 GiB` thì tổng dung lượng tối đa toàn cluster có thể lên tới `6 × 3 × 5 GiB = 90 GiB`, chưa tính active segment).
  - **Giá trị mặc định**: `-1` (không giới hạn dung lượng).

</details>

### Câu Hỏi 4: Khi tất cả consumer đã đọc xong dữ liệu (lag bằng 0), Kafka có tự động xóa dữ liệu đó để giải phóng dung lượng đĩa không? Vì sao?

<details>
<summary>Đáp án</summary>

- **Không.** Khác với hàng đợi truyền thống xóa tin nhắn ngay sau khi người nhận đọc xong, cơ chế retention trong Kafka hoàn toàn độc lập với consumer.
- Broker không xóa bản ghi chỉ vì consumer đã đọc xong; dữ liệu vẫn nằm trên đĩa cho tới khi vượt quá ngưỡng thời gian hoặc dung lượng của chính sách retention.

</details>

### Câu Hỏi 5: Điều gì xảy ra khi một thư mục trong `log.dirs` hết dung lượng trống, và đâu là những nguyên nhân thường gặp khiến đĩa broker bị đầy?

<details>
<summary>Đáp án</summary>

- **Hậu quả**: Khi thư mục trong `log.dirs` hết dung lượng trống, broker gặp lỗi ghi I/O, không thể nhận thêm bản ghi vào các partition nằm trên đĩa đó và có thể đánh dấu thư mục log ngoại tuyến hoặc ngừng phục vụ các partition liên quan.
- **Bốn nguyên nhân thường gặp nhất**:
  1. **Retention quá dài hoặc không giới hạn dung lượng**: Giữ mặc định 7 ngày và `retention.bytes=-1` cho các topic lưu lượng lớn khiến dữ liệu tích lũy vượt quá dung lượng ổ đĩa.
  2. **Lưu lượng ghi hoặc số topic tăng đột biến**: Producer đẩy dữ liệu nhanh hơn dự toán (do sự cố retry, bật debug log hoặc chiến dịch cao điểm).
  3. **Consumer chậm hoặc nhầm lẫn về cơ chế xóa**: Dữ liệu vẫn nằm trên đĩa theo retention kể cả khi consumer đọc chậm hoặc đã đọc xong.
  4. **Phân bố partition không đều**: Một số partition nhận lượng bản ghi quá lớn (hot key) hoặc nhiều replica tập trung trên cùng một đĩa `log.dirs` khiến đĩa đó đầy trước các đĩa khác.

</details>

### Câu Hỏi 6: Vì sao tuyệt đối không được dùng lệnh `rm` để xóa tay các tệp `.log` trên đĩa khi broker bị đầy?

<details>
<summary>Đáp án</summary>

Tuyệt đối không xóa tay tệp `.log` trên đĩa vì hai lý do kỹ thuật cốt lõi:
1. **Phá vỡ tính nhất quán giữa dữ liệu và metadata**: Kafka quản lý mỗi partition bằng bộ tệp dữ liệu (`.log`) và các tệp chỉ mục offset/thời gian (`.index`, `.timeindex`) đồng bộ với trạng thái offset trong bộ nhớ broker. Xóa tay sẽ phá vỡ sự đồng bộ này.
2. **Nguy cơ hỏng partition và lỗi khởi động**: Khi tính nhất quán của bộ tệp segment hoặc chỉ mục bị phá vỡ, broker có thể gặp lỗi đọc/ghi, làm hỏng trạng thái partition hoặc không thể khởi động lại bình thường.

</details>

### Câu Hỏi 7: Quy trình xử lý an toàn khi đĩa broker sắp đầy gồm những bước nào và sử dụng các công cụ CLI nào?

<details>
<summary>Đáp án</summary>

Mọi thao tác xóa dữ liệu phải để tiến trình nền của broker thực hiện thông qua quy trình 5 bước:
1. **Đo dung lượng thực tế**: Dùng `kafka-log-dirs.sh --bootstrap-server <host:port> --describe` (có thể thêm `--topic-list <topic>`) để xác định topic và partition đang chiếm nhiều đĩa nhất.
2. **Giảm retention tạm thời (nếu nghiệp vụ cho phép bỏ dữ liệu cũ)**: Dùng `kafka-configs.sh --bootstrap-server <host:port> --entity-type topics --entity-name <topic> --alter --add-config ...` để hạ `retention.ms` hoặc đặt `retention.bytes` thấp hơn (không cần khởi động lại broker).
3. **Chờ broker tự xóa segment cũ**: Để broker tự quét và xóa các segment đủ điều kiện theo chu kỳ `log.retention.check.interval.ms`, sau đó kiểm tra lại bằng `kafka-log-dirs.sh --describe`.
4. **Khôi phục cấu hình sau sự cố (nếu vừa hạ tạm)**: Dùng `--delete-config` trong `kafka-configs.sh` để gỡ bỏ giá trị ghi đè và đưa topic về cấu hình mặc định của broker.
5. **Mở rộng hạ tầng (nếu không được phép cắt ngắn retention)**: Mở rộng dung lượng volume gắn cho `log.dirs`, hoặc bổ sung broker mới rồi phân bố lại partition bằng `kafka-reassign-partitions.sh`.

</details>

### Câu Hỏi 8: Chu kỳ kiểm tra xóa segment của broker mặc định là bao lâu, và vì sao đôi khi sau khi hạ `retention.ms` dung lượng đĩa vẫn chưa giảm ngay?

<details>
<summary>Đáp án</summary>

- **Chu kỳ kiểm tra mặc định**: Broker kiểm tra định kỳ các segment đủ điều kiện xóa theo tham số `log.retention.check.interval.ms` với giá trị mặc định là `300000` ms (tức 5 phút).
- **Hai nguyên nhân khiến đĩa chưa giảm ngay sau khi hạ `retention.ms`**:
  1. Broker chưa đến chu kỳ quét tiếp theo (theo `log.retention.check.interval.ms`).
  2. Dữ liệu đang nằm trong **active segment** (segment đang được ghi hiện tại). Kafka không bao giờ xóa active segment kể cả khi dữ liệu trong đó đã vượt `retention.ms`, mà chỉ xóa các **closed segment** (segment đã đóng). Trên topic lưu lượng rất thấp, nếu `segment.bytes` quá lớn khiến segment mãi chưa đầy để đóng lại, dung lượng sẽ chưa được giải phóng ngay.

</details>

### Câu Hỏi 9: Công thức ước lượng dung lượng đĩa tối thiểu cho một topic là gì, và vì sao trong thực tế cần cộng thêm headroom?

<details>
<summary>Đáp án</summary>

- **Công thức ước lượng dung lượng tối thiểu**:
  `Dung lượng tối thiểu = Tốc độ ghi (write rate) × Thời gian retention × Replication Factor`
  *(Trong đó tốc độ ghi và thời gian retention phải quy đổi về cùng đơn vị thời gian, ví dụ MB/giây và giây).*
- **Lý do cần cộng thêm dung lượng dự phòng (headroom)**: Để dự trù dung lượng cho active segment chưa đóng, các tệp chỉ mục/metadata, và các đợt tăng trưởng lưu lượng ghi đột biến.

</details>

### Câu Hỏi 10: Trong môi trường Production, những thực tiễn tốt nào giúp phòng tránh và xử lý chủ động sự cố đầy đĩa Kafka broker?

<details>
<summary>Đáp án</summary>

Ba thực tiễn tốt được khuyến nghị trong Production gồm:
1. **Đặt ngưỡng cảnh báo sớm**: Theo dõi dung lượng sử dụng của các thư mục `log.dirs` và kích hoạt cảnh báo sớm trước khi đầy (thường ở mức **75–85%**) để có đủ thời gian giảm retention hoặc mở rộng volume trước khi broker dừng nhận ghi.
2. **Luôn tính đủ Replication Factor và Headroom**: Khi cấp phát ổ đĩa ngay từ đầu, luôn áp dụng công thức nhân với `Replication Factor` và cộng thêm phần dự phòng cho active segment, file chỉ mục và lưu lượng đột biến.
3. **Lên kế hoạch mở rộng song song**: Với dữ liệu mang tính tuân thủ hoặc kiểm toán không thể giảm retention, ưu tiên mở rộng volume đĩa hoặc thêm broker và phân bố lại partition bằng `kafka-reassign-partitions.sh`.

</details>
