# RESEARCH LEDGER: TASK-CTR-6_2_6 - Image Security

**Researcher**: main session (không dùng subagent); **Ngày**: 16-11-2026; **Status**: COMPLETE (chờ `evidence.py quotes`)

#### Claim Ledger
| ID | Lesson | Atomic claim | URL + section đã mở | Trích dẫn nguyên văn (≤ 300 ký tự) | Áp dụng cho (phiên bản/nền tảng) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| R6.1 | 6_2_6 | Nếu dịch vụ chạy được không cần đặc quyền, dùng USER để chuyển sang user không phải root. | https://docs.docker.com/build/building/best-practices/ (USER) | "If a service can run without privileges, use USER to change to a non-root user." | Docker best practices | VERIFIED |
| R6.2 | 6_2_6 | Build arg và biến môi trường không phù hợp để truyền secret vì chúng tồn tại trong image cuối. | https://docs.docker.com/build/building/secrets/ | "Build arguments and environment variables are inappropriate for passing secrets to your build, because they persist in the final image." | Docker Build | VERIFIED |
| R6.3 | 6_2_6 | Nên dùng secret mount hoặc SSH mount để đưa secret vào build an toàn. | https://docs.docker.com/build/building/secrets/ | "Instead, you should use secret mounts or SSH mounts, which expose secrets to your builds securely." | Docker Build | VERIFIED |
| R6.4 | 6_2_6 | Dùng secret mount bằng cờ --mount=type=secret trong lệnh RUN. | https://docs.docker.com/build/building/secrets/ | "use the --mount=type=secret flag in the Dockerfile." | Docker Build | VERIFIED |
| R6.5 | 6_2_6 | Secret mount lấy secret từ build client và chỉ cung cấp tạm thời bên trong build container. | https://docs.docker.com/build/building/secrets/ | "A secret mount takes a secret from the build client and makes it temporarily available inside the build container" | Docker Build | VERIFIED |
| R6.6 | 6_2_6 | Trivy tìm lỗ hổng, misconfiguration, secret, SBOM trong container, Kubernetes, kho mã và nhiều thứ khác. | https://github.com/aquasecurity/trivy | "Find vulnerabilities, misconfigurations, secrets, SBOM in containers, Kubernetes, code repositories, clouds and more" | Trivy (GitHub) | VERIFIED |
| R6.7 | 6_2_6 | Grype là công cụ quét lỗ hổng cho image container và filesystem. | https://github.com/anchore/grype | "A vulnerability scanner for container images and filesystems" | Grype (GitHub) | VERIFIED |
| R6.8 | 6_2_6 | Cosign ký OCI container (và artifact khác) bằng Sigstore. | https://github.com/sigstore/cosign | "Signing OCI containers (and other artifacts) using Sigstore!" | cosign (GitHub) | VERIFIED |
| R6.9 | 6_2_6 | Xóa file ở layer sau chỉ được ghi lại (whiteout) mà không đổi layer dưới, nên nội dung đã đưa vào layer trước vẫn nằm trong image. | https://docs.kernel.org/filesystems/overlayfs.html | "In order to support rm and rmdir without changing the lower filesystem, an overlay filesystem needs to record in the upper filesystem that files have been removed." | Linux overlayfs | VERIFIED |
| R6.10 | 6_2_6 | Distroless không có shell hay package manager nên giảm bề mặt tấn công (suy ra từ nội dung). | https://github.com/GoogleContainerTools/distroless | "They do not contain package managers, shells or any other programs you would expect to find in a standard Linux distribution." | distroless (GitHub) | VERIFIED |
| R6.11 | 6_2_6 | Để image cập nhật và an toàn, rebuild thường xuyên. | https://docs.docker.com/build/building/best-practices/ (Rebuild your images often) | "To keep your images up-to-date and secure, rebuild your images regularly with updated dependencies." | Docker best practices | VERIFIED |
