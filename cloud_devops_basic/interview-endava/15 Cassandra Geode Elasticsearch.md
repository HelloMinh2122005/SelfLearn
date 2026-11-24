# 15. Cassandra, Geode & Elasticsearch

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt. Với vai trò CI/CD, thường chỉ bị hỏi ở mức **khái niệm và vận hành cơ bản**.

---

## A. Apache Cassandra

### 1. What is Cassandra and what is its architecture?
<details><summary>Đáp án</summary>

Cassandra là **NoSQL dạng wide-column, phân tán, không có master** (masterless, peer-to-peer). Mọi node ngang hàng, không có điểm lỗi duy nhất. Dữ liệu được phân phối trên một **token ring** theo **consistent hashing** của **partition key**, và sao chép sang nhiều node. Các node trao đổi trạng thái qua **gossip**. Cassandra được tối ưu cho **ghi nhiều**, mở rộng tuyến tính, đa datacenter.
</details>

### 2. Explain partition key vs clustering columns.
<details><summary>Đáp án</summary>

```sql
CREATE TABLE orders_by_customer (
  customer_id uuid,
  order_date timestamp,
  order_id uuid,
  total decimal,
  PRIMARY KEY ((customer_id), order_date, order_id)
) WITH CLUSTERING ORDER BY (order_date DESC);
```
- **Partition key** (`customer_id`): quyết định dữ liệu nằm ở **node nào**. Mọi hàng cùng partition nằm cùng chỗ.
- **Clustering columns** (`order_date`, `order_id`): **sắp xếp** các hàng **trong partition** và giúp mỗi hàng là duy nhất.
- Truy vấn hiệu quả phải chỉ rõ partition key.
</details>

### 3. How is data modeling in Cassandra different from relational modeling?
<details><summary>Đáp án</summary>

- **Thiết kế theo truy vấn** (query-first): mỗi truy vấn chính có **một bảng riêng**, chấp nhận **phi chuẩn hóa và dữ liệu trùng lặp**.
- **Không có JOIN**, không có transaction nhiều hàng kiểu ACID. Truy vấn phải theo partition key.
- Tránh **partition quá lớn** hoặc **hot partition**.
- Tránh `ALLOW FILTERING` (quét toàn bộ).
</details>

### 4. What is the replication factor and replication strategy?
<details><summary>Đáp án</summary>

- **RF**: số bản sao của mỗi partition (thường là 3 mỗi datacenter).
- **Strategy** đặt theo keyspace:
  - `SimpleStrategy`: một datacenter, chỉ dùng cho test.
  - **`NetworkTopologyStrategy`**: RF riêng cho từng datacenter, đặt replica trên các rack khác nhau. Dùng cho production.
- **Snitch** (ví dụ `GossipingPropertyFileSnitch`) cho Cassandra biết node thuộc datacenter và rack nào.
</details>

### 5. Explain consistency levels. What does QUORUM mean and how do you get strong consistency?
<details><summary>Đáp án</summary>

- Consistency level (CL) là số replica phải phản hồi để một lượt đọc hoặc ghi được coi là thành công. Các mức: `ONE`, `TWO`, `QUORUM`, `LOCAL_QUORUM`, `EACH_QUORUM`, `ALL`, `LOCAL_ONE`, `ANY` (chỉ cho ghi).
- **QUORUM** = `floor(RF/2) + 1`. Với RF=3 thì cần 2 replica.
- **Nhất quán mạnh** khi **R + W > RF**. Ví dụ ghi QUORUM và đọc QUORUM với RF=3: 2 + 2 > 3.
- Đa datacenter thường dùng **`LOCAL_QUORUM`** để không chờ datacenter khác.
- Cassandra cho phép **điều chỉnh** (tunable) giữa nhất quán và độ sẵn sàng, độ trễ theo từng truy vấn.
</details>

### 6. Describe the write path.
<details><summary>Đáp án</summary>

1. Ghi nối vào **commit log** trên disk (đảm bảo bền vững khi crash).
2. Ghi vào **memtable** trong bộ nhớ.
3. Memtable đầy thì **flush** thành **SSTable** trên disk. SSTable **bất biến**, không sửa tại chỗ.
4. **Compaction** gộp các SSTable, loại bỏ phiên bản cũ và tombstone hết hạn.

Ghi chỉ là append, không đọc trước khi ghi, nên ghi rất nhanh.
</details>

### 7. Describe the read path.
<details><summary>Đáp án</summary>

Đọc phải **gộp** dữ liệu từ memtable và nhiều SSTable. Để biết SSTable nào có thể chứa partition, Cassandra dùng **Bloom filter** (loại nhanh các SSTable chắc chắn không có), rồi partition index hoặc summary, cache (key cache, row cache). Phiên bản mới nhất theo timestamp sẽ thắng. Nhiều SSTable chưa compaction, hoặc nhiều tombstone, làm đọc chậm.
</details>

### 8. What are compaction strategies?
<details><summary>Đáp án</summary>

- **STCS** (SizeTiered): gộp các SSTable cùng cỡ. Tốt cho tải ghi nhiều. Là mặc định truyền thống.
- **LCS** (Leveled): đọc nhanh và ổn định hơn, tốn I/O hơn. Tốt cho tải đọc nhiều.
- **TWCS** (TimeWindow): cho dữ liệu chuỗi thời gian có TTL, xóa cả SSTable khi hết hạn.
- **UCS** (Unified Compaction Strategy): có từ **Cassandra 5.0**, có thể cấu hình để mô phỏng các chiến lược trên.
</details>

### 9. What are tombstones and why can they hurt?
<details><summary>Đáp án</summary>

Xóa trong Cassandra là **ghi một dấu xóa (tombstone)**, vì SSTable bất biến. TTL hết hạn cũng sinh tombstone. Tombstone chỉ được dọn sau **`gc_grace_seconds`** (mặc định 10 ngày) **và** khi compaction. Vấn đề:
- Đọc phải quét qua nhiều tombstone nên chậm, có cảnh báo, thậm chí truy vấn bị hủy khi vượt ngưỡng.
- Nếu một node chết lâu hơn `gc_grace_seconds` mà không chạy **repair**, dữ liệu đã xóa có thể "sống lại" (zombie data).

Tránh mô hình xóa hàng loạt, hoặc dùng bảng như một hàng đợi.
</details>

### 10. What are hinted handoff, read repair and anti-entropy repair?
<details><summary>Đáp án</summary>

- **Hinted handoff**: khi một replica tạm chết, node điều phối **lưu "hint"** và gửi lại khi replica quay về (trong `max_hint_window`, mặc định 3 giờ).
- **Read repair**: lúc đọc, nếu thấy các replica không khớp thì sửa replica lỗi thời.
- **Anti-entropy repair** (`nodetool repair`): so sánh dữ liệu giữa các replica bằng **Merkle tree** rồi đồng bộ. Cần chạy **định kỳ, trong khoảng `gc_grace_seconds`**. Công cụ hỗ trợ: Cassandra Reaper.
</details>

### 11. What does `nodetool status` show? Explain UN, DN, UJ, UL.
<details><summary>Đáp án</summary>

Mỗi node hiển thị trạng thái **U/D** (Up/Down) và **N/L/J/M** (Normal/Leaving/Joining/Moving), cùng Load, số token, phần trăm dữ liệu sở hữu, Host ID, Rack. **UN** là khỏe. **DN** là node chết. **UJ** là đang bootstrap. **UL** là đang decommission. Đây là lệnh đầu tiên khi kiểm tra cluster.
</details>

### 12. Which other `nodetool` commands are important for operations?
<details><summary>Đáp án</summary>

- `nodetool repair -pr`: sửa phần dữ liệu chính của node.
- `nodetool cleanup`: chạy trên node cũ **sau khi thêm node mới**, để xóa dữ liệu không còn thuộc về mình.
- `nodetool decommission`: rút node đang sống ra, chuyển dữ liệu đi.
- `nodetool removenode`: gỡ node đã chết.
- `nodetool drain`: flush memtable, ngừng nhận ghi. Chạy **trước khi tắt hoặc nâng cấp** node.
- `nodetool tpstats` (thread pool, dropped messages), `compactionstats`, `tablestats`, `gcstats`.
- `nodetool snapshot`: backup bằng hard link.
</details>

### 13. What is the role of seed nodes?
<details><summary>Đáp án</summary>

Seed node là điểm liên lạc để **node mới tìm thấy cluster** qua gossip lúc khởi động. Seed **không phải master**, không phải điểm lỗi duy nhất khi cluster đã chạy. Nên có vài seed ở mỗi datacenter. Không nên đặt **mọi** node làm seed, vì node seed không tự bootstrap dữ liệu khi tham gia.
</details>

### 14. What should you consider when running Cassandra on Kubernetes?
<details><summary>Đáp án</summary>

- StatefulSet và PVC hiệu năng cao.
- **Danh tính ổn định**: IP Pod đổi khi tạo lại, nhưng Cassandra nhận diện node bằng Host ID.
- Rack hoặc datacenter ánh xạ theo zone.
- Anti-affinity, PDB `maxUnavailable: 1`.
- Resource kiểu Guaranteed. Heap phù hợp với limit.
- Repair định kỳ.
- Nên dùng **Operator** (cass-operator, K8ssandra) để xử lý bootstrap, thay node, rolling restart (có `drain`).
</details>

### 15. How do you scale out a Cassandra cluster?
<details><summary>Đáp án</summary>

Thêm **từng node một**: node mới **bootstrap** (nhận phần token range và stream dữ liệu từ các node khác), chờ node chuyển sang `UN`. Sau đó chạy **`nodetool cleanup`** trên các node cũ để xóa dữ liệu không còn thuộc về chúng. Không thêm nhiều node đồng thời theo cách cũ. Từ 4.0, `num_tokens` mặc định là 16 kèm thuật toán phân bổ token tốt hơn.
</details>

## B. Apache Geode

### 16. What is Apache Geode?
<details><summary>Đáp án</summary>

Geode là **in-memory data grid** (lưu dữ liệu trong RAM, phân tán qua nhiều server), có nguồn gốc từ **GemFire**. Đặc điểm: độ trễ thấp, nhất quán, có thể **lưu bền xuống disk**, có truy vấn (OQL), sự kiện (continuous query), **thực thi hàm ngay tại nơi chứa dữ liệu**, và **replication qua WAN** giữa các cluster. Hay dùng làm cache phân tán hoặc nơi lưu dữ liệu nóng.

*Ghi chú trạng thái dự án*: Geode từng có nguy cơ bị đưa vào Apache Attic (2022–2024), sau đó được hồi sinh với bản 2.0. Hãy kiểm tra trạng thái hiện tại trên trang của Apache trước khi khẳng định trong phỏng vấn.
</details>

### 17. Explain Geode's main components: locator, server, client.
<details><summary>Đáp án</summary>

- **Locator**: dịch vụ **khám phá thành viên** (discovery) và **cân bằng tải** cho client. Cho client biết server nào đang phục vụ. Port mặc định **10334**.
- **Server (cache server)**: thành viên **lưu dữ liệu** và phục vụ client. Port cache server mặc định **40404**.
- **Client**: ứng dụng kết nối qua **pool** trỏ tới locator. Có thể giữ cache cục bộ (`CACHING_PROXY`) hoặc không (`PROXY`).
- Công cụ quản trị là **gfsh**.
</details>

### 18. Replicated vs partitioned regions.
<details><summary>Đáp án</summary>

- **Region** tương đương một bảng hoặc map key-value.
- **REPLICATE**: **mỗi server giữ bản đầy đủ**. Đọc nhanh ở mọi nơi, hợp với dữ liệu tham chiếu nhỏ, ít thay đổi.
- **PARTITION**: dữ liệu được **chia thành bucket** và phân tán qua các server. Dung lượng mở rộng theo số server. **`redundant-copies`** quy định số bản sao dự phòng (biến thể `PARTITION_REDUNDANT`). Có các biến thể persistent và overflow (đẩy xuống disk khi thiếu RAM).
</details>

### 19. How do you use gfsh for basic operations?
<details><summary>Đáp án</summary>

```text
gfsh> start locator --name=locator1
gfsh> start server --name=server1 --locators=localhost[10334]
gfsh> connect --locator=localhost[10334]
gfsh> list members
gfsh> create region --name=orders --type=PARTITION_REDUNDANT_PERSISTENT
gfsh> describe region --name=orders
gfsh> query --query="select * from /orders limit 10"
gfsh> show metrics
gfsh> export logs --dir=/tmp/geode-logs
```
</details>

### 20. What is PDX serialization and why use it?
<details><summary>Đáp án</summary>

PDX là định dạng serialization của Geode:
- **Không phụ thuộc ngôn ngữ** (Java, .NET, C++ client).
- **Đổi schema** được (thêm hoặc bớt field) mà không phải tắt cả cluster.
- **Truy vấn và đọc field mà không cần deserialize** toàn bộ object, cũng không cần class của ứng dụng trên server.

Định nghĩa kiểu (type registry) phải nhất quán trên toàn cluster, và nên được lưu bền.
</details>

### 21. How does Geode handle network partitions (split brain)?
<details><summary>Đáp án</summary>

Geode có **phát hiện phân vùng mạng**: mỗi thành viên có **trọng số** (locator, server, thành viên đứng đầu có trọng số khác nhau). Khi mạng bị chia, nhóm thành viên **mất phần lớn trọng số** sẽ **tự tắt** để tránh hai nửa cùng ghi dữ liệu. Vận hành trên Kubernetes cần ổn định mạng, có PDB, và có từ 2 locator trở lên.
</details>

### 22. What is a continuous query (CQ) and WAN replication in Geode?
<details><summary>Đáp án</summary>

- **Continuous query**: client đăng ký một truy vấn OQL và **nhận sự kiện** khi dữ liệu khớp truy vấn thay đổi (thêm, sửa, xóa).
- **WAN replication**: **gateway sender** ở cluster A gửi bất đồng bộ các thay đổi tới **gateway receiver** ở cluster B (đa vùng hoặc DR), có hàng đợi lưu bền và xử lý xung đột.
</details>

## C. Elasticsearch

### 23. Explain index, document, shard (primary/replica) and node.
<details><summary>Đáp án</summary>

- **Document**: bản ghi JSON. **Index**: tập document, giống một "bảng" logic.
- Index được chia thành **primary shard**. Mỗi primary có **replica shard** để dự phòng và tăng khả năng đọc. Số primary **cố định khi tạo** (đổi được bằng split, shrink hoặc reindex). Số replica **đổi được bất cứ lúc nào**. Mặc định từ 7.0: 1 primary, 1 replica.
- **Replica không bao giờ nằm cùng node với primary của nó.**
- **Node** là một instance Elasticsearch. Cluster là tập node.
</details>

### 24. What do cluster health green, yellow and red mean? Why is a single-node cluster yellow?
<details><summary>Đáp án</summary>

- **Green**: mọi primary và replica đều được gán.
- **Yellow**: mọi **primary** đã được gán, nhưng **một số replica chưa**. Dữ liệu vẫn đầy đủ nhưng mất khả năng dự phòng.
- **Red**: **ít nhất một primary chưa được gán**. Một phần dữ liệu không truy cập được, việc ghi vào shard đó bị lỗi.
- **Cluster một node** có replica = 1 sẽ **luôn yellow**, vì replica không được đặt cùng node với primary. Có thể đặt `number_of_replicas: 0` cho môi trường dev.
</details>

### 25. How do you troubleshoot unassigned shards?
<details><summary>Đáp án</summary>

```http
GET _cluster/health?pretty
GET _cat/shards?v&h=index,shard,prirep,state,unassigned.reason
GET _cluster/allocation/explain
GET _cat/nodes?v
GET _cat/allocation?v
```
Nguyên nhân thường gặp:
- **Disk vượt watermark**.
- Node chết hoặc rời cluster.
- Không đủ node cho số replica.
- Quy tắc allocation (filter theo thuộc tính node) không khớp.
- Shard bị hỏng.
- Vượt giới hạn số shard mỗi node.

`allocation/explain` cho biết lý do chính xác.
</details>

### 26. Explain disk watermarks and the flood-stage read-only block.
<details><summary>Đáp án</summary>

Mặc định theo phần trăm disk đã dùng:
- **low = 85%**: không gán thêm shard **mới** vào node.
- **high = 90%**: cố **chuyển shard đi** khỏi node.
- **flood_stage = 95%**: đặt `index.blocks.read_only_allow_delete` cho các index có shard trên node đó, nên **mọi lượt ghi bị từ chối** (pipeline log báo lỗi 429 hoặc 403 kiểu `FORBIDDEN/... read-only`).

Bản mới tự gỡ block khi disk xuống dưới mức high. Xử lý: xóa index cũ (ILM), thêm disk hoặc node, giảm replica tạm thời.
</details>

### 27. What is an inverted index? `text` vs `keyword` fields?
<details><summary>Đáp án</summary>

- **Inverted index** ánh xạ **từ (term)** sang danh sách document chứa từ đó, giúp tìm kiếm toàn văn rất nhanh.
- `text`: được **analyzer** tách từ, chuẩn hóa chữ thường, stemming. Dùng cho tìm kiếm toàn văn (`match`).
- `keyword`: lưu **nguyên chuỗi**. Dùng cho lọc chính xác (`term`), sắp xếp, aggregation (ví dụ `service.name`, `level`, `traceId`).
- Dynamic mapping mặc định tạo cả `text` và sub-field `.keyword` cho chuỗi.
</details>

### 28. What is a mapping explosion and how do you prevent it?
<details><summary>Đáp án</summary>

Log có các key động (ví dụ dùng ID làm tên field) khiến **dynamic mapping** tạo hàng nghìn field, làm tốn heap, cluster state phình và chậm. Giới hạn mặc định `index.mapping.total_fields.limit` là 1000. Cách phòng tránh:
- Mapping tường minh.
- `dynamic: false` hoặc `strict` cho phần không cần đánh chỉ mục.
- Kiểu `flattened`.
- Chuẩn hóa cấu trúc log ngay từ nguồn.
</details>

### 29. What does "near real-time" mean in Elasticsearch?
<details><summary>Đáp án</summary>

Document vừa ghi chỉ **tìm thấy được sau một lần refresh**. Refresh tạo segment mới có thể tìm kiếm, mặc định **mỗi 1 giây** với index đang được truy vấn. Tính bền vững được bảo đảm bởi **translog**. Với tải ghi lớn (ingest log), có thể tăng `refresh_interval` (ví dụ 30s) để tăng throughput.
</details>

### 30. Explain node roles and why you want dedicated master-eligible nodes.
<details><summary>Đáp án</summary>

- Các role: `master` (quản lý cluster state, gán shard), `data` (hoặc `data_hot`, `data_warm`, `data_cold`, `data_frozen`), `ingest` (pipeline tiền xử lý), `ml`, và **coordinating-only** (không có role nào, chỉ định tuyến request).
- Ở cluster lớn, nên có **3 node master-eligible riêng**. Quorum đa số tránh split brain, và master không bị ảnh hưởng bởi tải tìm kiếm hay ghi nặng.
- Từ 7.x, việc bầu master tự quản lý quorum. `cluster.initial_master_nodes` **chỉ dùng khi khởi tạo cluster lần đầu**. `discovery.seed_hosts` dùng để các node tìm nhau.
</details>

### 31. What is ILM, rollover and data streams? Why are they used for logs?
<details><summary>Đáp án</summary>

- **ILM (Index Lifecycle Management)**: chính sách tự động qua các pha **hot → warm → cold → frozen → delete** (giảm replica, shrink, force merge, chuyển sang node rẻ hơn, xóa sau N ngày).
- **Rollover**: tạo index mới khi index hiện tại đạt kích thước hoặc tuổi nhất định, giúp shard có kích thước hợp lý.
- **Data stream**: một tên duy nhất đứng trước các **backing index** theo thời gian, dành cho dữ liệu **chỉ ghi thêm** (log, metric), kết hợp tự nhiên với ILM.
- Kết quả: log không làm đầy disk, và retention được tự động hóa.
</details>

### 32. How do you size shards? What is oversharding?
<details><summary>Đáp án</summary>

Hướng dẫn chung của Elastic: shard nên có kích thước **khoảng 10–50 GB** (tùy loại dữ liệu). **Oversharding** (quá nhiều shard nhỏ, ví dụ tạo index hằng ngày cho mỗi service với nhiều primary) làm tốn heap và overhead cluster state, khiến tìm kiếm chậm. Dùng rollover theo kích thước thay vì theo ngày cố định, và gộp index của các service nhỏ.
</details>

### 33. Elasticsearch returns HTTP 429 `es_rejected_execution_exception` during log ingestion. What does it mean?
<details><summary>Đáp án</summary>

**Hàng đợi của thread pool** (thường là `write`) bị đầy: cluster không theo kịp tốc độ ghi. Client (Fluent Bit, Logstash) phải **backoff và retry**, và có buffer (disk buffer, hoặc Kafka làm bộ đệm). Xử lý gốc:
- Tăng tài nguyên hoặc thêm node.
- Tăng `refresh_interval`.
- Bulk request có kích thước hợp lý.
- Giảm số shard nóng.
- Kiểm tra disk I/O và GC.

**Không** nên chỉ tăng kích thước hàng đợi.
</details>

### 34. How do you size the JVM heap for Elasticsearch?
<details><summary>Đáp án</summary>

- Bản mới **tự tính heap** dựa trên role và RAM của node. Nên để mặc định trừ khi có lý do.
- Nếu tự đặt: `Xms = Xmx`, **không quá 50% RAM** (phần còn lại cho **page cache** của filesystem, rất quan trọng với Lucene), và **dưới ngưỡng compressed oops** (khoảng 32 GB).
- Trên Kubernetes, memory limit phải tính cả heap và phần ngoài heap.
- Cấu hình hệ thống: `vm.max_map_count` đủ lớn (tài liệu yêu cầu tối thiểu 262144), tắt swap hoặc `bootstrap.memory_lock`, file descriptor cao.
</details>

### 35. `match` vs `term` query; query context vs filter context.
<details><summary>Đáp án</summary>

- `match`: phân tích chuỗi tìm kiếm qua analyzer, dùng cho field `text`.
- `term`: so khớp **chính xác**, không phân tích, dùng cho `keyword`, số, ngày. Dùng `term` trên field `text` thường không ra kết quả vì nội dung đã bị tách từ.
- Trong `bool`: `must`/`should` (**query context**, có tính điểm liên quan) và `filter`/`must_not` (**filter context**, không tính điểm, **có cache**, nhanh hơn). Lọc theo thời gian hay service thì nên đặt trong `filter`.
</details>

### 36. How do you change the mapping of an existing field without downtime?
<details><summary>Đáp án</summary>

Không đổi được kiểu của field đã có trong index. Quy trình:
1. Tạo index mới với mapping đúng.
2. **`_reindex`** dữ liệu sang.
3. Chuyển **alias** (thao tác nguyên tử qua `_aliases`) từ index cũ sang index mới.

Ứng dụng luôn truy cập qua alias nên không có downtime. Với data stream: cập nhật index template rồi **rollover**, index mới sẽ dùng mapping mới.
</details>

### 37. How do you back up Elasticsearch?
<details><summary>Đáp án</summary>

Dùng **snapshot và restore** vào một **repository** (S3, Azure Blob, GCS, shared filesystem). Snapshot là **incremental** (chỉ lưu segment mới). Lên lịch tự động bằng **SLM (Snapshot Lifecycle Management)**. **Không** backup bằng cách copy thư mục dữ liệu khi node đang chạy. Trên Kubernetes có thể dùng ECK cùng snapshot repository.
</details>

### 38. What is the licensing situation of Elasticsearch, and what is OpenSearch?
<details><summary>Đáp án</summary>

- Năm 2021 Elastic chuyển license từ Apache 2.0 sang **SSPL / Elastic License 2.0**, dẫn tới việc AWS fork thành **OpenSearch** (hiện thuộc OpenSearch Software Foundation, trực thuộc Linux Foundation).
- Năm 2024 Elastic bổ sung lựa chọn **AGPLv3** cho mã nguồn.
- Với nền tảng, điều này ảnh hưởng tới việc chọn bản phân phối và tính tương thích client và API giữa hai nhánh.
- Cần đối chiếu trang license chính thức trước khi trả lời chi tiết.
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
**Cassandra**
- [Cassandra: Overview & Architecture](https://cassandra.apache.org/doc/latest/cassandra/architecture/index.html): kiến trúc, Dynamo, gossip, storage engine.
- [Cassandra: Data Modeling](https://cassandra.apache.org/doc/latest/cassandra/developing/data-modeling/index.html): mô hình hóa theo truy vấn.
- [Cassandra: Dynamo (replication, consistency)](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html): RF, consistency level, hinted handoff.
- [Cassandra: Storage Engine](https://cassandra.apache.org/doc/latest/cassandra/architecture/storage-engine.html): commit log, memtable, SSTable.
- [Cassandra: Compaction](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/index.html): STCS, LCS, TWCS, UCS, tombstone.
- [Cassandra: Repair](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/repair.html): anti-entropy repair.
- [Cassandra: nodetool](https://cassandra.apache.org/doc/latest/cassandra/managing/tools/nodetool/nodetool.html): tham chiếu lệnh.
- [K8ssandra](https://docs.k8ssandra.io/): Cassandra trên Kubernetes.

**Geode**
- [Apache Geode Documentation](https://geode.apache.org/docs/): tài liệu chính thức (locator, server, region, gfsh, PDX, WAN, network partitioning).
- [Apache Geode 2.0: Revival, Reinvention, and the Road Ahead](https://news.apache.org/foundation/entry/apache-geode-2-0-revival-reinvention-and-the-road-ahead): trạng thái dự án.

**Elasticsearch**
- [Elasticsearch: Cluster health API](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-health.html): green, yellow, red.
- [Elasticsearch: Cluster allocation explain API](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-allocation-explain.html): lý do shard chưa được gán.
- [Elasticsearch: Disk-based shard allocation settings](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-cluster.html#disk-based-shard-allocation): watermark.
- [Elasticsearch: Size your shards](https://www.elastic.co/guide/en/elasticsearch/reference/current/size-your-shards.html): kích thước shard.
- [Elasticsearch: ILM](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html) và [Data streams](https://www.elastic.co/guide/en/elasticsearch/reference/current/data-streams.html): vòng đời index.
- [Elasticsearch: Node roles](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-node.html): role của node.
- [Elasticsearch: Important system configuration](https://www.elastic.co/guide/en/elasticsearch/reference/current/system-config.html): heap, `vm.max_map_count`, swap.
- [Elasticsearch: Snapshot and restore](https://www.elastic.co/guide/en/elasticsearch/reference/current/snapshot-restore.html): backup.
- [Elastic Cloud on Kubernetes (ECK)](https://www.elastic.co/guide/en/cloud-on-k8s/current/index.html): Elasticsearch trên Kubernetes.

> Ghi chú: tài liệu Elastic đang chuyển dần sang cấu trúc URL mới (`elastic.co/docs/...`). Nếu link cũ chuyển hướng, hãy dùng trang đích.
