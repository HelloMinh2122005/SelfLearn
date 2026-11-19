# 🏁 Capstones — 6_1 Container Fundamentals

> **Khóa học**: Cloud DevOps Basic — Containers & Kubernetes
> **Phân nhóm**: 6 Domain 6 - Containers and Kubernetes › 6_1 Container Fundamentals
> **Mục đích**: mỗi lesson 6_1_1 → 6_1_10 có **một capstone** gồm nhiều bài tập, ép bạn dùng **mọi** kiến thức của lesson đó trên máy thật, rồi tự chứng minh bằng output.
> **Quay lại**: [README của 6_1](../README.md) · [CHECKLIST](../../../CHECKLIST.md#6_1-container-fundamentals)
> **Trạng thái kiểm chứng** (18-11-2026): lệnh của các capstone đã được chạy trên Fedora 43, kernel 7.3.3, Podman 5.8.9 **rootless**, crun 1.28, cgroup v2, SELinux Enforcing. Những chỗ **chưa chạy được** (Docker Engine thật, cluster Kubernetes, biến thể rootful cần `sudo`) được đánh dấu rõ trong từng file.

---

## 📋 Danh Sách Capstone

| Lesson | Capstone | Chủ đề điều tra | Bài | Thời gian |
| :--- | :--- | :--- | :-: | :-: |
| 6_1_1 | [Containers vs Virtual Machines](<./6_1_1 Capstone - Containers vs Virtual Machines.md>) | Chứng minh chung kernel, container = process, mặc định không giới hạn; viết ADR VM/container | 4 | 1,5–2 giờ |
| 6_1_2 | [Linux Namespaces for Containers](<./6_1_2 Capstone - Linux Namespaces for Containers.md>) | Tự dựng "container thô": `unshare`, PID 1, `veth`, `clone/unshare/setns` bằng C, user/time ns | 6 | 3–4 giờ |
| 6_1_3 | [Control Groups v2 for Containers](<./6_1_3 Capstone - Control Groups v2 for Containers.md>) | OOM, CPU throttle, fork bomb, exit 137/143, bẫy swap | 6 | 3–4 giờ |
| 6_1_4 | [Images Layers and Overlay Filesystem](<./6_1_4 Capstone - Images Layers and Overlay Filesystem.md>) | Overlay bằng tay, secret còn trong layer, lớp ghi, digest/tag, từ image đến process | 6 | 3–4 giờ |
| 6_1_5 | [Open Container Initiative Specifications](<./6_1_5 Capstone - Open Container Initiative Specifications.md>) | Đọc OCI image, chạy bundle bằng `crun`, hỏi registry bằng `curl`, OCI vs Docker format | 5 | 3–4 giờ |
| 6_1_6 | [Container Runtimes and Ecosystem](<./6_1_6 Capstone - Container Runtimes and Ecosystem.md>) | Bản đồ Docker/Podman/CRI; `conmon`; API theo yêu cầu; lỗi ở tầng nào | 6 | 2,5–3 giờ |
| 6_1_7 | [Container Security Fundamentals](<./6_1_7 Capstone - Container Security Fundamentals.md>) | UID mapping, capabilities, seccomp, SELinux, `--privileged`, gia cố `hello-svc` có script kiểm tra | 6 | 3–4 giờ |
| 6_1_8 | [Container Lifecycle PID 1 and Signals](<./6_1_8 Capstone - Container Lifecycle PID 1 and Signals.md>) | Sự cố "stop treo 10 giây rồi 137": ba cách sửa, `check-stop.sh`, zombie, bảng exit code | 7 | 3,5–4,5 giờ |
| 6_1_9 | [Container Networking Basics](<./6_1_9 Capstone - Container Networking Basics.md>) | `veth`/bridge thật, pasta, publish cổng, DNS, thang chẩn đoán "cổng không vào được", `tcpdump` | 7 | 3,5–4,5 giờ |
| 6_1_10 | [Container Data Storage](<./6_1_10 Capstone - Container Data Storage.md>) | Bộ đếm sống sót qua rolling update, bind mount nguy hiểm, tmpfs ăn RAM, quyền file rootless | 7 | 3–4 giờ |

**Thứ tự gợi ý**: 6_1_1 → 6_1_2 → 6_1_3 → 6_1_4 → 6_1_8 (dùng lại kiến thức cgroup/namespace) → 6_1_7 → 6_1_9 → 6_1_10 → 6_1_5 → 6_1_6. Có thể làm theo đúng thứ tự lesson; mỗi capstone độc lập, chỉ vài chỗ tham chiếu chéo.

## 🧭 Cấu Trúc Mỗi Capstone

1. **Kịch bản** thực tế (một sự cố hoặc yêu cầu công việc).
2. **Bản đồ phủ kiến thức (Coverage)**: bảng *mục trong lesson → bài tập*, để bạn tự kiểm tra capstone có phủ hết lesson.
3. **Bài tập** (nhiều bài), mỗi bài có **Yêu cầu → lệnh → Tiêu chí hoàn thành → Đáp án tham chiếu** (đáp án nằm trong `<details>`: tự làm trước rồi mới mở).
4. **Nghiệm thu** + **Câu hỏi bảo vệ** (kiểu phỏng vấn) + **Dọn dẹp** + **Nguồn chính thống**.

## ⚙️ Chuẩn Bị Chung

```bash
podman --version            # Podman 5.x; với Docker: đổi podman thành docker (một số bài dùng tính năng riêng của Podman, được ghi chú)
stat -fc %T /sys/fs/cgroup  # cgroup2fs
podman image exists selflearn.invalid/hello-svc:1.0.0 || bash ../../../shared/scripts/build-images.sh
```

- **Không cần root** cho mọi bài chạy được; bài cần `sudo` được ghi rõ và **chưa chạy thử**.
- Tên tài nguyên có tiền tố `c<N>-` (ví dụ `c3-lim`, `c7-hard`, `c9net`) để dọn dẹp chính xác bằng tên. **Không** dùng lệnh dọn hàng loạt (`prune`, `rm -a`): chúng xóa cả dữ liệu của dự án khác.
- Cổng dùng: `18080`–`18090` và `5055`. Nếu trùng, đổi cổng trong lệnh.

## 🔎 Những Điều Capstone Phát Hiện Vượt Ra Ngoài Lesson

Trong lúc kiểm chứng, một số kết quả **không có hoặc khác** với mô tả trong lesson/README; chúng được ghi trong từng capstone, và đáng được cân nhắc cập nhật lesson:

| Phát hiện | Ở đâu | Ảnh hưởng |
| :--- | :--- | :--- |
| Máy có swap: `--memory` đơn lẻ **không** làm container bị OOM kill khi vượt giới hạn (Podman đặt `memory.swap.max`); cần `--memory-swap` bằng `--memory` | [6_1_3 Bài 2](<./6_1_3 Capstone - Control Groups v2 for Containers.md>) | **Lab 6_1_2** ở [README của 6_1](../README.md#lab-6_1_2-oom-signals-and-jvm-memory) có thể không ra 137 |
| PID 1 không tự `SIGKILL` được chính mình (exit `0`, không phải `137`) | [6_1_3 Bài 5](<./6_1_3 Capstone - Control Groups v2 for Containers.md>), [6_1_8 Bài 6](<./6_1_8 Capstone - Container Lifecycle PID 1 and Signals.md>) | Ví dụ tạo 137/143 phải dùng process không phải PID 1 hoặc kill từ ngoài |
| `OOMKilled=false` dù `oom_kill=1` khi process bị kill là process `exec`; `OOMKilled=true` nhưng exit `0` khi chỉ process con bị kill | [6_1_3](<./6_1_3 Capstone - Control Groups v2 for Containers.md>), [6_1_10](<./6_1_10 Capstone - Container Data Storage.md>) | Không dựa vào một chỉ báo OOM duy nhất |
| `--init` + shell form: dừng nhanh, exit 143, nhưng **JVM không chạy shutdown hook** | [6_1_8 Bài 3](<./6_1_8 Capstone - Container Lifecycle PID 1 and Signals.md>) | "Dừng nhanh" ≠ "tắt gọn" |
| Rootless: `nsenter -n` đơn lẻ lỗi; cần `-U` (hoặc `podman unshare`) | [6_1_2 Bài 1](<./6_1_2 Capstone - Linux Namespaces for Containers.md>) | Mục 4.3 của lesson 6_1_2 chỉ đúng cho container rootful |
| Rootless: cổng publish do tiến trình `pasta` lắng nghe, `veth`/bridge nằm trong netns của Podman (`podman unshare --rootless-netns`) | [6_1_9 Bài 1, 3](<./6_1_9 Capstone - Container Networking Basics.md>) | Bổ sung cho mục 4.2 của lesson 6_1_9 |
| Time namespace của container **giống máy chủ** | [6_1_1 Bài 2](<./6_1_1 Capstone - Containers vs Virtual Machines.md>) | "Bộ namespace riêng" không phải luôn đủ cả 8 loại |
| `HEALTHCHECK` biến mất khi build `--format oci` | [6_1_5 Bài 4](<./6_1_5 Capstone - Open Container Initiative Specifications.md>) | Minh họa "tính năng ngoài chuẩn" |
| Volume ẩn danh bị xóa theo container khi dùng `--rm`; `:U` đổi chủ file **trên máy chủ** | [6_1_10 Bài 2, 5](<./6_1_10 Capstone - Container Data Storage.md>) | Bổ sung cho lesson 6_1_10 |

> Lesson gốc được giữ nguyên; các điểm trên **chưa được đưa vào lesson** và **chưa qua verifier độc lập** (G5). Hãy xem chúng là quan sát trên một máy cụ thể, đối chiếu tài liệu chính thức trước khi dựa vào.

## 🧹 Dọn Dẹp Toàn Bộ (nếu bỏ dở)

```bash
# Liệt kê tài nguyên do capstone tạo (tiền tố c1- ... c10-), kiểm tra bằng mắt rồi mới xóa:
podman ps -a  --format '{{.Names}}' | grep -E '^c[0-9]+-'
podman images --format '{{.Repository}}:{{.Tag}}' | grep -E '^localhost/c[0-9]+-'
podman volume ls -q | grep -E '^c[0-9]+-'
podman network ls --format '{{.Name}}' | grep -E '^c[0-9]+net$'
```

Sau khi xem danh sách, xóa **từng mục** bằng `podman rm -f -t 0 <tên>`, `podman rmi <tên>`, `podman volume rm <tên>`, `podman network rm <tên>`.

## 📚 Nguồn Tài Liệu Chính Thống (Official References)
- [namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html) và [cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html) — Nền tảng của container ở tầng kernel.
- [Control Group v2 — Linux Kernel documentation](https://docs.kernel.org/admin-guide/cgroup-v2.html) — Đặc tả cgroup v2.
- [Overlay Filesystem — Linux Kernel documentation](https://docs.kernel.org/filesystems/overlayfs.html) — overlayfs.
- [OCI Runtime Specification](https://github.com/opencontainers/runtime-spec/blob/main/spec.md), [Image Specification](https://github.com/opencontainers/image-spec/blob/main/spec.md) và [Distribution Specification](https://github.com/opencontainers/distribution-spec/blob/main/spec.md) — Ba đặc tả OCI.
- [Podman documentation](https://docs.podman.io/en/latest/) — Tài liệu chính thức Podman.
- [Docker Docs — Resource constraints](https://docs.docker.com/engine/containers/resource_constraints/) — Giới hạn bộ nhớ/CPU cho container.
- [Kubernetes — Container Runtimes](https://kubernetes.io/docs/setup/production-environment/container-runtimes/) — CRI, containerd, CRI-O.
