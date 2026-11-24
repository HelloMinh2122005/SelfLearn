# 07. Microservices Architecture & Testing Strategy

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt.
> JD yêu cầu: *"Prototype, develop and maintain end-to-end test strategies, test scope, test cases to verify the interaction of microservices."*

---

## A. Microservices Architecture

### 1. What is a microservice architecture? What are its benefits and costs?
<details><summary>Đáp án</summary>

Ứng dụng được chia thành nhiều **service nhỏ, độc lập**. Mỗi service sở hữu một nghiệp vụ và **dữ liệu riêng**, giao tiếp qua mạng (REST, gRPC, messaging), và **deploy độc lập**.
- **Lợi ích**: các team làm việc và release độc lập, scale riêng phần cần thiết, cô lập lỗi, tự chọn công nghệ.
- **Chi phí**: phức tạp ở hệ thống phân tán (độ trễ mạng, lỗi một phần, nhất quán dữ liệu), vận hành nhiều thành phần, **test tương tác khó hơn**, cần observability và CI/CD trưởng thành.
</details>

### 2. Synchronous (REST/gRPC) vs asynchronous (Kafka) communication: trade-offs?
<details><summary>Đáp án</summary>

- **Đồng bộ**: đơn giản, có phản hồi ngay. Nhưng hai service **phụ thuộc thời gian thực vào nhau**: B chậm thì A chậm, B chết thì A lỗi. Chuỗi gọi dài làm độ trễ và xác suất lỗi cộng dồn.
- **Bất đồng bộ** (event qua Kafka): tách rời theo thời gian, chịu được việc consumer tạm chết, dễ thêm consumer mới. Nhưng dữ liệu **nhất quán sau** (eventual consistency), khó debug luồng, phải xử lý trùng lặp và thứ tự message.
</details>

### 3. Why "database per service"? What problems does it introduce?
<details><summary>Đáp án</summary>

Mỗi service sở hữu dữ liệu của mình, nên thay đổi schema không phá service khác, và có thể chọn loại DB phù hợp (Cassandra, Postgres...). Vấn đề phát sinh:
- **Không còn JOIN hay transaction xuyên service**.
- Phải dùng **saga**, event, CQRS.
- Dữ liệu trùng lặp và chỉ nhất quán sau một thời gian.
</details>

### 4. Explain the Saga pattern.
<details><summary>Đáp án</summary>

Saga thay một transaction phân tán bằng **chuỗi transaction cục bộ**. Mỗi bước có một **hành động bù trừ** (compensating action) để hoàn tác nếu bước sau thất bại. Hai kiểu:
- **Choreography**: các service phản ứng với event của nhau, không có điều phối trung tâm.
- **Orchestration**: một orchestrator ra lệnh cho từng bước.

Ví dụ: tạo đơn → trừ kho → thanh toán thất bại → hoàn kho → hủy đơn.
</details>

### 5. What is the Transactional Outbox pattern and why is it needed?
<details><summary>Đáp án</summary>

Vấn đề **dual write**: ghi DB rồi gửi Kafka, nếu bước thứ hai lỗi thì hai hệ thống không khớp nhau. Outbox: trong **cùng transaction DB**, ghi cả dữ liệu nghiệp vụ và một bản ghi vào bảng `outbox`. Một tiến trình riêng (polling hoặc CDC như Debezium) đọc bảng `outbox` và publish lên Kafka. Kết quả là đảm bảo **at-least-once**, nên consumer phải idempotent.
</details>

### 6. What is idempotency and why is it essential with retries and Kafka?
<details><summary>Đáp án</summary>

Một thao tác idempotent cho **cùng kết quả dù thực hiện một hay nhiều lần**. Retry HTTP, consumer xử lý lại message sau rebalance, và at-least-once delivery đều **sinh trùng lặp**. Cách làm:
- Dùng idempotency key hoặc message id.
- Lưu bảng "đã xử lý".
- Dùng upsert thay vì insert.
</details>

### 7. Explain timeouts, retries with backoff, circuit breaker and bulkhead.
<details><summary>Đáp án</summary>

- **Timeout**: không chờ vô hạn. Mọi lời gọi mạng đều phải có timeout.
- **Retry + exponential backoff + jitter**: thử lại lỗi tạm thời. Jitter tránh việc mọi client retry cùng lúc (thundering herd). Chỉ retry thao tác idempotent.
- **Circuit breaker**: khi tỉ lệ lỗi cao thì "ngắt mạch", trả lỗi hoặc fallback ngay thay vì tiếp tục gọi service đang chết, rồi thử lại sau (trạng thái half-open).
- **Bulkhead**: tách tài nguyên (thread pool, connection pool) cho từng dependency, để một dependency chậm không ăn hết tài nguyên chung.
- Thư viện Java: **Resilience4j**.
</details>

### 8. What is service discovery and how does Kubernetes provide it?
<details><summary>Đáp án</summary>

Service discovery giúp service tìm địa chỉ của nhau khi IP thay đổi liên tục. Trong Kubernetes, **Service + DNS (CoreDNS)** làm việc này: gọi `http://orders.shop.svc.cluster.local`, kube-proxy cân bằng tới các Pod Ready. Không cần Eureka hay Consul như các hệ thống ngoài K8s.
</details>

### 9. What is an API Gateway and how is it different from a service mesh?
<details><summary>Đáp án</summary>

- **API Gateway**: điểm vào **từ bên ngoài** (north-south traffic). Đảm nhận định tuyến, xác thực, rate limit, chuyển đổi giao thức, gom API.
- **Service mesh** (Istio, Linkerd): quản lý traffic **giữa các service bên trong** (east-west) bằng sidecar hoặc proxy: mTLS, retry, timeout, chia traffic, telemetry, mà không phải sửa code.
</details>

### 10. What is distributed tracing and why do you need correlation IDs?
<details><summary>Đáp án</summary>

Một request đi qua nhiều service. **Tracing** gán **trace ID** chung và **span** cho từng bước, cho thấy request mất bao lâu ở đâu. Chuẩn hiện nay là **OpenTelemetry** (W3C `traceparent` header). Ghi trace ID vào **log** của mọi service để từ một lỗi tìm ra toàn bộ log liên quan. Với Kafka, truyền trace ID trong **message header**.
</details>

### 11. What are the Twelve-Factor App principles most relevant to running on Kubernetes?
<details><summary>Đáp án</summary>

- **Config** trong biến môi trường, tách khỏi code (ConfigMap, Secret).
- **Backing services** coi như tài nguyên gắn vào qua URL.
- **Build, release, run** tách biệt (build once, deploy many).
- **Processes** stateless, scale ngang.
- **Port binding**.
- **Disposability**: khởi động nhanh, tắt gọn gàng khi nhận SIGTERM.
- **Dev/prod parity**.
- **Logs** là luồng sự kiện ghi ra stdout.
</details>

## B. Testing Strategy

### 12. Explain the test pyramid for microservices.
<details><summary>Đáp án</summary>

Từ dưới lên (nhiều, nhanh, rẻ ở đáy; ít, chậm, đắt ở đỉnh):
1. **Unit test**: logic trong một lớp hoặc module, không I/O.
2. **Integration test**: service với dependency thật của nó (DB, Kafka), thường dùng Testcontainers.
3. **Component test**: cả một service chạy cô lập, dependency bên ngoài được **stub** (WireMock, Kafka giả lập).
4. **Contract test**: kiểm tra **hợp đồng API hoặc message** giữa consumer và provider.
5. **End-to-end test**: toàn hệ thống qua các luồng nghiệp vụ chính.

Nguyên tắc: phần lớn kiểm tra nằm ở tầng thấp. E2E **ít** nhưng bao các luồng quan trọng nhất.
</details>

### 13. Why shouldn't you rely mainly on end-to-end tests for microservices?
<details><summary>Đáp án</summary>

- **Chậm**: phải dựng cả hệ thống.
- **Dễ flaky**: mạng, timing, dữ liệu dùng chung.
- **Khó chẩn đoán**: fail không chỉ ra service nào lỗi.
- **Tốn kém** môi trường.
- Kéo theo việc **deploy theo khối**, đi ngược lợi ích deploy độc lập.

Nên dùng contract test và component test để bắt phần lớn lỗi tương tác. Giữ E2E cho một số user journey quan trọng.
</details>

### 14. What is consumer-driven contract testing? How does it work?
<details><summary>Đáp án</summary>

- **Consumer** viết test mô tả **những gì nó cần** từ provider (request và response mong đợi, hoặc định dạng message). Test sinh ra **contract**.
- Contract được chia sẻ (ví dụ qua Pact Broker), và **provider chạy verify** contract trong pipeline của nó.
- Provider đổi API làm hỏng consumer nào thì **pipeline của provider fail trước khi deploy**.
- Công cụ: **Pact**, **Spring Cloud Contract**. Hỗ trợ cả HTTP và message (Kafka).
- Có thể dùng `can-i-deploy` để kiểm tra phiên bản có tương thích với những gì đang chạy ở môi trường đích.
</details>

### 15. How would you test a service that consumes and produces Kafka events?
<details><summary>Đáp án</summary>

- **Unit**: logic xử lý message (không cần Kafka).
- **Integration**: dùng **Testcontainers Kafka** (broker thật) hoặc Embedded Kafka của Spring. Produce message vào topic input, rồi **chờ có timeout** (Awaitility) và kiểm tra message ở topic output, trạng thái DB, hoặc offset đã commit.
- **Contract**: hợp đồng message giữa producer và consumer.
- Kiểm tra cả các trường hợp: **message trùng** (idempotency), **message lỗi** (đi vào dead-letter topic), **sai thứ tự**, **consumer restart** giữa chừng.
- Tránh `Thread.sleep()` cố định, vì vừa chậm vừa flaky.
</details>

### 16. What is Testcontainers and why is it useful?
<details><summary>Đáp án</summary>

Thư viện (Java và nhiều ngôn ngữ khác) khởi động **container thật** (Postgres, Kafka, Cassandra, Elasticsearch) trong lúc chạy test và tự dọn khi xong. Test chạy với dependency **giống production** thay vì mock hoặc DB trong bộ nhớ (H2), nên bắt được lỗi SQL dialect, cấu hình, serialization. Cần môi trường container trong CI (Docker daemon hoặc tương đương).
</details>

### 17. Mocks vs stubs vs fakes: what is the difference?
<details><summary>Đáp án</summary>

- **Stub**: trả về câu trả lời định sẵn (WireMock trả JSON cố định cho một path).
- **Mock**: ngoài trả về còn **kiểm tra cách nó được gọi** (được gọi mấy lần, với tham số gì). Ví dụ Mockito `verify`.
- **Fake**: một bản cài đặt **chạy được nhưng đơn giản hóa** (repository trong bộ nhớ, Kafka giả lập).
- Quá nhiều mock khiến test chỉ kiểm tra "cách cài đặt" và vỡ khi refactor.
</details>

### 18. How would you define the scope of an end-to-end test suite for a microservice platform?
<details><summary>Đáp án</summary>

- Chọn **các user journey quan trọng nhất về nghiệp vụ** (đi qua nhiều service, nhiều rủi ro, có lịch sử lỗi), không cố bao mọi nhánh logic.
- Liệt kê các **điểm tích hợp**: API đồng bộ, topic Kafka, DB dùng chung, dịch vụ bên ngoài.
- Với mỗi journey: tiền điều kiện (dữ liệu), các bước, kết quả mong đợi ở **từng service** (bao gồm event đã phát ra, trạng thái lưu trữ), và **tiêu chí timeout** cho luồng bất đồng bộ.
- Xác định môi trường chạy (staging hoặc môi trường tạm), tần suất (mỗi lần deploy hay hàng đêm), và **ai sở hữu** test.
- Cân nhắc cả tình huống lỗi: một service chết thì luồng phản ứng ra sao.
</details>

### 19. Write the outline of an end-to-end test case for "place an order" across Order, Inventory and Payment services connected via Kafka.
<details><summary>Đáp án</summary>

- **Precondition**: sản phẩm P có tồn kho 10. Tài khoản test có số dư đủ. Dữ liệu được tạo bằng API, có tiền tố ID riêng của lần chạy.
- **Steps**:
  1. `POST /orders` (P, số lượng 2) trả về 202 và `orderId`.
  2. Chờ (polling có timeout 30 giây) tới khi `GET /orders/{id}` có `status=CONFIRMED`.
- **Assertions**:
  - Topic `order-created` có event với `orderId`.
  - Inventory: tồn kho P còn 8.
  - Payment: có giao dịch cho `orderId`.
  - Không có message trong dead-letter topic.
  - Trace có đủ các span.
- **Negative case**: số lượng 20 dẫn tới `REJECTED`, tồn kho không đổi, không có thanh toán.
- **Cleanup**: xóa hoặc đánh dấu dữ liệu test.
</details>

### 20. What causes flaky tests and how do you deal with them?
<details><summary>Đáp án</summary>

- **Nguyên nhân**:
  - `sleep` cố định, race condition trong luồng bất đồng bộ.
  - Phụ thuộc thứ tự chạy test hoặc dữ liệu dùng chung.
  - Thời gian và múi giờ.
  - Dependency bên ngoài không ổn định.
  - Thiếu tài nguyên trên runner.
- **Cách xử lý**:
  - Chờ theo **điều kiện có timeout**, không dùng sleep.
  - Mỗi test có **dữ liệu riêng**, ID ngẫu nhiên.
  - Môi trường cô lập (Testcontainers, namespace riêng).
  - Theo dõi tỉ lệ flaky. **Cách ly (quarantine)** test flaky kèm ticket sửa, không để chúng làm mọi người quen bỏ qua pipeline đỏ.
  - Retry chỉ là biện pháp tạm, không phải cách sửa.
</details>

### 21. How do you manage test data for integration and E2E tests?
<details><summary>Đáp án</summary>

- Tạo dữ liệu **bằng API hoặc fixture trong chính test**, không phụ thuộc dữ liệu có sẵn trong môi trường.
- Dùng ID hoặc tiền tố duy nhất cho mỗi lần chạy để các pipeline song song không đụng nhau.
- Dọn dẹp sau test, hoặc dùng môi trường tạm bị xóa sau đó.
- Không dùng dữ liệu production thật (quyền riêng tư). Nếu cần dữ liệu "giống thật" thì ẩn danh hóa.
</details>

### 22. What are ephemeral (preview) environments and how would you build them on Kubernetes?
<details><summary>Đáp án</summary>

Mỗi MR được dựng một môi trường riêng: **namespace** `review-<slug>`, deploy service đang thay đổi (image của MR) cùng các service khác ở phiên bản ổn định (hoặc stub), chạy test, rồi tự xóa khi MR đóng (GitLab `environment:on_stop`, `auto_stop_in`). Dùng Helm với values riêng (ít replica, resource nhỏ). Thách thức: chi phí, thời gian dựng các thành phần nặng như Kafka hay Cassandra. Có thể dùng chung một cụm Kafka với topic theo tiền tố.
</details>

### 23. Where in the pipeline would each type of test run?
<details><summary>Đáp án</summary>

- **MR pipeline**: lint, unit, integration (Testcontainers), contract (consumer publish, provider verify), quét bảo mật, `helm lint`/`template`.
- **Sau khi merge, deploy dev/staging**: smoke test, E2E các luồng chính, test hiệu năng cơ bản.
- **Trước prod**: kiểm tra `can-i-deploy` của contract, phê duyệt.
- **Sau deploy prod**: smoke test, theo dõi canary.
- **Định kỳ** (hàng đêm): E2E đầy đủ, test hiệu năng hoặc tải, chaos test.
</details>

### 24. How would you test resilience of microservices (what happens when a dependency fails)?
<details><summary>Đáp án</summary>

- Test ở tầng component: stub trả lỗi, chậm, timeout, để kiểm tra retry, circuit breaker, fallback.
- **Chaos testing** trên môi trường thử: xóa Pod, ngắt mạng, thêm độ trễ (Chaos Mesh, LitmusChaos, hoặc Toxiproxy với Testcontainers). Tắt một broker Kafka hay một node Cassandra để kiểm tra hệ thống vẫn hoạt động.
- Đo bằng metric: tỉ lệ lỗi, thời gian khôi phục.
</details>

### 25. What kinds of non-functional tests matter for this platform?
<details><summary>Đáp án</summary>

- **Hiệu năng và tải** (Gatling, JMeter, k6): throughput, latency p95/p99 dưới tải, consumer lag dưới tải.
- **Soak test**: chạy dài để lộ rò rỉ memory hoặc kết nối.
- **Khả năng mở rộng**: HPA có scale kịp không.
- **Bảo mật**: SAST, DAST, quét image.
- **Resilience và chaos**.
- **Khôi phục**: backup và restore Cassandra hoặc Elasticsearch, thời gian failover.
</details>

### 26. How do you measure whether your test strategy is effective?
<details><summary>Đáp án</summary>

- **Lỗi lọt lên prod** (change failure rate, lỗi lẽ ra phải được test bắt).
- **Thời gian pipeline** và tỉ lệ flaky.
- Coverage chỉ là chỉ số phụ: coverage cao chưa chắc đã test đúng chỗ.
- Mỗi sự cố production nên trả lời được câu "test nào lẽ ra đã bắt được lỗi này?" và bổ sung test đó.
</details>

### 27. How would you verify that a new version of a service is compatible with the versions of other services currently running in production?
<details><summary>Đáp án</summary>

- Contract test, kèm kiểm tra **"can I deploy"** đối chiếu với các phiên bản đang chạy ở môi trường đích.
- Môi trường staging chạy **đúng phiên bản các service khác như trên prod**, chỉ thay service đang thử.
- Kiểm tra tương thích schema (Kafka Schema Registry compatibility check, migration DB theo expand/contract).
- Canary trên prod với metric so sánh.
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [The Twelve-Factor App](https://12factor.net/): nguyên tắc xây dựng ứng dụng cloud-native.
- [Testcontainers for Java](https://java.testcontainers.org/): container thật trong test.
- [Testcontainers Kafka Module](https://java.testcontainers.org/modules/kafka/): Kafka trong integration test.
- [Pact Documentation](https://docs.pact.io/): consumer-driven contract testing.
- [Spring Cloud Contract](https://docs.spring.io/spring-cloud-contract/reference/): contract testing trong hệ Spring.
- [Spring for Apache Kafka: Testing](https://docs.spring.io/spring-kafka/reference/testing.html): test ứng dụng Spring Kafka.
- [Resilience4j](https://resilience4j.readme.io/docs): circuit breaker, retry, bulkhead.
- [OpenTelemetry: Concepts](https://opentelemetry.io/docs/concepts/): trace, span, context propagation.
- [GitLab Review Apps](https://docs.gitlab.com/ci/review_apps/): môi trường tạm theo MR.
- [Martin Fowler: Testing Strategies in a Microservice Architecture](https://martinfowler.com/articles/microservice-testing/) *(Tier 3, minh họa các tầng test)*.
- [microservices.io: Saga](https://microservices.io/patterns/data/saga.html) và [Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html) *(Tier 3, minh họa pattern)*.
