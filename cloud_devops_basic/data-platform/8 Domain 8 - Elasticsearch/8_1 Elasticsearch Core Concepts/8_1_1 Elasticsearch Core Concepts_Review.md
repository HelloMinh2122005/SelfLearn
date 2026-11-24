# Review: 8_1_1 Elasticsearch Core Concepts

### Câu Hỏi 1: Document, Field, `_id` và Index trong Elasticsearch là gì?

<details>
<summary>Đáp án</summary>

- **Document**: Là đơn vị dữ liệu cơ bản nhất trong Elasticsearch, được biểu diễn dưới dạng một đối tượng **JSON**.
- **Field**: Là các cặp khóa–giá trị nằm bên trong một document.
- **`_id`**: Là trường metadata dùng để định danh duy nhất cho mỗi document trong một index.
- **Index**: Là tập hợp logic các document có đặc điểm tương đồng (ví dụ `app-logs`), đóng vai trò không gian tên để lưu trữ, cấu hình và tìm kiếm dữ liệu.

</details>

### Câu Hỏi 2: Mô hình dữ liệu của Elasticsearch khác với CSDL quan hệ (SQL) ở điểm nào về phép `JOIN` và cách tổ chức dữ liệu?

<details>
<summary>Đáp án</summary>

- Elasticsearch **không hỗ trợ phép `JOIN` kiểu SQL** xuyên suốt các index ở thời điểm truy vấn thông thường.
- Để tối ưu tốc độ tìm kiếm, dữ liệu trong Elasticsearch thường được **phi chuẩn hóa (denormalize)** ngay bên trong từng document.

</details>

### Câu Hỏi 3: Trong Elasticsearch 8.x, việc ghi document bằng `PUT /<index>/_doc/<id>` khác gì với `POST /<index>/_doc`?

<details>
<summary>Đáp án</summary>

- **`PUT /<index>/_doc/<id>`**: Dùng để tạo mới hoặc **ghi đè toàn bộ** document với một `_id` do bạn xác định trước (nếu chạy lại cùng `_id` sẽ ghi đè document cũ).
- **`POST /<index>/_doc`**: Dùng khi muốn Elasticsearch **tự động sinh giá trị `_id`** cho document mới.

</details>

### Câu Hỏi 4: Inverted index (chỉ mục ngược) ở tầng Apache Lucene hoạt động như thế nào?

<details>
<summary>Đáp án</summary>

- Ở tầng lưu trữ bên dưới, mỗi shard của Elasticsearch là một **Apache Lucene** index sử dụng cấu trúc **inverted index**.
- Cấu trúc này **ánh xạ trực tiếp từng thuật ngữ (`term`) tới danh sách các document có chứa thuật ngữ đó**, giúp tìm kiếm hoàn tất trong vài mili-giây mà không phải quét tuần tự qua từng dòng dữ liệu.

</details>

### Câu Hỏi 5: Analyzer xử lý trường kiểu `text` qua những bước nào và vì sao tìm `"Error"` vẫn khớp với document chứa `"error"`?

<details>
<summary>Đáp án</summary>

- Khi lập chỉ mục trường `text`, **Analyzer** thực hiện 2 bước trước khi ghi vào inverted index:
  1. Qua **tokenizer** để chia chuỗi văn bản thành từng từ/token.
  2. Qua các **token filter** để chuẩn hóa (ví dụ chuyển về chữ thường lowercase).
- Chuỗi tìm kiếm trên trường `text` cũng đi qua bước phân tích tương tự, nên truy vấn `"Error"` được chuẩn hóa giống `"error"` trong chỉ mục và vẫn khớp kết quả.

</details>

### Câu Hỏi 6: Hai kiểu dữ liệu `text` và `keyword` khác nhau như thế nào và phù hợp với bài toán nào?

<details>
<summary>Đáp án</summary>

- **`text`**: Đi qua analyzer tách từ và chuẩn hóa; dùng cho văn bản tự do để tìm kiếm **full-text** theo từ khóa trong câu (ví dụ `message`).
- **`keyword`**: Không qua analyzer tách từ mà lưu nguyên vẹn toàn bộ chuỗi; phù hợp cho **khớp chính xác (exact match)**, **sắp xếp (`sort`)** và **gom nhóm (`aggregation`)** (ví dụ `service`, `level`, mã lỗi, ID).

</details>

### Câu Hỏi 7: Mapping và Dynamic mapping trong Elasticsearch là gì?

<details>
<summary>Đáp án</summary>

- **Mapping**: Là bản thiết kế schema quy định danh sách các field và kiểu dữ liệu tương ứng (`text`, `keyword`, `date`, `long`, `boolean`, ...) trong một index.
- **Dynamic mapping**: Là cơ chế tự động suy đoán và gán kiểu dữ liệu cho một field chưa được khai báo trước dựa trên giá trị JSON đầu tiên nhận được khi ghi.

</details>

### Câu Hỏi 8: Dynamic mapping mang lại những rủi ro gì trong thực tế?

<details>
<summary>Đáp án</summary>

1. **Gán sai kiểu dữ liệu**: Ví dụ số cổng gửi dưới dạng chuỗi `"8080"` bị cố định thành `text` thay vì kiểu số.
2. **Mapping explosion**: Khi ghi log JSON có các khóa động (ví dụ `meta.<request_uuid>`), số lượng field tăng không kiểm soát vượt ngưỡng mặc định `index.mapping.total_fields.limit` (**1.000 field mỗi index**), làm tăng mạnh bộ nhớ heap, tăng chi phí đồng bộ cluster state và làm tê liệt việc index mới.

</details>

### Câu Hỏi 9: Khi cần đổi kiểu dữ liệu của một field đã tồn tại trên index đang có dữ liệu, bạn phải làm thế nào?

<details>
<summary>Đáp án</summary>

- Không thể sửa trực tiếp kiểu dữ liệu của field đã tồn tại trên index có dữ liệu.
- Bạn cần **tạo một index mới** với mapping đúng, sau đó sao chép dữ liệu từ index cũ sang index mới bằng API **`_reindex`**.

</details>

### Câu Hỏi 10: Primary shard và Replica shard là gì, mặc định có bao nhiêu shard khi tạo index từ Elasticsearch 7.x/8.x, và Replica mang lại lợi ích gì?

<details>
<summary>Đáp án</summary>

- **Primary shard**: Phần dữ liệu được chia ngang của một index; mỗi primary shard là một Lucene index độc lập và có thể nằm trên một node khác nhau. Mặc định từ Elasticsearch 7.x/8.x là **1 primary shard**.
- **Replica shard**: Bản sao hoàn chỉnh của một primary shard (mặc định **1 replica**).
- **Lợi ích của replica**:
  1. Tăng **độ sẵn sàng (high availability)** khi node chứa primary gặp sự cố.
  2. Tăng **năng lực đọc** nhờ phục vụ song song các truy vấn tìm kiếm.

</details>

### Câu Hỏi 11: Vì sao một cluster chỉ có 1 node nhưng tạo index với `number_of_replicas: 1` lại có trạng thái `yellow`? Dữ liệu có bị mất không và cách xử lý là gì?

<details>
<summary>Đáp án</summary>

- **Nguyên nhân trạng thái `yellow`**: Elasticsearch **không bao giờ đặt replica shard trên cùng node với primary shard tương ứng**. Khi cluster chỉ có 1 node, replica không có node thứ hai để phân bổ nên rơi vào trạng thái `unassigned`, khiến sức khỏe cluster ở mức `yellow`.
- **Dữ liệu có bị mất không?**: Không, vì các primary shard vẫn hoạt động và lưu đủ dữ liệu.
- **Cách xử lý**: Trên môi trường lab 1 node, dùng API `_settings` để đặt `number_of_replicas: 0`; trên production đa node, cần có thêm node khác để cluster tự phân bổ replica (khuyến nghị tối thiểu 1 replica để chịu lỗi).

</details>

### Câu Hỏi 12: Số lượng primary shard và replica shard có thể thay đổi sau khi tạo index không? Oversharding là gì và gây tác hại gì?

<details>
<summary>Đáp án</summary>

- **Thay đổi số shard**:
  - **Primary shard (`number_of_shards`)**: Được cố định lúc tạo index; muốn đổi trên dữ liệu có sẵn phải dùng thao tác chuyên biệt như `_split`, `_shrink` hoặc `_reindex`.
  - **Replica shard (`number_of_replicas`)**: Thay đổi được bất kỳ lúc nào qua API `_settings`.
- **Oversharding**: Là việc chia quá nhiều shard nhỏ cho lượng dữ liệu ít, gây lãng phí bộ nhớ heap, file descriptor và chi phí điều phối vì mỗi shard tiêu tốn tài nguyên quản lý riêng.

</details>

### Câu Hỏi 13: Trong Query DSL (`_search`), các truy vấn `match`, `term`, `range` và 4 mệnh đề của `bool` dùng để làm gì?

<details>
<summary>Đáp án</summary>

- **`match`**: Phân tích chuỗi tìm kiếm để tìm **full-text** trên trường `text`.
- **`term`**: Tìm **khớp chính xác** giá trị chưa phân tích (thường dùng trên trường `keyword`).
- **`range`**: Lọc dữ liệu theo khoảng giá trị số hoặc thời gian (ví dụ `gte`).
- **4 mệnh đề của `bool`**:
  - `must`: Bắt buộc khớp và **có tính điểm** liên quan.
  - `filter`: Bắt buộc khớp và **không tính điểm**.
  - `should`: Nên khớp để tăng điểm.
  - `must_not`: Loại trừ (không khớp) và **không tính điểm**.

</details>

### Câu Hỏi 14: Query context và Filter context trong truy vấn `bool` khác nhau như thế nào?

<details>
<summary>Đáp án</summary>

- **Query context (`must`, `should`)**: Đánh giá mức độ liên quan của document để tính điểm **`_score`**.
- **Filter context (`filter`, `must_not`)**: Chỉ kiểm tra đúng/sai (có khớp hay không), **bỏ qua việc tính `_score`** và được Elasticsearch **tự động cache** để tăng tốc cho các bộ lọc lặp lại.

</details>

### Câu Hỏi 15: Aggregation (`aggs`) trong Elasticsearch dùng để làm gì?

<details>
<summary>Đáp án</summary>

- **Aggregation (`aggs`)** cho phép **thống kê, đếm và gom nhóm dữ liệu** ngay trong truy vấn `_search`.
- Ví dụ: Dùng `terms` aggregation để đếm số lượng log theo từng `level` hoặc `service`, hoặc dùng `date_histogram` để gom nhóm dữ liệu theo mốc thời gian.

</details>

### Câu Hỏi 16: Phân trang với `from`/`size` có giới hạn mặc định là bao nhiêu và khi cần duyệt sâu dữ liệu lớn thì dùng giải pháp nào?

<details>
<summary>Đáp án</summary>

- Cặp `from`/`size` bị giới hạn mặc định bởi tham số `index.max_result_window` là **10.000 kết quả** nhằm tránh quá tải bộ nhớ (vượt trần này sẽ gây lỗi).
- Khi cần duyệt sâu dữ liệu lớn, cần sử dụng **`search_after`** dựa trên giá trị **`sort`** (bao gồm trường sắp xếp duy nhất) của bản ghi cuối trang trước.

</details>

### Câu Hỏi 17: Vì sao Elasticsearch được gọi là Near Real-Time và thao tác `refresh` hoạt động ra sao?

<details>
<summary>Đáp án</summary>

- Khi mới ghi, document nằm trong **memory buffer** nên **chưa thể tìm thấy ngay** qua `_search`.
- Chỉ sau thao tác **refresh** để tạo **Lucene segment** mới (mặc định diễn ra mỗi **1 giây** theo `index.refresh_interval: 1s`), dữ liệu mới xuất hiện trong kết quả tìm kiếm.

</details>

### Câu Hỏi 18: Translog có vai trò gì đối với độ bền dữ liệu trong Elasticsearch?

<details>
<summary>Đáp án</summary>

- Vì Lucene segment mới tạo sau refresh chưa chắc đã được ghi bền vững xuống đĩa (`flush`), mọi thao tác ghi đều được **ghi nối tiếp vào translog**.
- Nhờ translog, Elasticsearch tránh được mất dữ liệu khi node gặp sự cố sập nguồn và có thể **phục hồi lại các thay đổi chưa được flush** lúc khởi động lại.

</details>
