# 09. Java: Build Tooling & JVM in Containers

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt.
> **Phiên bản:** các phiên bản LTS là Java 17, 21, 25. Spring Boot 3.x cần Java 17+ và `jakarta.*`. Spring Boot 4.0 đã ra mắt cuối 2025; khi dùng hãy đối chiếu release notes.

---

## A. Build (Maven / Gradle)

### 1. Explain the Maven build lifecycle and its main phases.
<details><summary>Đáp án</summary>

Lifecycle `default` gồm các phase chính theo thứ tự: `validate` → `compile` → `test` → `package` → `verify` → `install` → `deploy`. **Chạy một phase thì mọi phase trước nó cũng chạy.**
- `package`: tạo jar.
- `verify`: chạy kiểm tra sau package, ví dụ integration test qua Failsafe.
- `install`: copy vào repository local `~/.m2`.
- `deploy`: đẩy lên repository từ xa (Nexus, Artifactory, GitLab Package Registry).
- Ngoài ra có lifecycle `clean` và `site`.
</details>

### 2. Surefire vs Failsafe plugin.
<details><summary>Đáp án</summary>

- **Surefire**: chạy **unit test** ở phase `test` (mặc định các lớp `*Test`, `Test*`, `*Tests`, `*TestCase`). Test fail thì build dừng ngay.
- **Failsafe**: chạy **integration test** (`*IT`, `IT*`, `*ITCase`) ở phase `integration-test`. Kết quả được kiểm tra ở phase `verify`, nên giữa chừng vẫn chạy được `post-integration-test` để dọn môi trường.
- Lệnh trong CI: `mvn -B verify`.
</details>

### 3. `-DskipTests` vs `-Dmaven.test.skip=true`.
<details><summary>Đáp án</summary>

- `-DskipTests`: **biên dịch** test nhưng không chạy.
- `-Dmaven.test.skip=true`: bỏ qua cả **biên dịch và chạy** test. Module khác phụ thuộc vào test-jar có thể bị lỗi.
</details>

### 4. What is a SNAPSHOT version vs a release version?
<details><summary>Đáp án</summary>

- `1.4.0-SNAPSHOT`: phiên bản **đang phát triển**, có thể bị ghi đè. Maven kiểm tra bản mới theo chính sách cập nhật.
- `1.4.0`: **bất biến**. Repository thường không cho đẩy lại cùng phiên bản.
- Không release sản phẩm phụ thuộc SNAPSHOT, vì build sẽ không tái lập được.
</details>

### 5. How do you manage dependency versions and conflicts in Maven?
<details><summary>Đáp án</summary>

- `dependencyManagement` hoặc **BOM** (ví dụ `spring-boot-dependencies`) để ghim phiên bản tập trung.
- Khi có xung đột, Maven chọn theo **"nearest wins"**: phụ thuộc gần gốc cây nhất thắng.
- Kiểm tra bằng `mvn dependency:tree`. Loại bỏ bằng `<exclusions>`.
- Plugin `maven-enforcer` (quy tắc `dependencyConvergence`) để bắt xung đột.
</details>

### 6. What does `mvn -B` do and why use it in CI?
<details><summary>Đáp án</summary>

`-B` (batch mode) là chế độ không tương tác: không hỏi input, không in thanh tiến trình tải xuống làm rác log. Hay dùng kèm `-ntp` (`--no-transfer-progress`) để log CI gọn.
</details>

### 7. What is the Gradle wrapper and why commit it?
<details><summary>Đáp án</summary>

`gradlew` cùng `gradle/wrapper/gradle-wrapper.properties` tự tải **đúng phiên bản Gradle** của project. Mọi máy và CI build bằng cùng phiên bản mà không cần cài Gradle. Maven có cơ chế tương tự là `mvnw` (Maven Wrapper).
</details>

### 8. How can you build container images for Java without writing a Dockerfile?
<details><summary>Đáp án</summary>

- **Jib** (plugin Maven/Gradle): build image thẳng từ project, tách layer dependency, resources và class. **Không cần Docker daemon**.
- **Spring Boot build-image** (`mvn spring-boot:build-image`): dùng **Cloud Native Buildpacks**, cần Docker daemon hoặc tương đương.
- Spring Boot hỗ trợ **layered jar** để Dockerfile tách layer dependency và code, giúp cache tốt hơn.
</details>

## B. JVM in Containers

### 9. Is the JVM container-aware? Since when?
<details><summary>Đáp án</summary>

Có. `-XX:+UseContainerSupport` **bật mặc định từ JDK 10** và được backport về **JDK 8u191**. JVM đọc giới hạn memory và CPU từ **cgroup** (hỗ trợ cgroup v2 ở các bản JDK mới) để tính heap mặc định và số thread GC. JDK cũ hơn sẽ thấy RAM và CPU của cả node, dễ bị OOMKilled.
</details>

### 10. How is the default maximum heap calculated? Which flags control it?
<details><summary>Đáp án</summary>

- Mặc định heap tối đa = **25%** memory khả dụng (giới hạn của container) với memory ở mức thông thường.
- Điều chỉnh theo tỉ lệ: `-XX:MaxRAMPercentage=75` (và `InitialRAMPercentage`). Heap tự co giãn khi đổi limit trong Helm.
- `-Xmx` đặt giá trị tuyệt đối, phải sửa mỗi khi đổi limit.
- Kiểm tra: `java -XX:+PrintFlagsFinal -version | grep -E 'MaxHeapSize|UseContainerSupport'`.
</details>

### 11. What contributes to JVM memory besides the heap?
<details><summary>Đáp án</summary>

- **Metaspace**: metadata của class.
- **Code cache**: mã đã được JIT biên dịch.
- **Thread stacks**: khoảng 1 MB mỗi thread trên Linux 64-bit mặc định, nên 500 thread ≈ 500 MB.
- **Direct/NIO buffers** (Netty, Kafka client).
- Cấu trúc dữ liệu của **GC**.
- Thư viện native, JNI, malloc arena.

Vì vậy RSS > heap. Không đặt `MaxRAMPercentage` quá cao (ví dụ 90%) nếu app nhiều thread hoặc dùng nhiều direct buffer.
</details>

### 12. `java.lang.OutOfMemoryError` vs Kubernetes `OOMKilled`: what's the difference?
<details><summary>Đáp án</summary>

- `OutOfMemoryError`: **JVM tự phát hiện** (heap hoặc metaspace hết). JVM ném exception, có stack trace trong log, process có thể vẫn sống ở trạng thái lỗi. Các biến thể: `Java heap space`, `Metaspace`, `unable to create native thread`, `Direct buffer memory`, `GC overhead limit exceeded`.
- `OOMKilled`: **kernel** kill process vì cgroup vượt `memory.max`. Không có stack trace, exit code 137. Thường do phần memory ngoài heap, hoặc heap đặt quá sát limit.
</details>

### 13. How do you investigate native memory growth in a JVM?
<details><summary>Đáp án</summary>

- Bật `-XX:NativeMemoryTracking=summary` (có chút overhead), rồi chạy `jcmd <pid> VM.native_memory summary`. Đặt baseline rồi so sánh bằng `VM.native_memory baseline` và `summary.diff`.
- Xem số thread (`jcmd <pid> Thread.print | grep -c '"'`), direct buffer, metaspace.
- So sánh với RSS từ `/proc/<pid>/status` (`VmRSS`).
</details>

### 14. How do you capture a heap dump and a thread dump from a Java Pod?
<details><summary>Đáp án</summary>

```bash
kubectl exec -it api-x -- jcmd 1 Thread.print > threads.txt       # thread dump
kubectl exec -it api-x -- jcmd 1 GC.heap_dump /tmp/heap.hprof     # heap dump
kubectl cp api-x:/tmp/heap.hprof ./heap.hprof
```
- Thread dump cũng lấy được bằng `kill -3 1` (SIGQUIT, in ra stdout).
- Tự động khi OOM: `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps` với `/dumps` là volume, để file không mất khi container restart.
- Image JRE tối giản có thể không có `jcmd`, khi đó dùng ephemeral container có JDK.
- Phân tích bằng Eclipse MAT hoặc VisualVM.
</details>

### 15. How do CPU limits affect the JVM?
<details><summary>Đáp án</summary>

- JVM tính số CPU khả dụng từ cgroup. Giá trị này quyết định số thread GC, JIT compiler và kích thước pool mặc định (ForkJoinPool).
- JVM chọn GC theo "ergonomics": nếu **ít hơn 2 CPU hoặc ít hơn khoảng 1792 MB** memory, JVM coi máy không phải "server-class" và mặc định chọn **SerialGC** thay vì G1. Nên đặt GC tường minh (`-XX:+UseG1GC`) và cấp đủ CPU.
- CPU limit thấp dẫn tới **throttling** khi khởi động (JIT) và khi GC, làm khởi động chậm và tăng latency.
- Có thể ép bằng `-XX:ActiveProcessorCount=N`.
</details>

### 16. Name the main garbage collectors and when you'd choose them.
<details><summary>Đáp án</summary>

- **Serial**: một thread, cho heap nhỏ hoặc container rất nhỏ.
- **Parallel**: tối đa throughput, chấp nhận pause dài hơn (batch).
- **G1** (mặc định từ JDK 9): cân bằng giữa throughput và pause. Mặc định hợp lý cho service.
- **ZGC**: pause rất ngắn, phù hợp heap lớn. Có bản generational từ JDK 21.
- **Shenandoah**: pause thấp (có trong các bản OpenJDK, tùy nhà phát hành).
- Chọn theo yêu cầu latency và kích thước heap. Đo trước khi tinh chỉnh.
</details>

### 17. A Spring Boot service takes 60 seconds to start in Kubernetes. What can you do?
<details><summary>Đáp án</summary>

- Về Kubernetes: **startupProbe** đủ dài, **CPU request** đủ (khởi động JVM rất tốn CPU), xem lại CPU limit.
- Về ứng dụng:
  - Giảm auto-configuration không cần thiết, dùng lazy initialization có chọn lọc.
  - **Class Data Sharing (CDS/AppCDS)** để giảm thời gian nạp class.
  - Cân nhắc GraalVM native image (đánh đổi thời gian build và một số giới hạn).
- Kiểm tra app có chờ dependency (DB, Kafka) lúc khởi động không.
</details>

### 18. How do Spring Boot Actuator health groups map to Kubernetes probes?
<details><summary>Đáp án</summary>

- Spring Boot cung cấp `/actuator/health/liveness` và `/actuator/health/readiness`, dựa trên trạng thái `LivenessState` và `ReadinessState` của ứng dụng. Các endpoint này **tự bật khi Spring Boot phát hiện đang chạy trên Kubernetes** (hoặc bật bằng `management.endpoint.health.probes.enabled=true`).
- Mặc định **liveness không phụ thuộc DB hay Kafka**, để tránh restart dây chuyền. Có thể thêm health indicator vào group readiness nếu thực sự cần.
- Readiness chuyển sang `REFUSING_TRAFFIC` khi app đang tắt.
</details>

### 19. How does graceful shutdown work in Spring Boot?
<details><summary>Đáp án</summary>

- Khi nhận SIGTERM, web server **ngừng nhận request mới** và chờ request đang xử lý xong, tối đa `spring.lifecycle.timeout-per-shutdown-phase` (mặc định 30s).
- **Từ Spring Boot 3.4, graceful shutdown được bật mặc định** cho các web server nhúng. Trước đó phải đặt `server.shutdown=graceful`. Muốn tắt ngay thì đặt `server.shutdown=immediate`.
- `terminationGracePeriodSeconds` của Pod phải **lớn hơn** thời gian chờ này cộng với `preStop`.
- Kafka consumer cũng phải đóng gọn để commit offset và rời group sạch sẽ.
</details>

### 20. How do you externalize configuration for a Spring Boot app on Kubernetes?
<details><summary>Đáp án</summary>

- **Biến môi trường** với relaxed binding: `SPRING_DATASOURCE_URL` ánh xạ tới `spring.datasource.url`, `SPRING_PROFILES_ACTIVE=prod`.
- Mount ConfigMap thành file `application.yaml` (dùng `spring.config.import` hoặc `SPRING_CONFIG_ADDITIONAL_LOCATION`).
- Secret dưới dạng env hoặc file (`configtree:`).
- Không build image riêng cho từng môi trường (build once, deploy many).
</details>

### 21. How do you read a Java stack trace to find the root cause?
<details><summary>Đáp án</summary>

- Dòng đầu là **loại exception và thông điệp**. Các dòng `at ...` là call stack, **khung trên cùng là nơi exception được ném**.
- Exception bọc nhau qua các khối **`Caused by:`**. **Nguyên nhân gốc thường nằm ở `Caused by` cuối cùng** (dưới cùng).
- `... 42 more` nghĩa là các khung trùng với exception bao ngoài.
- Tìm khung đầu tiên thuộc **package của mình** (`com.company...`) để biết code nào gây lỗi.
- Trong log tập trung, lọc theo trace ID để thấy bối cảnh trước lỗi.
</details>

### 22. Your service logs `HikariPool-1 - Connection is not available, request timed out after 30000ms`. What does it mean?
<details><summary>Đáp án</summary>

**Connection pool** tới DB đã cạn: mọi kết nối đều đang được dùng và request phải chờ quá timeout. Nguyên nhân:
- Query chậm hoặc bị lock.
- Rò rỉ kết nối (không đóng).
- Pool quá nhỏ so với tải.
- DB chậm hoặc mất kết nối.
- Quá nhiều replica nhân với pool size vượt `max_connections` của DB.

Kiểm tra metric của Hikari (active, pending), slow query log, thread dump (thread nào đang giữ kết nối).
</details>

### 23. What is the difference between JDK, JRE and JVM? Which one should be in a runtime image?
<details><summary>Đáp án</summary>

- **JVM**: máy ảo thực thi bytecode.
- **JRE**: JVM cộng thư viện chuẩn, đủ để **chạy**.
- **JDK**: JRE cộng công cụ phát triển (`javac`, `jcmd`, `jstack`, `jlink`...).
- Image runtime nên dùng **JRE** hoặc runtime tối giản tạo bằng **`jlink`** để nhỏ và an toàn hơn. Đổi lại không có công cụ chẩn đoán, khi cần thì dùng ephemeral container.
</details>

### 24. How would you size requests/limits for a Java microservice?
<details><summary>Đáp án</summary>

- Đo thực tế dưới tải: heap sau GC, RSS, CPU lúc khởi động và lúc chạy ổn định.
- Memory: đặt `requests = limits` (tránh bị evict, dễ dự đoán), `MaxRAMPercentage` khoảng 60–75%.
- CPU: request đủ cho tải thường. Cân nhắc **không đặt CPU limit hoặc đặt limit rộng** để tránh throttling lúc khởi động và GC. Đây là chủ đề còn tranh luận, nên làm theo chính sách của nền tảng.
- Theo dõi throttling, OOMKilled, GC pause rồi điều chỉnh.
</details>

### 25. How does a Java Kafka consumer behave if processing takes longer than `max.poll.interval.ms`?
<details><summary>Đáp án</summary>

Consumer bị coi là **chết** (mặc định `max.poll.interval.ms` = 300000, tức 5 phút). Nó bị loại khỏi group, gây **rebalance**, partition được giao cho consumer khác. Offset chưa commit nên message bị **xử lý lại**. Nếu lặp lại liên tục thì thành rebalance storm. Cách xử lý:
- Giảm `max.poll.records`.
- Xử lý nhanh hơn, hoặc tăng `max.poll.interval.ms`.
- Không làm việc chặn quá lâu trong vòng poll.
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [Apache Maven: Introduction to the Build Lifecycle](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html): các phase của Maven.
- [Maven Surefire](https://maven.apache.org/surefire/maven-surefire-plugin/) và [Maven Failsafe](https://maven.apache.org/surefire/maven-failsafe-plugin/): unit test và integration test.
- [Maven: Introduction to the Dependency Mechanism](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html): dependency mediation và BOM.
- [Gradle Wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html): wrapper.
- [Oracle: The java Command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html): `MaxRAMPercentage`, `UseContainerSupport`, NMT, heap dump.
- [Oracle: GC Tuning Guide (JDK 21), Ergonomics](https://docs.oracle.com/en/java/javase/21/gctuning/ergonomics.html): chọn GC và heap mặc định.
- [Oracle: jcmd](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html): heap dump, thread dump, native memory.
- [Spring Boot: Kubernetes Probes](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html#actuator.endpoints.kubernetes-probes): liveness và readiness group.
- [Spring Boot: Graceful Shutdown](https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html): graceful shutdown (mặc định từ 3.4).
- [Spring Boot: Externalized Configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html): relaxed binding, configtree.
- [Spring Boot: Efficient Container Images](https://docs.spring.io/spring-boot/reference/packaging/container-images/efficient-images.html): layered jar.
- [Jib](https://github.com/GoogleContainerTools/jib): build image không cần Dockerfile.
- [Apache Kafka: Consumer Configs](https://kafka.apache.org/documentation/#consumerconfigs): `max.poll.interval.ms`.
