# 08. Docker & Container Images

> Câu hỏi viết bằng tiếng Anh (như khi phỏng vấn), đáp án viết bằng tiếng Việt.

---

### 1. What is a container, technically? How is it different from a VM?
<details><summary>Đáp án</summary>

Container là **process (nhóm process) bị cô lập** trên kernel của host, dựng bằng hai cơ chế:
- **Namespaces**: giới hạn những gì process *nhìn thấy* (pid, net, mnt, uts, ipc, user, cgroup).
- **cgroups**: giới hạn những gì process *được dùng* (CPU, memory, PID, I/O).

Container còn có root filesystem riêng từ image. VM thì có **kernel riêng** chạy trên hypervisor. So với VM, container nhẹ và khởi động nhanh hơn, nhưng **dùng chung kernel** nên mức cô lập yếu hơn, và container Linux cần kernel Linux.
</details>

### 2. What is an image? Explain layers and copy-on-write.
<details><summary>Đáp án</summary>

- Image là tập **các layer chỉ đọc** xếp chồng (mỗi lệnh thay đổi filesystem trong Dockerfile tạo một layer) cộng với **config** (entrypoint, env, user) và **manifest**.
- Khi chạy, runtime thêm một **layer ghi được** riêng cho container. Thay đổi file từ layer dưới thì file được **copy lên layer ghi** (copy-on-write). Storage driver thường dùng là overlay2/overlayfs.
- Các image dùng chung layer (cùng base) chỉ lưu và pull một lần.
- Xóa file ở layer sau **không làm image nhỏ đi**, vì file vẫn nằm ở layer trước.
</details>

### 3. Tag vs digest.
<details><summary>Đáp án</summary>

- **Tag** (`app:1.2`) là nhãn **có thể bị trỏ sang image khác**.
- **Digest** (`app@sha256:...`) là hash nội dung manifest, **bất biến**.
- Deploy bằng digest đảm bảo chạy đúng byte đã được test. Tag theo commit SHA là cách thực tế dễ đọc hơn, với điều kiện không bao giờ ghi đè.
</details>

### 4. `CMD` vs `ENTRYPOINT`. How do they combine?
<details><summary>Đáp án</summary>

- `ENTRYPOINT`: chương trình chính, cố định.
- `CMD`: tham số mặc định, hoặc lệnh mặc định nếu không có `ENTRYPOINT`.
- `docker run image arg1` **thay `CMD`**, không thay `ENTRYPOINT`. Muốn thay `ENTRYPOINT` phải dùng `--entrypoint`.
- Mẫu phổ biến: `ENTRYPOINT ["java","-jar","/app/app.jar"]` + `CMD ["--spring.profiles.active=prod"]`.
- Trong Kubernetes: `command` thay `ENTRYPOINT`, `args` thay `CMD`.
</details>

### 5. Exec form vs shell form. Why does it matter for graceful shutdown?
<details><summary>Đáp án</summary>

- **Shell form** (`CMD java -jar app.jar`) chạy qua `/bin/sh -c`, nên **shell là PID 1** và Java là process con. Khi `docker stop` hoặc Kubernetes gửi **SIGTERM** tới PID 1, nhiều shell **không chuyển tiếp** signal. App không tắt gọn và bị SIGKILL sau grace period.
- **Exec form** (`CMD ["java","-jar","app.jar"]`) cho app **là PID 1**, nhận SIGTERM trực tiếp.
- Nếu cần script khởi động thì kết thúc script bằng `exec java ...`.
</details>

### 6. What special responsibilities does PID 1 have inside a container?
<details><summary>Đáp án</summary>

- Kernel **không áp dụng hành động mặc định của signal** cho PID 1 nếu nó không tự đăng ký handler. Ví dụ SIGTERM có thể bị bỏ qua.
- PID 1 phải **dọn process zombie** (reap process con mồ côi).
- Ứng dụng thường không làm hai việc này, nên có thể dùng init nhỏ như **tini** (`docker run --init`, hoặc `ENTRYPOINT ["tini","--", ...]`).
</details>

### 7. `COPY` vs `ADD`.
<details><summary>Đáp án</summary>

`COPY` chỉ sao chép file hoặc thư mục từ build context. `ADD` có thêm khả năng **tự giải nén tar cục bộ** và **tải từ URL** (ngầm và khó đoán). Best practice là dùng `COPY`, chỉ dùng `ADD` khi thực sự cần giải nén tar.
</details>

### 8. `ARG` vs `ENV`.
<details><summary>Đáp án</summary>

- `ARG`: biến **lúc build** (`--build-arg`), không có trong container khi chạy. `ARG` đặt trước `FROM` chỉ dùng được trong dòng `FROM`.
- `ENV`: biến môi trường **lưu trong image**, có khi chạy container.
- **Không truyền secret qua `ARG` hoặc `ENV`**: chúng lộ trong lịch sử image (`docker history`) hoặc metadata. Dùng BuildKit secret mount (`RUN --mount=type=secret`).
</details>

### 9. Explain a multi-stage build for a Java application.
<details><summary>Đáp án</summary>

```dockerfile
# Stage 1: build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -B dependency:go-offline        # layer dependency được cache
COPY src ./src
RUN mvn -B -DskipTests package

# Stage 2: runtime
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r -u 10001 app
COPY --from=build /src/target/app.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","/app/app.jar"]
```
Image cuối chỉ có JRE và jar, không có Maven, mã nguồn hay JDK. Nhờ vậy image nhỏ hơn và có ít lỗ hổng hơn.
</details>

### 10. How does Docker layer caching work and how do you order instructions to benefit from it?
<details><summary>Đáp án</summary>

Mỗi lệnh được cache theo chính lệnh đó và nội dung file nó dùng (với `COPY`/`ADD`). **Một layer thay đổi thì mọi layer phía sau phải build lại.** Vì vậy:
- Đặt những thứ **ít thay đổi lên trước**: base image, cài package hệ thống, `COPY pom.xml` + tải dependency.
- Mã nguồn (thay đổi thường xuyên) đặt sau cùng.
- Gộp `apt-get update && apt-get install ... && rm -rf /var/lib/apt/lists/*` trong **một** `RUN`.
- Trong CI không có cache cục bộ thì dùng **cache từ registry** (`--cache-from`, BuildKit `--cache-to type=registry`).
</details>

### 11. What is `.dockerignore` and why does it matter?
<details><summary>Đáp án</summary>

File liệt kê những gì **không gửi vào build context**: `.git`, `target/`, `node_modules`, file `.env`, secret. Lợi ích:
- Build nhanh hơn (context nhỏ).
- Không vô tình `COPY . .` đưa secret hoặc file rác vào image.
- Không làm mất cache vì file không liên quan thay đổi.
</details>

### 12. How do you reduce image size and attack surface?
<details><summary>Đáp án</summary>

- Multi-stage build.
- Base image tối giản: `-jre`, `-slim`, **distroless**, hoặc Alpine (musl libc có thể gây khác biệt với một số thư viện native).
- Không cài công cụ không cần thiết. Dọn cache của package manager trong cùng layer.
- Chạy **non-root** (`USER`).
- Quét lỗ hổng bằng Trivy hoặc Grype, cập nhật base image định kỳ.
- Ghim phiên bản base image (tag cụ thể hoặc digest).
</details>

### 13. Why run containers as non-root? How?
<details><summary>Đáp án</summary>

Nếu kẻ tấn công thoát được khỏi app, chạy root trong container làm tăng nguy cơ leo thang lên host (dù có namespace, vẫn dùng chung kernel). Cách làm:
- Tạo user trong Dockerfile và dùng `USER 10001`.
- Ở Kubernetes đặt `runAsNonRoot: true`, `runAsUser`.
- Port dưới 1024 cần quyền đặc biệt, nên app nghe 8080.
- Thư mục cần ghi phải thuộc user đó.
</details>

### 14. Does Kubernetes use the Dockerfile `HEALTHCHECK`?
<details><summary>Đáp án</summary>

**Không.** Kubernetes bỏ qua `HEALTHCHECK` của image. Phải khai báo `livenessProbe`, `readinessProbe`, `startupProbe` trong Pod spec. `HEALTHCHECK` chỉ có tác dụng với Docker Engine hoặc Docker Compose (và Docker Swarm).
</details>

### 15. Volumes vs bind mounts vs tmpfs.
<details><summary>Đáp án</summary>

- **Volume**: do Docker quản lý (`/var/lib/docker/volumes`), bền vững, dễ backup, nên dùng cho dữ liệu.
- **Bind mount**: gắn một đường dẫn cụ thể của host. Hữu ích khi dev (mount mã nguồn), nhưng phụ thuộc cấu trúc host và quyền file.
- **tmpfs**: nằm trong RAM, mất khi container dừng. Dùng cho dữ liệu tạm hoặc nhạy cảm.
- Dữ liệu ghi vào layer ghi của container **mất khi xóa container**.
</details>

### 16. Explain Docker network drivers: bridge, host, none, user-defined bridge.
<details><summary>Đáp án</summary>

- **bridge** (mặc định): mạng riêng qua bridge `docker0`, ra ngoài bằng NAT, mở port bằng `-p host:container`.
- **user-defined bridge**: giống bridge nhưng có **DNS nội bộ theo tên container**, nên các container gọi nhau bằng tên. Docker Compose dùng loại này.
- **host**: dùng chung network namespace của host, không NAT, không cô lập port.
- **none**: không có mạng.
- `EXPOSE` chỉ là **tài liệu**, không tự mở port.
</details>

### 17. Explain the container runtime stack: Docker, containerd, runc, OCI.
<details><summary>Đáp án</summary>

- **OCI** định nghĩa chuẩn **image** và **runtime**.
- **runc**: runtime cấp thấp, gọi kernel để tạo namespace và cgroup rồi chạy process.
- **containerd**: runtime cấp cao, quản lý image, snapshot và vòng đời container, gọi runc.
- **Docker Engine** (`dockerd`): thêm CLI, build, network, volume, chạy trên containerd.
- **Kubernetes** gọi containerd hoặc CRI-O qua **CRI**, không cần Docker.
- **Podman**: không có daemon, hỗ trợ rootless, CLI tương thích Docker.
</details>

### 18. What are restart policies in Docker?
<details><summary>Đáp án</summary>

- `no` (mặc định).
- `on-failure[:max]`: chỉ khi exit code khác 0.
- `always`: luôn khởi động lại, kể cả sau khi daemon khởi động lại.
- `unless-stopped`: như `always` nhưng không khởi động lại nếu đã bị dừng thủ công.
</details>

### 19. `docker exec` vs `docker attach`; `docker logs`; `docker inspect`.
<details><summary>Đáp án</summary>

- `exec`: chạy **process mới** trong container đang chạy (ví dụ `sh`).
- `attach`: gắn terminal vào **process chính** (stdin/stdout của PID 1). Nhấn Ctrl+C có thể dừng container.
- `logs`: đọc stdout/stderr của container (qua logging driver).
- `inspect`: JSON đầy đủ (mount, network, IP, env, trạng thái, exit code, `OOMKilled`).
</details>

### 20. How do you list running containers and all containers? How do you clean up disk space?
<details><summary>Đáp án</summary>

```bash
docker ps            # đang chạy
docker ps -a         # tất cả, kể cả đã dừng
docker system df     # dung lượng image/container/volume/cache
docker image prune   # image dangling; thêm -a để xóa mọi image không được dùng
docker system prune  # container dừng, network không dùng, image dangling, build cache
```
Cẩn thận với `--volumes` vì nó xóa dữ liệu.
</details>

### 21. A container keeps restarting. What are the common causes?
<details><summary>Đáp án</summary>

- Process chính **thoát** (lỗi cấu hình, thiếu biến môi trường, không kết nối được dependency). Xem `docker logs`.
- **OOM**: `docker inspect` thấy `"OOMKilled": true`, exit 137.
- Lệnh chạy sai (exit 127), thiếu quyền thực thi (126).
- Process chính là lệnh chạy nền (daemon) nên **thoát ngay**. Container sống bằng process chính, vì vậy process này phải chạy ở foreground.
- Health check fail cùng với orchestrator restart.
</details>

### 22. What is the difference between `docker save/load` and `docker export/import`?
<details><summary>Đáp án</summary>

- `save/load`: lưu **image** gồm mọi layer, tag và metadata ra file tar. Dùng để chuyển image sang máy không có registry.
- `export/import`: lưu **filesystem của container** đã gộp phẳng (một layer), **mất** lịch sử, ENTRYPOINT, ENV.
</details>

### 23. What is a multi-architecture image?
<details><summary>Đáp án</summary>

Một tag trỏ tới **manifest list / OCI image index**, chứa image cho nhiều nền tảng (`linux/amd64`, `linux/arm64`). Runtime tự pull đúng kiến trúc. Build bằng `docker buildx build --platform linux/amd64,linux/arm64 --push`. Thiếu kiến trúc thì lỗi `no matching manifest` hoặc `exec format error`.
</details>

### 24. What is BuildKit and what features does it bring?
<details><summary>Đáp án</summary>

BuildKit là backend build mặc định của Docker hiện nay. Tính năng:
- Build **song song** các stage độc lập, bỏ qua stage không dùng tới.
- **Cache mount** (`RUN --mount=type=cache,target=/root/.m2`).
- **Secret mount** (không lưu vào layer), SSH mount.
- Xuất và nhập cache ra registry.
- Build đa nền tảng (với buildx).
</details>

### 25. How do you scan and sign images?
<details><summary>Đáp án</summary>

- **Scan**: Trivy, Grype, hoặc tính năng container scanning của GitLab, chạy trong CI. Chặn pipeline nếu có lỗ hổng Critical hoặc High **có bản sửa**.
- **SBOM**: Syft hoặc Trivy sinh danh sách thành phần.
- **Sign**: `cosign sign` (Sigstore), sau đó kiểm tra chữ ký bằng admission policy (Kyverno, Sigstore policy-controller) trước khi cho chạy trong cluster.
</details>

### 26. What is the difference between `docker compose` and Kubernetes?
<details><summary>Đáp án</summary>

Compose mô tả ứng dụng nhiều container **trên một máy**, phù hợp cho dev local và test. Kubernetes là orchestrator **nhiều node**: tự lập lịch, tự phục hồi, scale, rolling update, service discovery, quản lý cấu hình, bí mật và storage. Compose có thể dùng để dựng nhanh Kafka, Cassandra cho dev, nhưng không dùng cho production cần HA.
</details>

### 27. How does a container see CPU and memory limits? Why do `free` and `top` inside a container show the host's memory?
<details><summary>Đáp án</summary>

Limit được áp bằng **cgroups**. `/proc/meminfo` và `/proc/cpuinfo` không được namespace hóa, nên `free` và `top` hiển thị tài nguyên **của host**. Ứng dụng cần đọc giới hạn thực từ cgroup (`/sys/fs/cgroup/memory.max`, `cpu.max` với cgroup v2). JVM hiện đại đọc được cgroup (`UseContainerSupport`). Phần mềm cũ thì tưởng mình có cả RAM của host, dẫn tới OOM.
</details>

### 28. What is the build context and why can `COPY ../file` fail?
<details><summary>Đáp án</summary>

Build context là thư mục (hoặc URL) gửi cho builder. `COPY` chỉ truy cập được file **bên trong context**. `../file` nằm ngoài context nên bị từ chối. Cách xử lý: đổi context (`docker build -f path/Dockerfile .` từ thư mục cha) hoặc dùng named context của buildx (`--build-context`).
</details>

### 29. What is Podman rootless and what are its limitations?
<details><summary>Đáp án</summary>

Podman chạy container **không cần daemon** và **không cần root**, nhờ **user namespace**: UID 0 trong container ánh xạ sang UID thường của user trên host (dải trong `/etc/subuid`, `/etc/subgid`). Hạn chế:
- Không bind port dưới 1024 nếu chưa chỉnh `net.ipv4.ip_unprivileged_port_start`.
- Mạng rootless (slirp4netns, pasta) có thể chậm hơn.
- Một số thao tác cần quyền kernel không làm được.
- Quyền file trên volume liên quan tới ánh xạ UID.
- SELinux cần nhãn `:Z`/`:z` khi mount.
</details>

### 30. Why is the `latest` tag considered harmful?
<details><summary>Đáp án</summary>

- Không biết `latest` thực sự là phiên bản nào. Mỗi node có thể chạy một bản khác nhau.
- Không rollback được về "latest cũ".
- Kubernetes mặc định `imagePullPolicy: Always` với `latest`, nên mỗi lần khởi động đều phụ thuộc registry.
- Build không tái lập được.
- Nên dùng tag theo version hoặc SHA, hoặc digest.
</details>

---

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [Docker: What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/): khái niệm container.
- [Dockerfile reference](https://docs.docker.com/reference/dockerfile/): `CMD`, `ENTRYPOINT`, exec và shell form, `ARG`, `ENV`, `COPY`, `ADD`.
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/): build nhiều giai đoạn.
- [Docker build cache](https://docs.docker.com/build/cache/): cơ chế cache và tối ưu.
- [Building best practices](https://docs.docker.com/build/building/best-practices/): best practice khi viết Dockerfile.
- [Build secrets](https://docs.docker.com/build/building/secrets/): truyền secret an toàn khi build.
- [Multi-platform builds](https://docs.docker.com/build/building/multi-platform/): image đa kiến trúc.
- [Storage drivers / OverlayFS](https://docs.docker.com/engine/storage/drivers/overlayfs-driver/): layer và copy-on-write.
- [Networking overview](https://docs.docker.com/engine/network/): các network driver.
- [Start containers automatically](https://docs.docker.com/engine/containers/start-containers-automatically/): restart policy.
- [OCI Image Specification](https://github.com/opencontainers/image-spec): chuẩn image.
- [Linux man-pages: namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html) và [cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html): nền tảng kernel của container.
