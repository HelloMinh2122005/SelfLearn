# 14. Apache Kafka & ZooKeeper

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt.
> **Phiên bản:** Kafka **4.0** (03/2025) **đã gỡ bỏ hoàn toàn ZooKeeper**, chỉ còn chế độ **KRaft**. Kafka 3.9 là bản cuối hỗ trợ ZooKeeper và dùng để migrate. Nền tảng trong JD có ZooKeeper, nên nhiều khả năng đang chạy Kafka 3.x ở chế độ ZooKeeper hoặc có ZooKeeper cho thành phần khác. Hãy nắm cả hai.

---

## A. Kafka Core Concepts

### 1. What is Kafka? How is it different from a traditional message queue like RabbitMQ?
<details><summary>Đáp án</summary>

Kafka là **distributed commit log** (nền tảng event streaming): message được **ghi nối tiếp vào log trên disk** và **giữ lại theo thời gian hoặc kích thước**, không bị xóa khi đã đọc.
- Nhiều **consumer group** độc lập đọc cùng dữ liệu, mỗi group tự quản lý **offset**, có thể đọc lại (replay).
- Throughput rất cao nhờ ghi tuần tự, page cache, batching, zero-copy.
- RabbitMQ (mô hình queue truyền thống): broker đẩy message tới consumer, message bị xóa sau khi được ack, định tuyến phức tạp qua exchange. Phù hợp với hàng đợi công việc. Replay khó hơn (ngoại trừ RabbitMQ Streams).
</details>

### 2. Explain topic, partition, offset and segment.
<details><summary>Đáp án</summary>

- **Topic**: luồng dữ liệu theo chủ đề.
- **Partition**: topic được chia thành nhiều partition. Mỗi partition là **một log có thứ tự, chỉ ghi nối thêm**. Partition là **đơn vị song song và đơn vị replication**.
- **Offset**: số thứ tự tăng dần của message **trong một partition**.
- **Segment**: mỗi partition lưu trên disk thành nhiều file segment (`.log`, `.index`, `.timeindex`). Retention xóa **theo cả segment**, không xóa từng message.
</details>

### 3. Does Kafka guarantee message ordering?
<details><summary>Đáp án</summary>

Chỉ **trong một partition**, không đảm bảo trên toàn topic. Message cùng **key** luôn vào cùng partition (hash của key chia lấy dư cho số partition), nên thứ tự được giữ **theo key**. Lưu ý:
- **Tăng số partition** làm đổi ánh xạ key sang partition, phá vỡ thứ tự theo key đối với dữ liệu mới.
- Producer retry có thể đảo thứ tự nếu không bật idempotence. Với idempotent producer, thứ tự được giữ khi `max.in.flight.requests.per.connection` ≤ 5.
</details>

### 4. How does the producer choose a partition?
<details><summary>Đáp án</summary>

- Có chỉ định partition thì dùng partition đó.
- Có **key** thì dùng hash (murmur2) của key chia lấy dư cho số partition.
- **Không có key** thì dùng **sticky partitioning**: dồn một batch vào một partition rồi đổi sang partition khác, giúp batch lớn và hiệu quả hơn so với round robin từng message.
- Có thể tự viết partitioner.
</details>

### 5. Explain `acks=0`, `acks=1`, `acks=all`.
<details><summary>Đáp án</summary>

- `acks=0`: không chờ xác nhận. Nhanh nhất nhưng có thể mất dữ liệu.
- `acks=1`: chờ **leader** ghi xong. Mất dữ liệu nếu leader chết trước khi follower kịp sao chép.
- `acks=all` (hay `-1`): chờ **mọi replica trong ISR** ghi xong. Bền nhất. Mặc định từ Kafka 3.0.
- `acks=all` chỉ thực sự an toàn khi kèm **`min.insync.replicas`** ≥ 2.
</details>

### 6. What are replication factor, leader, follower and ISR?
<details><summary>Đáp án</summary>

- **Replication factor**: số bản sao của mỗi partition (thường là 3).
- Mỗi partition có một **leader** nhận mọi lượt ghi (và mặc định cả lượt đọc). **Follower** kéo dữ liệu từ leader.
- **ISR (In-Sync Replicas)**: các replica đang **bắt kịp** leader. Replica bị loại khỏi ISR nếu không theo kịp trong `replica.lag.time.max.ms` (mặc định 30 giây).
- Leader chết thì controller chọn leader mới **từ ISR**.
</details>

### 7. What does `min.insync.replicas` do? Give a production configuration.
<details><summary>Đáp án</summary>

Đây là số replica tối thiểu trong ISR để chấp nhận lượt ghi với `acks=all`. Nếu ISR nhỏ hơn giá trị này, producer nhận lỗi `NotEnoughReplicas` thay vì ghi vào ít bản sao hơn yêu cầu.

Cấu hình phổ biến: **RF=3, `min.insync.replicas=2`, `acks=all`**. Chịu được một broker chết mà không mất dữ liệu và vẫn ghi được. Giá trị mặc định của broker là 1.
</details>

### 8. What is unclean leader election?
<details><summary>Đáp án</summary>

Khi **mọi replica trong ISR đều chết**, có hai lựa chọn: chờ một replica ISR quay lại (partition offline, mất **tính sẵn sàng**), hoặc cho một replica **ngoài ISR** làm leader (`unclean.leader.election.enable=true`), chấp nhận **mất dữ liệu**. Mặc định là `false`, ưu tiên tính nhất quán.
</details>

### 9. What is a consumer group? How are partitions assigned?
<details><summary>Đáp án</summary>

- Các consumer có cùng `group.id` **chia nhau partition**: mỗi partition chỉ được giao cho **một consumer** trong group tại một thời điểm.
- Số consumer có ích tối đa bằng số partition. Consumer dư sẽ ngồi không.
- Các group khác nhau đọc độc lập với nhau, mỗi group nhận toàn bộ dữ liệu (pub/sub).
- Có một broker làm **group coordinator** quản lý thành viên và offset của mỗi group.
</details>

### 10. What is a rebalance? What triggers it and why is it disruptive?
<details><summary>Đáp án</summary>

Rebalance là quá trình **chia lại partition** cho các consumer trong group. Nó xảy ra khi:
- Consumer tham gia hoặc rời group (deploy, scale, crash).
- Consumer **không gửi heartbeat** trong `session.timeout.ms` (mặc định 45 giây từ Kafka 3.0).
- Consumer **không gọi `poll()`** trong `max.poll.interval.ms` (mặc định 5 phút).
- Số partition thay đổi.

Với giao thức cũ kiểu "eager", **cả group dừng xử lý** trong lúc rebalance. Cách giảm ảnh hưởng:
- **Cooperative sticky assignor** (chỉ thu hồi những partition cần chuyển).
- **Static membership** (`group.instance.id`, hợp với StatefulSet) để restart nhanh không gây rebalance.
- Giao thức consumer group mới KIP-848 (đã GA ở Kafka 4.0, cần đối chiếu theo phiên bản client và broker).
</details>

### 11. How are consumer offsets stored and committed? Auto vs manual commit.
<details><summary>Đáp án</summary>

- Offset được lưu trong topic nội bộ **`__consumer_offsets`** (compacted). ZooKeeper chỉ dùng cho consumer rất cũ.
- **Auto commit** (`enable.auto.commit=true`, mặc định với Java client, mỗi `auto.commit.interval.ms` = 5 giây): đơn giản, nhưng có thể commit message **chưa xử lý xong** (mất message nếu crash) hoặc xử lý lại.
- **Manual commit** (`commitSync`/`commitAsync`) **sau khi xử lý xong**: at-least-once có kiểm soát.
- Spring Kafka mặc định tắt auto commit và tự commit theo `AckMode`.
</details>

### 12. What does `auto.offset.reset` do?
<details><summary>Đáp án</summary>

Áp dụng khi group **chưa có offset đã commit** (group mới) hoặc offset **không còn tồn tại** (dữ liệu đã bị retention xóa):
- `latest` (mặc định): chỉ đọc message mới.
- `earliest`: đọc từ đầu những gì còn lưu.
- `none`: báo lỗi.

Cạm bẫy: service mới deploy với `latest` sẽ bỏ qua message đã có trước đó.
</details>

### 13. Explain at-most-once, at-least-once and exactly-once semantics in Kafka.
<details><summary>Đáp án</summary>

- **At-most-once**: commit offset **trước** khi xử lý. Crash thì **mất** message.
- **At-least-once**: xử lý **rồi mới** commit. Crash thì **xử lý lại**, nên consumer phải idempotent. Đây là lựa chọn phổ biến nhất.
- **Exactly-once** (trong phạm vi Kafka): **idempotent producer** (không trùng khi retry) + **transactions** (`transactional.id`, ghi nhiều partition và commit offset một cách nguyên tử) + consumer `isolation.level=read_committed`. Kafka Streams dùng `processing.guarantee=exactly_once_v2`. Ghi ra hệ thống **bên ngoài Kafka** (DB) vẫn cần idempotency hoặc outbox.
</details>

### 14. What is an idempotent producer?
<details><summary>Đáp án</summary>

Broker gán **producer ID**, producer đánh **sequence number** cho mỗi batch theo từng partition. Broker **loại bỏ batch trùng** do retry, và giữ thứ tự. Mặc định bật từ Kafka 3.0 (`enable.idempotence=true`, `acks=all`). Nó chống trùng **trong một phiên producer**. Chống trùng qua nhiều lần restart thì cần transactions.
</details>

### 15. What is consumer lag? How do you check it?
<details><summary>Đáp án</summary>

**Lag = log-end offset − committed offset** của group trên mỗi partition, nghĩa là số message chưa được xử lý.
```bash
kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group orders-service
# GROUP TOPIC PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG CONSUMER-ID HOST CLIENT-ID
```
Theo dõi liên tục bằng kafka-exporter hoặc Burrow, rồi Prometheus và Grafana. Alert khi lag **tăng liên tục** chứ không theo giá trị tuyệt đối.
</details>

### 16. Consumer lag keeps growing. How do you troubleshoot?
<details><summary>Đáp án</summary>

- **Lượng vào tăng** (traffic tăng đột biến) hay **consumer chậm đi**? So sánh tốc độ produce và consume.
- Consumer có **đang chạy** không? Có lỗi lặp lại không (một message lỗi bị retry mãi, gọi là **poison pill**, làm kẹt cả partition)?
- **Rebalance liên tục** (xem log `Revoking`/`Assigned`)? Nguyên nhân: xử lý chậm hơn `max.poll.interval.ms`, GC pause, Pod restart.
- Lag dồn ở **một partition**: key bị lệch (hot key) hoặc consumer của partition đó gặp lỗi.
- Dependency phía sau chậm (DB).
- Xử lý:
  - Scale consumer (tối đa bằng số partition). Có thể tăng partition, nhưng cân nhắc ảnh hưởng tới thứ tự theo key.
  - Tối ưu xử lý, xử lý theo batch.
  - Đưa message lỗi vào **dead-letter topic**.
</details>

### 17. Explain retention and log compaction.
<details><summary>Đáp án</summary>

- `cleanup.policy=delete` (mặc định): xóa segment cũ theo `retention.ms` (mặc định 7 ngày) hoặc `retention.bytes`.
- `cleanup.policy=compact`: giữ lại **giá trị mới nhất cho mỗi key**, xóa các giá trị cũ. Message có giá trị `null` là **tombstone** dùng để xóa key. Hợp với dữ liệu dạng "trạng thái hiện tại" (bảng cấu hình, changelog). `__consumer_offsets` là topic compacted.
- Có thể kết hợp `compact,delete`.
</details>

### 18. Why is Kafka fast?
<details><summary>Đáp án</summary>

- **Ghi và đọc tuần tự** trên disk.
- Tận dụng **page cache** của OS thay vì cache trong heap.
- **Zero-copy** (`sendfile`): gửi dữ liệu từ page cache ra socket mà không copy qua user space (không áp dụng khi dùng TLS).
- **Batching** và **nén** (`batch.size`, `linger.ms`, `compression.type`: lz4, zstd, snappy, gzip).
- Song song theo partition.
</details>

### 19. How do you choose the number of partitions?
<details><summary>Đáp án</summary>

- Dựa trên **throughput mục tiêu** chia cho throughput của một partition (đo thực tế ở cả phía producer và consumer), và **số consumer song song tối đa** mong muốn.
- Nên dự phòng tăng trưởng, vì **không thể giảm** số partition, và tăng thì làm xáo trộn ánh xạ key.
- Quá nhiều partition làm tăng file handle, thời gian failover và tải metadata.
</details>

### 20. What happens to producers and consumers when a broker goes down?
<details><summary>Đáp án</summary>

- Partition mà broker đó làm leader sẽ được **chọn leader mới** từ ISR. Client nhận lỗi `NOT_LEADER_OR_FOLLOWER`, **làm mới metadata** rồi tự kết nối tới leader mới.
- Với RF=3 và `min.insync.replicas=2`, mọi thứ tiếp tục chạy. Partition trở thành **under-replicated** tới khi broker quay lại và bắt kịp.
- Nếu ISR rơi xuống dưới `min.insync.replicas` thì producer dùng `acks=all` bị từ chối ghi.
</details>

### 21. What is a dead-letter topic and how do you handle poison-pill messages?
<details><summary>Đáp án</summary>

Message không xử lý được (sai định dạng, vi phạm nghiệp vụ) sẽ **chặn partition** nếu bị retry mãi. Cách xử lý:
- Retry có giới hạn (kèm backoff).
- Sau đó chuyển sang **dead-letter topic (DLT)** kèm header lý do lỗi, rồi commit để đi tiếp.
- Có quy trình xem xét và xử lý lại DLT.
- Spring Kafka có `DefaultErrorHandler` + `DeadLetterPublishingRecoverer`.
- Lỗi do deserialization: dùng `ErrorHandlingDeserializer`.
</details>

## B. Kafka Operations

### 22. Which CLI tools do you use to operate Kafka?
<details><summary>Đáp án</summary>

```bash
kafka-topics.sh --bootstrap-server b:9092 --list
kafka-topics.sh --bootstrap-server b:9092 --describe --topic orders        # Leader, Replicas, Isr
kafka-topics.sh --bootstrap-server b:9092 --describe --under-replicated-partitions
kafka-topics.sh --bootstrap-server b:9092 --create --topic orders --partitions 12 --replication-factor 3
kafka-configs.sh --bootstrap-server b:9092 --entity-type topics --entity-name orders --alter --add-config retention.ms=259200000
kafka-consumer-groups.sh --bootstrap-server b:9092 --describe --group g1
kafka-consumer-groups.sh --bootstrap-server b:9092 --group g1 --topic orders --reset-offsets --to-earliest --execute   # group phải đang dừng
kafka-console-producer.sh / kafka-console-consumer.sh --from-beginning
kafka-reassign-partitions.sh   # chuyển partition giữa các broker
```
</details>

### 23. You see under-replicated partitions. What do you check?
<details><summary>Đáp án</summary>

- Broker nào bị **thiếu trong ISR**? Broker đó có đang chạy không, có restart không?
- **Disk** đầy hoặc chậm, **mạng** giữa các broker, **GC pause**, CPU hoặc throttling (trên Kubernetes).
- Broker vừa khởi động lại thì under-replicated tạm thời là bình thường. Phải hết sau khi broker bắt kịp.
- Kéo dài thì rủi ro mất dữ liệu tăng. Không rolling restart broker tiếp theo khi vẫn còn under-replicated.
</details>

### 24. How do you safely perform a rolling restart or upgrade of a Kafka cluster?
<details><summary>Đáp án</summary>

- Từng broker một: dừng gọn (controlled shutdown để chuyển leadership đi) → khởi động lại → **chờ under-replicated partitions về 0** và broker vào lại ISR → mới tới broker tiếp theo.
- Khi nâng phiên bản: làm theo hướng dẫn upgrade chính thức (thứ tự nâng broker, `metadata.version` trong KRaft hoặc `inter.broker.protocol.version` trong chế độ ZooKeeper).
- Trên Kubernetes: Strimzi tự làm rolling update đúng quy trình. PDB `maxUnavailable: 1`.
</details>

### 25. Why does running Kafka on Kubernetes need special care?
<details><summary>Đáp án</summary>

- **StatefulSet** và **PVC** riêng cho từng broker (danh tính và dữ liệu ổn định).
- **Headless Service** để client kết nối thẳng tới từng broker.
- **`advertised.listeners`** phải là địa chỉ client **thực sự truy cập được**: DNS của Pod trong cluster, và listener riêng cho client bên ngoài (NodePort hoặc LoadBalancer cho **từng broker**).
- Anti-affinity hoặc topology spread theo node và zone, cùng PDB.
- Disk hiệu năng tốt, resource kiểu Guaranteed, tránh CPU throttling.
- Nên dùng **Operator (Strimzi)** để quản lý broker, topic, user, TLS, rolling update.
</details>

### 26. What is KRaft and why did Kafka remove ZooKeeper?
<details><summary>Đáp án</summary>

**KRaft** (Kafka Raft) đưa việc quản lý **metadata vào chính Kafka**: một nhóm **controller** (3 hoặc 5 node, `process.roles=controller` hoặc chạy kết hợp với broker) dùng giao thức Raft để lưu metadata trong topic nội bộ `__cluster_metadata`. Lợi ích:
- Chỉ còn **một hệ thống** để vận hành và bảo mật.
- Failover controller **nhanh hơn**.
- Hỗ trợ **nhiều partition hơn**.

Migrate từ ZooKeeper sang KRaft phải làm ở dòng 3.x (3.9 là bản cầu nối) **trước khi** nâng lên 4.0.
</details>

### 27. A producer gets `RecordTooLargeException`. What do you change?
<details><summary>Đáp án</summary>

Message vượt giới hạn kích thước. Mặc định khoảng 1 MB ở broker (`message.max.bytes`) và ở topic (`max.message.bytes`). Phải cân đối **cả chuỗi**: `max.request.size` của producer, `max.message.bytes` của topic hoặc `message.max.bytes` của broker, `replica.fetch.max.bytes` hoặc `max.partition.fetch.bytes` của consumer. Tốt hơn là **không gửi payload lớn qua Kafka**: lưu lên object storage và gửi tham chiếu (claim-check pattern), hoặc nén.
</details>

### 28. How would you secure a Kafka cluster?
<details><summary>Đáp án</summary>

- **Mã hóa**: TLS cho client với broker và giữa các broker.
- **Xác thực**: mTLS hoặc SASL (SCRAM, OAUTHBEARER, Kerberos/GSSAPI).
- **Phân quyền**: **ACL** theo principal (topic, group, cluster).
- Listener riêng cho mạng nội bộ và bên ngoài. NetworkPolicy.
- Strimzi quản lý user và ACL qua CRD `KafkaUser`.
</details>

## C. ZooKeeper

### 29. What is ZooKeeper and what did Kafka use it for (pre-KRaft)?
<details><summary>Đáp án</summary>

ZooKeeper là dịch vụ **điều phối phân tán**, lưu dữ liệu nhỏ dạng cây (**znode**) với tính nhất quán mạnh. Dùng cho bầu leader, khóa phân tán, đăng ký dịch vụ và cấu hình.

Kafka chế độ ZooKeeper dùng nó để: **đăng ký broker** (ephemeral znode), **bầu controller**, lưu **cấu hình topic và partition**, ACL, thông báo thay đổi ISR.
</details>

### 30. Why does a ZooKeeper ensemble need an odd number of nodes?
<details><summary>Đáp án</summary>

ZooKeeper cần **đa số (quorum)** để ghi và bầu leader: `floor(n/2) + 1`.
- 3 node chịu được 1 node lỗi. 4 node **cũng chỉ chịu được 1** (cần 3/4). 5 node chịu được 2.
- Thêm node chẵn **không tăng khả năng chịu lỗi**, chỉ tăng chi phí và độ trễ ghi.
- Mất quorum thì ensemble **ngừng phục vụ ghi**. Đây là thiết kế để tránh **split brain**.
</details>

### 31. Explain znode types and watches.
<details><summary>Đáp án</summary>

- **Persistent**: tồn tại tới khi bị xóa.
- **Ephemeral**: **tự mất khi session của client kết thúc**. Đây là nền tảng phát hiện node chết (broker đăng ký bằng ephemeral znode).
- **Sequential**: ZooKeeper tự thêm số thứ tự tăng dần vào tên. Dùng cho bầu leader và hàng đợi khóa.
- Ngoài ra có container node và TTL node.
- **Watch**: client đăng ký để nhận thông báo khi znode thay đổi. Watch truyền thống **chỉ kích hoạt một lần**. Bản 3.6+ có persistent watch.
</details>

### 32. Explain the ZooKeeper ensemble roles and ports.
<details><summary>Đáp án</summary>

- **Leader** xử lý mọi lượt ghi (giao thức đồng thuận **ZAB**). **Follower** phục vụ đọc, chuyển tiếp lượt ghi cho leader, tham gia bỏ phiếu. **Observer** phục vụ đọc nhưng **không bỏ phiếu** (tăng khả năng đọc mà không làm chậm quorum).
- Port: **2181** (client), **2888** (follower kết nối leader), **3888** (bầu leader).
- Mỗi node có file **`myid`** khớp với dòng `server.N=` trong cấu hình.
</details>

### 33. How do you check ZooKeeper health?
<details><summary>Đáp án</summary>

```bash
echo ruok | nc zk-0 2181      # trả "imok"
echo srvr | nc zk-0 2181      # Mode: leader/follower, latency
echo mntr | nc zk-0 2181      # metric: zk_server_state, zk_followers, zk_synced_followers, zk_outstanding_requests
zkCli.sh -server zk-0:2181 ls /brokers/ids    # broker Kafka đã đăng ký (chế độ ZooKeeper)
```
Các lệnh "four letter word" phải được bật trong `4lw.commands.whitelist`. Ngoài ra có **AdminServer** HTTP (mặc định port 8080, `/commands`).
</details>

### 34. ZooKeeper disk keeps filling up. Why?
<details><summary>Đáp án</summary>

ZooKeeper ghi **transaction log** và **snapshot**, và mặc định **không tự xóa** bản cũ (`autopurge.purgeInterval=0`). Bật `autopurge.snapRetainCount` (ví dụ 3) và `autopurge.purgeInterval` (giờ). Nên đặt transaction log (`dataLogDir`) trên **disk riêng, có độ trễ thấp**, vì độ trễ fsync ảnh hưởng trực tiếp tới hiệu năng ghi.
</details>

### 35. Kafka brokers keep disappearing from ZooKeeper and coming back. What could cause it?
<details><summary>Đáp án</summary>

**Session ZooKeeper bị hết hạn**: broker không gửi heartbeat kịp trong `zookeeper.session.timeout.ms`, nên ephemeral znode bị xóa và controller coi broker là đã chết. Nguyên nhân thường gặp:
- **GC pause** dài trên broker.
- CPU throttling hoặc tranh tài nguyên trên Kubernetes.
- Mạng chập chờn.
- ZooKeeper quá tải hoặc fsync chậm.

Kiểm tra log GC, log `Session expired`, metric latency của ZooKeeper.
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/): tài liệu tổng.
- [Kafka: Design](https://kafka.apache.org/documentation/#design): persistence, page cache, zero-copy, replication, ISR, log compaction, delivery semantics.
- [Kafka: Producer Configs](https://kafka.apache.org/documentation/#producerconfigs) và [Consumer Configs](https://kafka.apache.org/documentation/#consumerconfigs): `acks`, `enable.idempotence`, `auto.offset.reset`, `max.poll.interval.ms`, `session.timeout.ms`.
- [Kafka: Topic Configs](https://kafka.apache.org/documentation/#topicconfigs): `retention.ms`, `cleanup.policy`, `min.insync.replicas`.
- [Kafka: Operations](https://kafka.apache.org/documentation/#operations): công cụ CLI, rolling restart, reassign partition, monitoring.
- [Kafka: KRaft](https://kafka.apache.org/documentation/#kraft) và [ZooKeeper to KRaft Migration](https://kafka.apache.org/documentation/#kraft_zk_migration): KRaft và migrate.
- [Kafka 4.0 Release Announcement](https://kafka.apache.org/blog#apache_kafka_400_release_announcement): bỏ ZooKeeper, KIP-848.
- [Strimzi Documentation](https://strimzi.io/documentation/): Kafka trên Kubernetes.
- [Spring for Apache Kafka: Error Handling / DLT](https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html): xử lý lỗi và dead-letter.
- [ZooKeeper Administrator's Guide](https://zookeeper.apache.org/doc/current/zookeeperAdmin.html): ensemble, port, autopurge, 4lw commands, AdminServer.
- [ZooKeeper Programmer's Guide](https://zookeeper.apache.org/doc/current/zookeeperProgrammers.html): znode, ephemeral, sequential, watch.
