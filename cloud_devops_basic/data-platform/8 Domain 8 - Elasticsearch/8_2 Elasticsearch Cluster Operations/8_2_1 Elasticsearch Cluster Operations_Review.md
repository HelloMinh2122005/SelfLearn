# Review: 8_2_1 Elasticsearch Cluster Operations

### Câu Hỏi 1: Trong một Elasticsearch cluster, các node có thể đảm nhận những vai trò (`node.roles`) chính nào và chức năng của từng vai trò là gì?

<details>
<summary>Đáp án</summary>

Các node trong cluster chia sẻ `cluster.name` và được cấu hình vai trò qua `node.roles` trong `elasticsearch.yml` (Elasticsearch 8.x):
- **Master-eligible node (`master`)**: Có quyền tham gia bầu chọn **active master** (node trưởng) để quản lý **cluster state** (danh sách node, thiết lập index, bản đồ vị trí shard).
- **Data node (`data`)**: Lưu trữ shard trên đĩa và xử lý các tác vụ CRUD, tìm kiếm và tổng hợp dữ liệu.
- **Ingest node (`ingest`)**: Chạy **ingest pipeline** để biến đổi, chuẩn hóa document trước khi đánh chỉ mục.
- **Coordinating role**: Nhận request HTTP, chuyển tới các data node và gom kết quả trả về. Mặc định mọi node đều làm nhiệm vụ này; nếu cấu hình `node.roles: []` sẽ tạo thành **coordinating-only node** chuyên biệt.

</details>

### Câu Hỏi 2: Tại sao trên môi trường production cần tách riêng **dedicated master node** khỏi **data node**?

<details>
<summary>Đáp án</summary>

Trên production, cần tách riêng **dedicated master node** (chỉ giữ role `master`) khỏi **data node** để các tác vụ tìm kiếm nặng hoặc sự cố dừng GC (garbage collection) trên data node không làm gián đoạn quá trình điều phối và quản lý cluster state của active master.

</details>

### Câu Hỏi 3: **Split-brain** là gì, công thức tính **quorum** ra sao và tại sao nên chọn số lượng master-eligible node là số lẻ (ví dụ 3 node)?

<details>
<summary>Đáp án</summary>

- **Split-brain** là tình trạng hai nhóm node bị tách mạng cùng tự nhận mình là master.
- Để tránh split-brain, cụm phải đạt **quorum** (quá bán số node có quyền bầu chọn) theo công thức `floor(N / 2) + 1` thì mới được bầu active master và sửa đổi cluster state.
- Nên chọn số master-eligible node là **số lẻ** (thường tối thiểu 3 trên production):
  - Cụm **3 node** có quorum là `2`, chịu được **1 node** lỗi.
  - Cụm **4 node** có quorum là `3`, cũng chỉ chịu được **1 node** lỗi (hễ mất 2 node là không đủ quorum), làm tăng chi phí mà không tăng độ an toàn.
  - Cụm **2 node** sẽ mất quorum ngay khi **1 node** rớt mạng.

</details>

### Câu Hỏi 4: Ba trạng thái sức khỏe cụm (`green`, `yellow`, `red`) từ `GET _cluster/health` có ý nghĩa gì, và hai chỉ số `unassigned_shards`, `active_shards_percent` cho biết điều gì?

<details>
<summary>Đáp án</summary>

Trạng thái cụm trong `GET _cluster/health` (hỗ trợ thêm `?level=indices` để xem chi tiết từng index) bằng trạng thái tệ nhất trong các index:
- **`green`**: Mọi **primary shard** và **replica shard** đều đã được gán (`STARTED`). Dữ liệu đầy đủ và có bản sao dự phòng khi 1 node gặp lỗi.
- **`yellow`**: Mọi **primary shard** đã được gán, nhưng còn ít nhất 1 **replica shard** chưa gán. Việc đọc/ghi vẫn đủ dữ liệu, nhưng mất khả năng dự phòng ở các shard đang thiếu replica.
- **`red`**: Có ít nhất 1 **primary shard** chưa được gán (`UNASSIGNED`). Một phần dữ liệu không thể truy cập và kết quả tìm kiếm bị thiếu.

Hai chỉ số cần đọc kèm:
- **`unassigned_shards`**: Tổng số shard chưa được gán.
- **`active_shards_percent`**: Tỷ lệ phần trăm shard đang hoạt động trên tổng số shard đã cấu hình.

</details>

### Câu Hỏi 5: Vì sao cluster chỉ có 1 node thường bị trạng thái `yellow` khi tạo index mới, và cách khắc phục trên dev so với production là gì?

<details>
<summary>Đáp án</summary>

Mặc định khi tạo index mới, Elasticsearch đặt `index.number_of_replicas` là `1` và không cho phép đặt replica shard trên cùng một node đang giữ primary shard của nó (quyết định từ chối `same_shard`). Do cụm chỉ có 1 node, replica shard không có node khác để đặt nên bị kẹt ở trạng thái `UNASSIGNED`, khiến cụm báo `yellow`.

Cách khắc phục:
- **Môi trường dev (1 node)**: Hạ `index.number_of_replicas` về `0` (qua API `_settings`) để đưa cụm về `green`.
- **Môi trường production**: Cần bổ sung thêm **data node** để có nơi phân bổ replica shard.

</details>

### Câu Hỏi 6: Nhóm API `_cat` gồm `_cat/nodes?v`, `_cat/indices?v` và `_cat/shards?v` dùng để xem thông tin gì, và 4 trạng thái của một shard gồm những gì?

<details>
<summary>Đáp án</summary>

Nhóm API `_cat` xuất thông tin dạng bảng (tham số `?v` giúp hiển thị tên cột):
- **`_cat/nodes?v`**: Liệt kê các node, tài nguyên và vai trò trong cụm.
- **`_cat/indices?v`**: Liệt kê từng index kèm màu sức khỏe, số shard và dung lượng.
- **`_cat/shards?v`**: Hiển thị vị trí và trạng thái của từng shard.

Bốn trạng thái của shard:
1. **`STARTED`**: Đang chạy bình thường.
2. **`INITIALIZING`**: Đang được tạo mới hoặc đang phục hồi.
3. **`RELOCATING`**: Đang chuyển từ node này sang node khác.
4. **`UNASSIGNED`**: Chưa được gán vào node nào.

</details>

### Câu Hỏi 7: Khi phát hiện có shard bị `UNASSIGNED`, ta dùng API nào để biết chính xác nguyên nhân node từ chối nhận shard?

<details>
<summary>Đáp án</summary>

Sử dụng endpoint **`GET _cluster/allocation/explain`** (có thể truyền JSON chỉ định `index`, `shard`, `primary`). API này trả về quyết định phân bổ chi tiết (`node_allocation_decisions`) giải thích lý do từng node từ chối nhận shard (ví dụ: `same_shard` hoặc vượt ngưỡng disk watermark).

</details>

### Câu Hỏi 8: Ba ngưỡng **disk watermark** mặc định trong Elasticsearch 8.x hoạt động như thế nào và cần chú ý cạm bẫy gì khi chạm ngưỡng cao nhất?

<details>
<summary>Đáp án</summary>

Ba ngưỡng **disk watermark** mặc định gồm:
1. **Low (`85%` đĩa đã dùng)**: Ngừng gán shard mới vào node này.
2. **High (`90%` đĩa đã dùng)**: Chủ động chuyển bớt shard từ node này sang node khác còn trống hơn.
3. **Flood stage (`95%` đĩa đã dùng)**: Tự động khóa `index.blocks.read_only_allow_delete: true` lên các index liên quan để chặn ghi dữ liệu mới, tránh tràn đĩa.

**Lưu ý thực tế**: Khi ổ đĩa chạm ngưỡng `95%`, sau khi giải phóng dung lượng đĩa, cần kiểm tra xem khóa `read_only_allow_delete: true` đã được gỡ để mở lại quyền ghi hay chưa trước khi tiếp tục đẩy log.

</details>

### Câu Hỏi 9: Tham số `index.unassigned.node_left.delayed_timeout` (mặc định `1m`) có tác dụng gì khi một data node rời khỏi cụm?

<details>
<summary>Đáp án</summary>

Khi một data node rời cụm (ví dụ khi khởi động lại), Elasticsearch sẽ chờ hết thời gian `index.unassigned.node_left.delayed_timeout` (mặc định `1m`) trước khi bắt đầu sao chép lại replica sang node khác. Cơ chế này giúp tiết kiệm băng thông mạng và đĩa I/O nếu node cũ nhanh chóng quay trở lại cụm.

</details>

### Câu Hỏi 10: Vì sao khi lưu trữ dữ liệu log tăng liên tục, Elasticsearch dùng **data stream** hoặc các index theo thời gian thay vì một index khổng lồ duy nhất?

<details>
<summary>Đáp án</summary>

Vì log tăng liên tục, nếu lưu vào một index khổng lồ rồi xóa từng document cũ khi hết hạn sẽ rất tốn tài nguyên I/O. Thay vào đó, việc dùng **data stream** hoặc các index chia theo thời gian cho phép khi dữ liệu hết hạn, hệ thống chỉ cần xóa nguyên **backing index** đó một cách nhanh chóng và nhẹ nhàng.

</details>

### Câu Hỏi 11: **ILM (Index Lifecycle Management)** quản lý vòng đời index qua những pha nào và hoạt động chính ở mỗi pha là gì?

<details>
<summary>Đáp án</summary>

ILM tự động hóa vòng đời index qua các pha:
- **`hot`**: Dữ liệu đang được ghi mới và truy vấn nhiều; sử dụng **`rollover`** để tự động tạo index mới khi index hiện tại đạt ngưỡng kích thước, số document hoặc tuổi.
- **`warm`**: Ngừng ghi mới và ít truy vấn hơn; có thể chuyển sang read-only, thu gọn số shard (`shrink`) hoặc gộp segment (`force merge`).
- **`cold`**: Hiếm khi truy vấn; lưu ở chế độ chỉ đọc hoặc gắn kết qua searchable snapshot.
- **`frozen`** *(tùy chọn)*: Lưu trữ trên object storage và truy vấn trực tiếp qua searchable snapshot.
- **`delete`**: Xóa hẳn index khi hết thời hạn lưu giữ (**retention**), giúp kiểm soát dung lượng đĩa tương tự mục tiêu của `retention` trong Kafka.

</details>

### Câu Hỏi 12: Khi cấu hình bộ nhớ cho Elasticsearch, cần đặt **JVM Heap** (`-Xms`, `-Xmx`) như thế nào và tại sao không nên cấp vượt quá ~32 GB?

<details>
<summary>Đáp án</summary>

- Nên đặt `-Xms` bằng `-Xmx` với dung lượng tối đa là **50% RAM vật lý** của máy và luôn giữ **dưới ngưỡng compressed OOPs** (~32 GB, thực tế thường giữ trong khoảng 26–30 GB).
- **Lý do**: Phần RAM còn lại cần nhường cho **OS page cache** của Lucene để đọc và đệm các tệp chỉ mục nhanh chóng. Nếu cấp JVM Heap vượt quá ~32 GB (vượt ngưỡng compressed OOPs), hệ thống vừa bị thu hẹp không gian OS page cache cho Lucene, vừa khiến thời gian dừng GC (GC pause) tăng vọt.

</details>

### Câu Hỏi 13: Vì sao cần cấu hình `vm.max_map_count` tối thiểu `262144` và tắt swap trên Linux, đồng thời **bootstrap checks** đóng vai trò gì?

<details>
<summary>Đáp án</summary>

- **`vm.max_map_count`**: Engine Lucene sử dụng `mmap` để ánh xạ các tệp chỉ mục vào bộ nhớ, nên hệ điều hành Linux yêu cầu thông số `vm.max_map_count` tối thiểu là **`262144`**.
- **Swap**: Cần tắt swap (hoặc bật `bootstrap.memory_lock: true`) để tránh việc bộ nhớ bị đẩy ra đĩa làm chậm quá trình GC.
- **Bootstrap checks**: Khi Elasticsearch chạy ở chế độ production (bind IP ngoài địa chỉ loopback), cơ chế **bootstrap checks** sẽ kiểm tra các cấu hình hệ thống quan trọng như `vm.max_map_count`, heap, file descriptor, memory lock và **chặn không cho node khởi động** nếu không đạt chuẩn.

</details>

### Câu Hỏi 14: Vì sao không được backup Elasticsearch bằng cách copy trực tiếp thư mục `data/` khi node đang chạy, và phương pháp đúng là gì?

<details>
<summary>Đáp án</summary>

- **Lý do không được copy `data/`**: Khi node đang hoạt động, các segment của Lucene và translog bên trong thư mục `data/` liên tục thay đổi, nên việc copy file trực tiếp sẽ tạo ra bản sao bị hỏng và không nhất quán.
- **Phương pháp đúng**: Luôn dùng **Snapshot API** để tạo bản sao lưu nhất quán theo thời điểm và tăng dần (incremental) tới kho lưu trữ bên ngoài như S3, GCS, Azure Blob hoặc shared filesystem.

</details>

### Câu Hỏi 15: Trình bày quy trình thực hiện **rolling upgrade** an toàn cho cụm Elasticsearch mà không gây gián đoạn hay sao chép dữ liệu dư thừa.

<details>
<summary>Đáp án</summary>

Quy trình **rolling upgrade** nâng cấp tuần tự từng node một như sau:
1. Đặt `"cluster.routing.allocation.enable": "primaries"` để tạm dừng việc tự động phân bổ/sao chép replica không cần thiết (tránh việc master kích hoạt sao chép dữ liệu dư thừa sau khi hết `delayed_timeout`).
2. Dừng 1 node, tiến hành nâng cấp và khởi động lại node đó.
3. Đặt lại `cluster.routing.allocation.enable` về `"all"`.
4. Chờ trạng thái cụm quay về **`green`** rồi mới tiếp tục thực hiện tương tự cho node tiếp theo.

</details>
